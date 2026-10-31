import type { AgentResponse, EvaluateResponse, Health, PredictResponse } from './types'

const KEY = 'vimo.apiBase'

/** Empty string = same origin (uses the Vite dev proxy or a reverse proxy in production). */
export function getApiBase(): string {
  try {
    return localStorage.getItem(KEY) ?? import.meta.env.VITE_API_URL ?? ''
  } catch {
    return import.meta.env.VITE_API_URL ?? ''
  }
}

export function setApiBase(url: string) {
  try {
    localStorage.setItem(KEY, url.replace(/\/+$/, ''))
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 300_000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${getApiBase()}${path}`, { ...init, signal: ctrl.signal })
    if (!res.ok) {
      let msg = res.statusText
      try {
        const body = await res.json()
        msg = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail ?? body)
      } catch {
        /* non-JSON error */
      }
      throw new ApiError(res.status, msg || `HTTP ${res.status}`)
    }
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if ((e as Error).name === 'AbortError') throw new ApiError(0, 'Request timed out')
    throw new ApiError(0, 'Cannot reach the API. Is the FastAPI server running? Check Settings.')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Downscale large screenshots in the browser before upload (serverless hosts cap request bodies,
 * e.g. Vercel 4.5 MB). Small images are sent unchanged.
 */
export async function prepareImage(file: File, maxSide = 1400, maxBytes = 1_500_000): Promise<File> {
  if (file.size <= maxBytes) return file
  try {
    const bmp = await createImageBitmap(file)
    const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * s)
    canvas.height = Math.round(bmp.height * s)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

const form = (fields: Record<string, string | Blob | boolean>) => {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v))
  return fd
}

export const api = {
  health: () => request<Health>('/api/health', undefined, 8000),

  predict: async (image: File, action: string, preserveStaticText = true) =>
    request<PredictResponse>('/api/predict', {
      method: 'POST',
      body: form({ image: await prepareImage(image), action, preserve_static_text: preserveStaticText }),
    }),

  selectAction: async (image: File, goal: string, actions: string[]) =>
    request<AgentResponse>('/api/agent/select', {
      method: 'POST',
      body: form({ image: await prepareImage(image), goal, actions: JSON.stringify(actions) }),
    }),

  evaluate: async (p: { current: File; generated: File; groundTruth: File; action: string; goal: string; nextAction: string }) =>
    request<EvaluateResponse>('/api/evaluate', {
      method: 'POST',
      body: form({
        current: await prepareImage(p.current, 1400, 1_000_000),
        generated: await prepareImage(p.generated, 1400, 1_000_000),
        ground_truth: await prepareImage(p.groundTruth, 1400, 1_000_000),
        action: p.action,
        goal: p.goal,
        next_action: p.nextAction,
      }),
    }),
}

/** Convert a data: URI returned by the API back into a File (e.g. to reuse a prediction as input). */
export async function dataUriToFile(uri: string, name: string): Promise<File> {
  const blob = await (await fetch(uri)).blob()
  return new File([blob], name, { type: blob.type })
}
