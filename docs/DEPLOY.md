# Deploying ViMo Studio

```
GitHub (main) ──push──▶ Vercel  (frontend, React)      https://<project>.vercel.app
                 └────▶ Render  (backend, FastAPI CPU)  https://vimo-api.onrender.com
                 └────▶ GitHub Actions CI (type-check + API smoke test)

Later: your L40 server (Docker, real model) ──Cloudflare Tunnel──▶ https://api.<your-domain>
```

The browser only calls `/api/*` on the Vercel domain. `frontend/vercel.json` forwards those calls to the backend, so there's no CORS setup and the backend can be swapped by changing one URL.

---

## 1 · Push to GitHub (once)

```bash
cd vimo-studio
git init && git add . && git commit -m "ViMo Studio"
git branch -M main
git remote add origin https://github.com/<you>/vimo-studio.git
git push -u origin main
```

## 2 · Backend on Render (once)

1. Go to <https://dashboard.render.com>, then **New → Blueprint**, and pick the repo. Render reads `render.yaml`.
2. Click **Apply**. The first build takes 3–5 minutes.
3. Open `https://vimo-api.onrender.com/api/health`; it should return `{"status":"ok", ...}`.
   If Render gave you a different URL (the name was taken), copy it for step 3.

> Free instances sleep after 15 minutes idle, and the first request then takes about 1 minute.
> **Open the site 2 minutes before a demo.** For an always-on backend, switch the service to the $7/month Starter instance.

## 3 · Frontend on Vercel (once)

1. If your Render URL is not `https://vimo-api.onrender.com`, replace it in `frontend/vercel.json` (3 places), then commit and push.
2. Go to <https://vercel.com/new>, import the repo, and set **Root Directory = `frontend`**. Vercel detects Vite. Click **Deploy**.
3. Open `https://<project>.vercel.app`. The top bar should show **Mock backend** (amber).
4. Optional: in Render, set `ALLOWED_ORIGINS` to your Vercel URL. This only matters if you call the API directly from another site.

## 4 · Everyday workflow

```bash
git add . && git commit -m "Improve studio layout"
git push
```

- **Vercel** rebuilds the frontend (~30 s) and makes it live.
- **Render** rebuilds the backend (~3 min), then switches over with no downtime once `/api/health` passes.
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
- **Permanently:** change the three `vimo-api.onrender.com` URLs in `frontend/vercel.json` to `api.yourdomain.com` and push. Keep Render as a fallback, or delete it.
- **Just for your browser (no redeploy):** in the app go to **Settings → Backend connection**, paste the tunnel URL and click Save. Set `ALLOWED_ORIGINS` on the GPU container to your Vercel URL so the browser may call it directly.

### Notes for a GPU backend
- Each prediction takes ~8 s (STR) + ~30 s (LLM text) on a V100 according to the paper; expect it to be faster on an L40. Vercel's rewrite proxy has a request timeout, so if requests take longer than ~2 minutes (e.g. Agent Planner with 6 actions), use the Settings override to call the GPU backend directly, or add a job queue (`POST` returns a job id, `GET /api/jobs/{id}` polls).
- Keep `--workers 1` so the diffusion model is loaded into GPU memory only once.
- Never commit API keys. Pass them as environment variables (`-e`), or put them in Render's dashboard.
