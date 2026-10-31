# Deploying ViMo Studio

```
GitHub (main) ──push──▶ Vercel project "vimo-studio"  (frontend, root: frontend/)  https://vimo-studio.vercel.app
                 └────▶ Vercel project "vimo-api-awais" (backend, root: backend/)  https://vimo-api-awais.vercel.app
                 └────▶ GitHub Actions CI (type-check + API smoke test)

Later: your L40 server (Docker, real model) ──Cloudflare Tunnel──▶ https://api.<your-domain>
```

Both parts run on **Vercel's free Hobby plan, so no credit card is needed**. The browser only calls `/api/*` on the frontend domain; `frontend/vercel.json` forwards those calls to the backend project.

> Backend size on Vercel: about 350 MB of Python packages (limit 500 MB). `rapidocr_onnxruntime` is vendored in `backend/vendor/` so it uses headless OpenCV.
> Request and response bodies are limited to 4.5 MB. Screenshots are fine, and responses are JPEG (~0.5 MB).

---

## 1 · Push to GitHub (once)
See the token-based push steps in the chat, or run `git push`.

## 2 · Backend on Vercel (once)

1. Go to <https://vercel.com/new>, then **Import** `vimo-studio`.
2. **Project Name:** `vimo-api-awais` (must match the URL in `frontend/vercel.json`)
3. **Root Directory:** click *Edit*, choose **`backend`**, then *Continue*. The Framework Preset should show **Other** or **FastAPI**; both work.
4. Click **Deploy** and wait 2–4 minutes.
5. Open `https://vimo-api-awais.vercel.app/api/health`. It should return `{"status":"ok", ...}`.
   If the name was taken, Vercel gives a URL like `vimo-api-awais-xyz.vercel.app`. Copy it for step 3.

The first request after the backend has been idle takes a few seconds while the OCR model loads (a "cold start"). After that it's fast.

## 3 · Frontend on Vercel (once)

1. If your backend URL is not `https://vimo-api-awais.vercel.app`, replace it in `frontend/vercel.json` (3 places), then commit and push.
2. Go to <https://vercel.com/new>, **Import** `vimo-studio` **again** (a second project).
3. **Project Name:** `vimo-studio`. **Root Directory:** **`frontend`**. Framework: **Vite**. Click **Deploy**.
4. Open `https://vimo-studio.vercel.app`. The top bar should show **Mock backend** (amber).

### Alternative: Render for the backend
`render.yaml` is still included. On Render: **New → Blueprint**. Render may ask for a card for verification.
If you use it, change the URLs in `frontend/vercel.json` to your `onrender.com` URL.

### Without GitHub: deploy from your laptop
```bash
npm i -g vercel && vercel login
cd backend  && vercel --prod     # project name: vimo-api-awais
cd ../frontend && vercel --prod  # project name: vimo-studio
```

## 4 · Everyday workflow

```bash
git add . && git commit -m "Improve studio layout"
git push
```

- **Vercel** rebuilds the frontend (~30 s) and makes it live.
- **Vercel** also rebuilds the backend project (~2 min).
- **GitHub Actions** runs CI. If CI is red, fix it before demoing.
- **Preview:** push a branch or open a PR, and Vercel gives you a separate preview URL. `main` stays untouched.

---

## 5 · Real model on your L40 (when training is done)

### a. Plug the model into the pipeline
Replace the mocked functions in `backend/app/pipeline.py`:

| Function | Replace with |
|---|---|
| `predict_str` | `StableDiffusionInstructPix2PixPipeline.from_pretrained(os.environ["VIMO_CHECKPOINT"])`, loaded **once at startup** and run on `cuda` |
| `filter_static_text`, `predict_text` | LLM calls with prompts G.1 → G.2 → G.3 |
| `judge_action` + selection in `main.py` | Prompts G.4 / G.5 |
| `gui_consistency` | DINO ViT features, cosine similarity |

Then update the `mode` strings in `/api/health` (e.g. `"str_predictor": "ip2p-finetuned (L40)"`). The UI's **MOCK** badge turns green automatically.

### b. Run it in Docker on the GPU server
```bash
cd backend
docker build -f Dockerfile.gpu -t vimo-api-gpu .
docker run -d --name vimo --gpus all --restart unless-stopped -p 8000:8000 \
  -v /data/checkpoints:/models -e VIMO_CHECKPOINT=/models/str-predictor \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  vimo-api-gpu
curl localhost:8000/api/health
```

### c. Give it a public HTTPS URL with Cloudflare Tunnel (free)
- **Quick test:** run `cloudflared tunnel --url http://localhost:8000`. It prints a temporary `https://xxxx.trycloudflare.com` URL that changes on every run.
- **Stable:** use a named tunnel on a domain you own (`api.yourdomain.com`):
  ```bash
  cloudflared tunnel login
  cloudflared tunnel create vimo
  cloudflared tunnel route dns vimo api.yourdomain.com
  cloudflared tunnel run --url http://localhost:8000 vimo
  ```

### d. Point the website at the GPU backend
- **Permanently:** change the three `vimo-api-awais.vercel.app` URLs in `frontend/vercel.json` to `api.yourdomain.com` and push. Keep the Vercel backend as a fallback.
- **Just for your browser (no redeploy):** in the app go to **Settings → Backend connection**, paste the tunnel URL and click Save. Set `ALLOWED_ORIGINS` on the GPU container to your Vercel URL so the browser may call it directly.

### Notes for a GPU backend
- Each prediction takes ~8 s (STR) + ~30 s (LLM text) on a V100 according to the paper; expect it to be faster on an L40. Vercel's rewrite proxy has a request timeout, so if requests take longer than ~2 minutes (e.g. Agent Planner with 6 actions), use the Settings override to call the GPU backend directly, or add a job queue (`POST` returns a job id, `GET /api/jobs/{id}` polls).
- Keep `--workers 1` so the diffusion model is loaded into GPU memory only once.
- Never commit API keys. Pass them as environment variables (`-e`), or add them in the Vercel project → Settings → Environment Variables.
