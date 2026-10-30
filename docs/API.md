# ViMo API contract

The React frontend depends only on this contract. Your real backend (GPU, fine-tuned IP2P, GPT-4o/Gemini) must accept the same inputs and return the same JSON.
Images are returned as `data:image/png;base64,...` strings. Coordinates are in pixels of the returned images.

## `GET /api/health`
```json
{ "status": "ok", "version": "0.1.0",
  "mode": { "ocr": "paddleocr", "str_predictor": "ip2p-finetuned", "llm": "gpt-4o", "gui_consistency": "dino-vitb16" } }
```
Any `mode` value that starts with `mock` shows a **MOCK** badge in the UI.

## `POST /api/predict` (multipart/form-data)
| field | type | notes |
|---|---|---|
| `image` | file | current GUI xₖ |
| `action` | string | natural-language action instruction |
| `preserve_static_text` | `"true"`/`"false"` | keep keyboard/clock text as pixels (default true) |

```json
{
  "id": "a1b2c3d4",
  "action": "Click on the + button",
  "images": {
    "current": "data:image/png;base64,...",       // xₖ
    "str_current": "...",                          // STR(xₖ)
    "str_next": "...",                             // STR predictor output
    "str_next_ids": "...",                         // STR with red ID labels
    "predicted": "..."                             // final xᵃₖ₊₁
  },
  "symbols": [
    { "id": 0, "x": 19, "y": 13, "w": 73, "h": 30, "text": "10:42", "role": "status bar", "unchanged": true }
  ],
  "static_text": [ { "x": 0, "y": 0, "w": 0, "h": 0, "text": "Q" } ],
  "timings": { "str_build": 0.5, "str_predictor": 8.1, "gui_text_predictor": 30.2, "total": 38.8 }
}
```
`unchanged: true` means the text was copied from xₖ (prompt G.1). `false` means the LLM generated it (prompts G.2 and G.3).

## `POST /api/agent/select` (multipart/form-data)
| field | type | notes |
|---|---|---|
| `image` | file | xₖ |
| `goal` | string | user goal g |
| `actions` | string | JSON array of 1–6 candidate action instructions |

```json
{
  "goal": "...",
  "candidates": [
    { "action": "...", "predicted_image": "data:...", "judgement": "valid", "confidence": 0.8, "score": 0.8, "reason": "..." }
  ],
  "top2": [0, 2],
  "selected_index": 0,
  "selection_reason": "...",
  "timings": { "total": 95.2 }
}
```
`score = +confidence` if valid, `-confidence` if invalid (Appendix A.2). `top2` holds the indices of the two highest scores, and `selected_index` is the result of prompt G.5.

## `POST /api/evaluate` (multipart/form-data)
Fields: `current`, `generated` and `ground_truth` (files), plus `action`, `goal` and `next_action` (strings).
```json
{ "s_gc": 0.74, "s_ia": 1.0, "s_ar": 1.0, "s_h": 0.89,
  "details": { "ia_thoughts": "...", "ar_thoughts": "..." } }
```
All scores are in the 0–1 range. `s_h` is the harmonic mean of the three.

Errors use FastAPI's default shape, `{"detail": "message"}`, with a 4xx/5xx status. The UI shows `detail` to the user.
