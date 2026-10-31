"""
Reference / mock implementation of the ViMo pipeline (arXiv:2504.13936).

Implemented faithfully from the paper:
  * STR construction (Sec 3.2.1): OCR -> overlay each text with a white box + black border.
  * Text-symbol localisation (App. A.1): black mask in BGR [0..50], contour/bbox area ratio > 0.8,
    >50% white pixels in BGR [200..255] inside.
  * Text overlay (App. A.1): edge-average background colour, black/white text for contrast,
    largest font that fits the symbol.
  * Action selection scoring (App. A.2): valid -> +confidence, invalid -> -confidence, then top-2.

Mocked (swap in your real models):
  * STR predictor  -> identity (returns current STR). Replace with fine-tuned InstructPix2Pix.
  * LLM calls      -> heuristics. Replace with GPT-4o / Gemini using prompts G.1-G.5.
  * s_gc           -> histogram/pixel similarity instead of DINO features.
"""
from __future__ import annotations

import base64
import io
import os
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR / "vendor"))  # vendored rapidocr_onnxruntime (uses headless OpenCV)

# VIMO_OCR=off forces the OCR-free fallback (OpenCV text-region detector: boxes only, no recognised text).
_OCR = None
if os.getenv("VIMO_OCR", "auto") != "off":
    try:
        from rapidocr_onnxruntime import RapidOCR  # PaddleOCR models via ONNX

        _OCR = RapidOCR()
    except Exception:  # pragma: no cover
        _OCR = None
OCR_NAME = "rapidocr (PaddleOCR ONNX)" if _OCR else "opencv text-region detector (no recognition)"

FONT_PATH = str(Path(__file__).resolve().parent / "fonts" / "DejaVuSans.ttf")  # bundled; works on any host
MAX_SIDE = 1400


# ----------------------------------------------------------------------------- utils
def load_image(data: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(data)).convert("RGB")
    w, h = img.size
    s = min(1.0, MAX_SIDE / max(w, h))
    if s < 1:
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def to_data_uri(bgr: np.ndarray) -> str:
    # JPEG keeps a 5-image response well under serverless body limits (Vercel: 4.5 MB)
    ok, buf = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return "data:image/jpeg;base64," + base64.b64encode(buf.tobytes()).decode()


def _font(size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except OSError:
        return ImageFont.load_default()


@dataclass
class Box:
    x: int
    y: int
    w: int
    h: int
    text: str = ""
    score: float = 1.0

    def iou(self, o: "Box") -> float:
        x1, y1 = max(self.x, o.x), max(self.y, o.y)
        x2, y2 = min(self.x + self.w, o.x + o.w), min(self.y + self.h, o.y + o.h)
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        u = self.w * self.h + o.w * o.h - inter
        return inter / u if u else 0.0


# ----------------------------------------------------------------------------- 1. OCR + STR
def _detect_text_regions(img: np.ndarray) -> list[Box]:
    """OCR-free fallback: morphological text-region detection (locations only)."""
    H, W = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    _, bw = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    joined = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (max(9, W // 60), 3)))
    contours, _ = cv2.findContours(joined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if h < 10 or h > H * 0.08 or w < 12 or w > W * 0.9:
            continue
        if w / h < 1.0:  # text lines are wider than tall
            continue
        fill = (bw[y : y + h, x : x + w] > 0).mean()
        if not 0.12 < fill < 0.75:  # skip solid shapes and empty outlines
            continue
        boxes.append(Box(x, y, w, h, "", 0.5))
    return boxes


def detect_text(img: np.ndarray) -> list[Box]:
    if _OCR is None:
        return _detect_text_regions(img)
    result, _ = _OCR(img)
    boxes = []
    for pts, text, score in result or []:
        pts = np.array(pts, dtype=np.float32)
        x, y = pts.min(0)
        x2, y2 = pts.max(0)
        boxes.append(Box(int(x), int(y), int(x2 - x), int(y2 - y), text, float(score)))
    return boxes


def filter_static_text(boxes: list[Box], h: int) -> tuple[list[Box], list[Box]]:
    """Paper uses an LLM to keep static text (keyboard keys, clock faces) as pixels.
    Mock heuristic: short (<=2 char) tokens in the bottom 45% that form a dense cluster = keyboard."""
    cand = [b for b in boxes if len(b.text.strip()) <= 2 and b.y > 0.55 * h]
    static = cand if len(cand) >= 10 else []
    dyn = [b for b in boxes if b not in static]
    return dyn, static


def build_str(img: np.ndarray, boxes: list[Box], pad: int = 2, border: int = 2) -> np.ndarray:
    out = img.copy()
    H, W = out.shape[:2]
    for b in boxes:
        x1, y1 = max(0, b.x - pad), max(0, b.y - pad)
        x2, y2 = min(W - 1, b.x + b.w + pad), min(H - 1, b.y + b.h + pad)
        cv2.rectangle(out, (x1, y1), (x2, y2), (255, 255, 255), -1)
        cv2.rectangle(out, (x1, y1), (x2, y2), (0, 0, 0), border)
    return out


# ----------------------------------------------------------------------------- 2. STR predictor
def predict_str(str_img: np.ndarray, action: str) -> np.ndarray:
    """MOCK: identity. Real ViMo: InstructPix2Pix fine-tuned on (STR_k, action) -> STR_{k+1}."""
    return str_img.copy()


# ----------------------------------------------------------------------------- 3. symbol localisation (App. A.1)
def locate_symbols(str_img: np.ndarray) -> list[Box]:
    black = cv2.inRange(str_img, (0, 0, 0), (50, 50, 50))
    contours, _ = cv2.findContours(black, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    white_mask = cv2.inRange(str_img, (200, 200, 200), (255, 255, 255))
    found: list[Box] = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w < 8 or h < 6:
            continue
        if cv2.contourArea(c) / float(w * h) <= 0.8:
            continue
        inner = white_mask[y + 2 : y + h - 2, x + 2 : x + w - 2]
        if inner.size == 0 or (inner > 0).mean() <= 0.5:
            continue
        found.append(Box(x, y, w, h))
    # outer & inner border contours describe the same symbol -> keep the outer one
    found.sort(key=lambda b: -b.w * b.h)
    uniq: list[Box] = []
    for b in found:
        if all(b.iou(u) < 0.6 for u in uniq):
            uniq.append(b)
    uniq.sort(key=lambda b: (b.y // 10, b.x))
    return uniq


def draw_ids(str_img: np.ndarray, symbols: list[Box]) -> np.ndarray:
    pil = Image.fromarray(cv2.cvtColor(str_img, cv2.COLOR_BGR2RGB))
    d = ImageDraw.Draw(pil)
    for i, b in enumerate(symbols):
        f = _font(max(10, min(b.h - 2, 22)))
        d.text((b.x + 3, b.y + 1), str(i), fill=(220, 30, 30), font=f)
    return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)


# ----------------------------------------------------------------------------- 4. GUI-text predictor
def _guess_role(b: Box, H: int, W: int) -> str:
    cy = (b.y + b.h / 2) / H
    if cy < 0.05:
        return "status bar"
    if cy < 0.15:
        return "header / title"
    if cy > 0.9:
        return "bottom navigation"
    if b.w > 0.5 * W:
        return "content row"
    return "label / button"


def predict_text(
    cur: np.ndarray, cur_boxes: list[Box], symbols: list[Box], action: str
) -> list[dict]:
    """MOCK of prompts G.1 (unchanged), G.2 (roles), G.3 (text)."""
    H, W = cur.shape[:2]
    typed = re.search(r"(?:type|enter|input|search(?: for)?)\s+[\"']?(.+?)[\"']?(?:\s+(?:in|into|as)\b.*)?$", action, re.I)
    out = []
    for i, s in enumerate(symbols):
        match = max(cur_boxes, key=lambda b: s.iou(b), default=None)
        same = match is not None and s.iou(match) > 0.5
        role = _guess_role(s, H, W)
        text = match.text if same else "…"
        # G.1: symbols at the same place as in x_k keep their pixels; only new/changed ones are rendered
        unchanged = same
        out.append({"id": i, "x": s.x, "y": s.y, "w": s.w, "h": s.h,
                    "text": text, "role": role, "unchanged": unchanged})
    if typed:
        # put typed text into the first plausible input row (largest-width symbol in upper half)
        cands = [o for o in out if o["y"] < 0.6 * H and o["role"] != "status bar"]
        if cands:
            tgt = max(cands, key=lambda o: o["w"])
            tgt["text"], tgt["role"], tgt["unchanged"] = typed.group(1), "input field (typed)", False
    return out


def render_gui(str_img: np.ndarray, cur: np.ndarray, preds: list[dict]) -> np.ndarray:
    out = str_img.copy()
    H, W = out.shape[:2]
    for p in preds:
        x, y, w, h = p["x"], p["y"], p["w"], p["h"]
        if p["unchanged"]:  # copy pixels from previous GUI (App. A.1)
            out[y : y + h + 1, x : x + w + 1] = cur[y : y + h + 1, x : x + w + 1]
            continue
        # 1) background = average colour on the ring just outside the symbol
        m = 3
        X1, Y1, X2, Y2 = max(0, x - m), max(0, y - m), min(W, x + w + m), min(H, y + h + m)
        ring = np.ones((Y2 - Y1, X2 - X1), bool)
        ring[(y - Y1) : (y - Y1) + h, (x - X1) : (x - X1) + w] = False
        bg = out[Y1:Y2, X1:X2][ring].mean(0) if ring.any() else np.array([255, 255, 255])
        out[y : y + h + 1, x : x + w + 1] = bg
        # 2) black or white text for contrast
        lum = 0.114 * bg[0] + 0.587 * bg[1] + 0.299 * bg[2]
        color = (0, 0, 0) if lum > 140 else (255, 255, 255)
        # 3) largest font that fits
        pil = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))
        d = ImageDraw.Draw(pil)
        size = max(6, h)
        while size > 6:
            l, t, r, b = d.textbbox((0, 0), p["text"], font=_font(size))
            if r - l <= w and b - t <= h:
                break
            size -= 1
        f = _font(size)
        l, t, r, b = d.textbbox((0, 0), p["text"], font=f)
        d.text((x + (w - (r - l)) / 2 - l, y + (h - (b - t)) / 2 - t), p["text"], fill=color[::-1], font=f)
        out = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    return out


# ----------------------------------------------------------------------------- full world model
@dataclass
class Prediction:
    images: dict
    symbols: list
    static_text: list
    timings: dict = field(default_factory=dict)


def run_world_model(img: np.ndarray, action: str, preserve_static: bool = True) -> Prediction:
    t = {}
    t0 = time.perf_counter()
    boxes = detect_text(img)
    dyn, static = filter_static_text(boxes, img.shape[0]) if preserve_static else (boxes, [])
    str_cur = build_str(img, dyn)
    t["str_build"] = time.perf_counter() - t0

    t1 = time.perf_counter()
    str_next = predict_str(str_cur, action)
    t["str_predictor"] = time.perf_counter() - t1

    t2 = time.perf_counter()
    symbols = locate_symbols(str_next)
    str_ids = draw_ids(str_next, symbols)
    preds = predict_text(img, dyn, symbols, action)
    gui = render_gui(str_next, img, preds)
    t["gui_text_predictor"] = time.perf_counter() - t2
    t["total"] = time.perf_counter() - t0

    return Prediction(
        images={
            "current": to_data_uri(img),
            "str_current": to_data_uri(str_cur),
            "str_next": to_data_uri(str_next),
            "str_next_ids": to_data_uri(str_ids),
            "predicted": to_data_uri(gui),
        },
        symbols=preds,
        static_text=[{"x": b.x, "y": b.y, "w": b.w, "h": b.h, "text": b.text} for b in static],
        timings={k: round(v, 3) for k, v in t.items()},
    )


# ----------------------------------------------------------------------------- agent (Sec 3.3 / App. A.2)
def judge_action(goal: str, action: str) -> dict:
    """MOCK of prompt G.4: lexical overlap between goal and action."""
    tok = lambda s: {w for w in re.findall(r"[a-z0-9]+", s.lower()) if len(w) > 2}
    ov = len(tok(goal) & tok(action))
    valid = ov > 0
    conf = round(min(0.95, 0.55 + 0.1 * ov) if valid else 0.6, 2)
    return {
        "judgement": "valid" if valid else "invalid",
        "confidence": conf,
        "score": conf if valid else -conf,
        "reason": f"Mock judge: {ov} goal keyword(s) appear in the action and predicted GUI context.",
    }


# ----------------------------------------------------------------------------- evaluation (Sec 4.2)
def gui_consistency(a: np.ndarray, b: np.ndarray) -> float:
    """MOCK of DINO cosine similarity: cosine of downsampled colour thumbnails."""
    sz = (64, 128)
    va = cv2.resize(a, sz).astype(np.float32).ravel()
    vb = cv2.resize(b, sz).astype(np.float32).ravel()
    va -= va.mean(); vb -= vb.mean()
    return float(max(0.0, (va @ vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-8)))


def harmonic(*xs: float) -> float:
    xs = [max(x, 1e-6) for x in xs]
    return len(xs) / sum(1 / x for x in xs)
