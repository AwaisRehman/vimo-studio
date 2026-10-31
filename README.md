# ViMo Studio: web app for the ViMo world model (React + FastAPI)

An interactive web application for a reproduction of **ViMo: A Generative Visual GUI World Model for App Agents** (Luo et al., arXiv:2504.13936).

```
vimo-app/
├── frontend/          React 19 + TypeScript + Vite + Tailwind v4 + Recharts
│   └── src/
│       ├── api/        typed client (client.ts) and response types (types.ts)
│       ├── components/ app shell, UI kit (light/dark tokens), DeviceFrame, SymbolOverlay, SamplePicker
│       ├── state/      session state (runs, theme, Studio inputs) and toasts
│       ├── data/       paper tables + built-in sample screens
│       └── pages/      Home, Studio, Agent, Evaluate, History, Benchmarks, Settings
│   └── public/samples  unbranded demo screens (regenerate: backend/scripts/make_samples.py)
├── backend/           FastAPI mock server that follows the API contract
│   └── app/
│       ├── main.py    endpoints
│       └── pipeline.py STR build, symbol localisation (App. A.1), text render; mocks for the models
└── docs/API.md        the contract the real backend must follow
```

## Run it

**1. Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000              # docs at http://localhost:8000/docs
```

**2. Frontend** (Node 20+)
```bash
cd frontend
npm install
npm run dev                                             # http://localhost:5173
```
Vite proxies `/api/*` to `localhost:8000`, so CORS doesn't come into play in development.
To use a backend somewhere else (a GPU server, for example), change the URL on the **Settings** page or set `VITE_API_URL=http://host:8000` before `npm run build`.

## Pages

| Page | Paper section | What it does |
|---|---|---|
| Home | Abstract, Fig. 2 | Product landing page: hero, how it works, one-click samples, recent runs, BibTeX |
| Studio | S3.2, Eq. 1 | Three-panel workspace: input panel → phone canvas (Predicted / Compare / Pipeline / STR views) → inspector (text symbols, timings, JSON). Roll out to the next step, send to Evaluation |
| Agent Planner | S3.3, Alg. 1, App. A.2 | Imagined outcome for each candidate action, valid/invalid with confidence, top-2, selected action |
| Evaluation | S4.2, Table 1 | s_gc, s_ia, s_ar, s_h, compared against the paper's averages; can prefill from a Studio run |
| History | — | Every prediction from this session; open any one back in Studio |
| Benchmarks | Tables 1, 2, 3, 5, 7, 10 | Interactive charts of the reported numbers |
| Settings | — | API URL, model status (real vs. mock), theme, endpoint list |

Product features: light/dark theme (follows the OS, toggle in the top bar), collapsible sidebar, responsive from 360 px phones to wide desktops, toasts, keyboard shortcut (Ctrl/⌘ + Enter), lazy-loaded pages.

## Plugging in the real model

The mock backend already implements, as described in the paper:
- **STR construction**: OCR (PaddleOCR models via `rapidocr-onnxruntime`) → white box with black border.
- **Text-symbol localisation (App. A.1)**: black mask BGR ∈ [0,50], contour/bbox ratio > 0.8, white ratio > 50%.
- **Text overlay**: background colour averaged from the edge, black or white text for contrast, largest font that fits.
- **Scoring (App. A.2)**: ±confidence, then choose between the top two.

Replace these functions in `backend/app/pipeline.py` with your trained components:

| Function | Replace with |
|---|---|
| `predict_str` | Fine-tuned `StableDiffusionInstructPix2PixPipeline` conditioned on (STRₖ, action) |
| `filter_static_text` | LLM call that flags keyboard/clock-face text |
| `predict_text` | GPT-4o / Gemini with prompts G.1 (unchanged IDs) → G.2 (roles) → G.3 (text) |
| `judge_action` + selection in `main.py` | Prompts G.4 and G.5 |
| `gui_consistency` | DINO ViT cosine similarity; s_ia/s_ar via prompts G.7/G.8 |

Then change the strings in `/api/health` → `mode`. The UI's **MOCK** badge disappears when no mode value starts with `mock`.

**Long requests:** the real pipeline takes about 40 s per prediction on a V100 (paper, App. C), and the Agent Planner runs it once per candidate action. The frontend timeout is 5 minutes (`client.ts`). For production, consider a job queue (`POST` returns a job id, then poll `GET /api/jobs/{id}`).

## Deploy (auto-deploy on every git push)

| Part | Host | Config |
|---|---|---|
| Frontend | Vercel (free Hobby) | `frontend/vercel.json`, root dir `frontend` |
| Backend (CPU / mock) | Vercel (free, Python/FastAPI, root dir `backend`) | `backend/vercel.json` + `backend/api/index.py` · alt: `render.yaml` |
| Backend (real model) | Your L40 GPU server, Docker + Cloudflare Tunnel | `backend/Dockerfile.gpu` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

Step-by-step guide: **[docs/DEPLOY.md](docs/DEPLOY.md)**.
