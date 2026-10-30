"""ViMo demo API. Contract documented in docs/API.md — keep the real backend's JSON identical."""
from __future__ import annotations

import json
import os
import time
import uuid

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import pipeline as P

app = FastAPI(title="ViMo API", version="0.1.0",
              description="Generative Visual GUI World Model (arXiv:2504.13936) — demo backend")
# Comma-separated list, e.g. "https://vimo-studio.vercel.app,http://localhost:5173". Default: allow all.
_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_methods=["*"], allow_headers=["*"])


@app.get("/", include_in_schema=False)
def root():
    return {"service": "ViMo API", "docs": "/docs", "health": "/api/health"}


async def _read(f: UploadFile):
    data = await f.read()
    if not data:
        raise HTTPException(400, f"Empty file: {f.filename}")
    try:
        return P.load_image(data)
    except Exception as e:
        raise HTTPException(400, f"Could not decode image {f.filename}: {e}")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": app.version,
        "mode": {
            "ocr": "rapidocr (PaddleOCR ONNX)" if P._OCR else "unavailable",
            "str_predictor": "mock (identity)",
            "llm": "mock (heuristic)",
            "gui_consistency": "mock (pixel cosine)",
        },
    }


@app.post("/api/predict")
async def predict(
    image: UploadFile = File(...),
    action: str = Form(...),
    preserve_static_text: bool = Form(True),
):
    img = await _read(image)
    r = P.run_world_model(img, action, preserve_static_text)
    return {"id": uuid.uuid4().hex[:8], "action": action, "images": r.images,
            "symbols": r.symbols, "static_text": r.static_text, "timings": r.timings}


@app.post("/api/agent/select")
async def agent_select(
    image: UploadFile = File(...),
    goal: str = Form(...),
    actions: str = Form(..., description="JSON array of candidate action instructions"),
):
    try:
        acts = [a for a in json.loads(actions) if str(a).strip()]
    except json.JSONDecodeError:
        raise HTTPException(400, "`actions` must be a JSON array of strings")
    if not 1 <= len(acts) <= 6:
        raise HTTPException(400, "Provide between 1 and 6 candidate actions")
    img = await _read(image)
    t0 = time.perf_counter()
    cands = []
    for a in acts:  # Eq. (5): x^{a_i}_{k+1} = ViMo(x_k, a_i)
        r = P.run_world_model(img, a)
        cands.append({"action": a, "predicted_image": r.images["predicted"], **P.judge_action(goal, a)})
    order = sorted(range(len(cands)), key=lambda i: -cands[i]["score"])
    top2 = order[:2]
    sel = top2[0]  # MOCK of prompt G.5 (compare top-2)
    return {
        "goal": goal,
        "candidates": cands,
        "top2": top2,
        "selected_index": sel,
        "selection_reason": f"Mock selector: '{cands[sel]['action']}' has the highest score among the top-2 candidates.",
        "timings": {"total": round(time.perf_counter() - t0, 3)},
    }


@app.post("/api/evaluate")
async def evaluate(
    current: UploadFile = File(...),
    generated: UploadFile = File(...),
    ground_truth: UploadFile = File(...),
    action: str = Form(...),
    goal: str = Form(""),
    next_action: str = Form(""),
):
    cur, gen, gt = await _read(current), await _read(generated), await _read(ground_truth)
    s_gc = P.gui_consistency(gen, gt)
    changed = P.gui_consistency(cur, gen) < 0.995
    s_ia = 1.0 if (changed and s_gc > 0.5) else 0.0  # MOCK of prompt G.7
    s_ar = 1.0 if s_gc > 0.6 else 0.0               # MOCK of prompt G.8
    return {
        "s_gc": round(s_gc, 4), "s_ia": s_ia, "s_ar": s_ar,
        "s_h": round(P.harmonic(s_gc, s_ia, s_ar), 4),
        "details": {
            "ia_thoughts": "Mock: GUI changed after the action and is visually close to ground truth." if s_ia else "Mock: generated GUI does not reflect the action.",
            "ar_thoughts": f"Mock: next action '{next_action or 'n/a'}' judged {'executable' if s_ar else 'not executable'}.",
        },
    }
