import clsx from 'clsx'
import { Moon, RefreshCw, Save, Server, Sun } from 'lucide-react'
import { useState } from 'react'
import { getApiBase, setApiBase } from '../api/client'
import { useHealth } from '../components/useHealth'
import { Badge, Button, Card, CardHeader, Label, PageHeader, Segmented, inputCls } from '../components/ui'
import { useApp } from '../state/AppState'
import { useToast } from '../state/Toasts'

const ENDPOINTS = [
  ['GET', '/api/health', 'Backend status, and which components are real or mocked'],
  ['POST', '/api/predict', 'image, action, preserve_static_text → staged images and text symbols'],
  ['POST', '/api/agent/select', 'image, goal, actions[] → scored candidates and the selected action'],
  ['POST', '/api/evaluate', 'current, generated, ground_truth, action, goal, next_action → s_gc, s_ia, s_ar, s_h'],
]

export default function Settings() {
  const { theme, toggleTheme } = useApp()
  const toast = useToast()
  const [url, setUrl] = useState(getApiBase())
  const { state, refresh } = useHealth(60000)

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader eyebrow="System" title="Settings" />

      <Card>
        <CardHeader title="Backend connection" subtitle="Leave empty to use the same origin (Vite dev proxy → localhost:8000)" icon={Server} />
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="api">FastAPI base URL</Label>
            <input id="api" className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. http://gpu-server:8000" />
          </div>
          <Button
            onClick={() => {
              setApiBase(url)
              refresh()
              toast({ tone: 'success', title: 'API URL saved' })
            }}
          >
            <Save className="size-4" /> Save
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Model status" right={<Button variant="secondary" size="sm" onClick={refresh}><RefreshCw className="size-3.5" /> Check</Button>} />
        <div className="p-4 text-sm">
          {state.status === 'loading' && <p className="text-muted">Checking…</p>}
          {state.status === 'offline' && <p className="text-rose-500">{state.error}</p>}
          {state.status === 'online' && (
            <dl className="divide-y divide-line">
              <div className="flex justify-between py-2.5"><dt className="text-muted">Status</dt><dd><Badge tone="green">{state.data.status}</Badge></dd></div>
              <div className="flex justify-between py-2.5"><dt className="text-muted">Version</dt><dd className="font-mono text-xs text-fg">{state.data.version}</dd></div>
              {Object.entries(state.data.mode).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="capitalize text-muted">{k.replace(/_/g, ' ')}</dt>
                  <dd><Badge tone={v.startsWith('mock') ? 'amber' : 'green'}>{v}</Badge></dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Appearance" />
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-fg">Theme</span>
          <Segmented
            value={theme}
            onChange={(v) => v !== theme && toggleTheme()}
            options={[{ value: 'light', label: <><Sun className="size-3.5" /> Light</> }, { value: 'dark', label: <><Moon className="size-3.5" /> Dark</> }]}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="API contract" subtitle="See docs/API.md for the full schema" />
        <ul className="divide-y divide-line">
          {ENDPOINTS.map(([m, p, d]) => (
            <li key={p} className="flex items-start gap-3 px-4 py-3">
              <span className={clsx('w-11 shrink-0 rounded px-1 py-0.5 text-center font-mono text-[10px] font-bold', m === 'GET' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-brand-500/15 text-brand-600 dark:text-brand-300')}>{m}</span>
              <div className="min-w-0"><code className="font-mono text-xs text-fg">{p}</code><p className="text-xs text-muted">{d}</p></div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
