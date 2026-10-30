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

const form = (fields: Record<string, string | Blob | boolean>) => {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v))
  return fd
}

export const api = {
  health: () => request<Health>('/api/health', undefined, 8000),

  predict: (image: File, action: string, preserveStaticText = true) =>
    request<PredictResponse>('/api/predict', {
      method: 'POST',
      body: form({ image, action, preserve_static_text: preserveStaticText }),
    }),

  selectAction: (image: File, goal: string, actions: string[]) =>
    request<AgentResponse>('/api/agent/select', {
      method: 'POST',
      body: form({ image, goal, actions: JSON.stringify(actions) }),
    }),

  evaluate: (p: { current: File; generated: File; groundTruth: File; action: string; goal: string; nextAction: string }) =>
    request<EvaluateResponse>('/api/evaluate', {
      method: 'POST',
      body: form({
        current: p.current,
        generated: p.generated,
        ground_truth: p.groundTruth,
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
