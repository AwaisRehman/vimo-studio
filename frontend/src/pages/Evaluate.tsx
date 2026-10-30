import { Gauge, History as HistoryIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, dataUriToFile } from '../api/client'
import type { EvaluateResponse } from '../api/types'
import { ImageDrop } from '../components/ImageDrop'
import { Button, Card, CardHeader, ErrorBanner, Label, PageHeader, inputCls } from '../components/ui'
import { table1 } from '../data/paper'
import { useApp, type Run } from '../state/AppState'
import { useToast } from '../state/Toasts'

function Ring({ value, label, desc }: { value: number; label: string; desc: string }) {
  const r = 30
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <Card className="flex items-center gap-4 p-4">
      <svg viewBox="0 0 72 72" className="size-[72px] shrink-0 -rotate-90" role="img" aria-label={`${label} ${pct.toFixed(2)}`}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="#6366f1" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} style={{ transition: 'stroke-dasharray .6s ease' }} />
        <text x="36" y="36" transform="rotate(90 36 36)" textAnchor="middle" dominantBaseline="central" fill="var(--fg)" fontSize="14" fontWeight="600">{pct.toFixed(2)}</text>
      </svg>
      <div>
        <p className="font-mono text-sm font-semibold text-fg">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
      </div>
    </Card>
  )
}

export default function Evaluate() {
  const { runs } = useApp()
  const toast = useToast()
  const location = useLocation() as { state?: { runId?: string } }
  const [current, setCurrent] = useState<File | null>(null)
  const [generated, setGenerated] = useState<File | null>(null)
  const [gt, setGt] = useState<File | null>(null)
  const [action, setAction] = useState('')
  const [goal, setGoal] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [res, setRes] = useState<EvaluateResponse | null>(null)

  const fromRun = async (r: Run) => {
    setCurrent(await dataUriToFile(r.images.current, `current-${r.id}.png`))
    setGenerated(await dataUriToFile(r.images.predicted, `predicted-${r.id}.png`))
    setAction(r.action)
    setRes(null)
  }
  useEffect(() => {
    const r = runs.find((x) => x.id === location.state?.runId)
    if (r) {
      fromRun(r)
      toast({ tone: 'info', title: 'Loaded from Studio', body: 'Upload the ground-truth next screen to score it.' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ready = current && generated && gt && action.trim()
  const run = async () => {
    if (!ready) return
    setLoading(true)
    setError(null)
    try {
      setRes(await api.evaluate({ current, generated, groundTruth: gt, action, goal, nextAction }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const ref = table1.find((r) => r.method === 'ViMo')!.auto

  return (
    <div>
      <PageHeader
        eyebrow="§4.2 · Table 1"
        title="Evaluation"
        actions={runs[0] && <Button variant="secondary" size="sm" onClick={() => fromRun(runs[0])}><HistoryIcon className="size-3.5" /> Use latest Studio run</Button>}
      >
        Score a generated screen against the real next screen. <b className="text-fg">s_gc</b> measures visual similarity (DINO), <b className="text-fg">s_ia</b> checks
        that the action was followed (G.7), <b className="text-fg">s_ar</b> checks that the next action is still possible (G.8), and <b className="text-fg">s_h</b> is
        their harmonic mean.
      </PageHeader>

      <Card>
        <CardHeader title="Inputs" icon={Gauge} />
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <div><Label>Current screen xₖ</Label><ImageDrop file={current} onChange={setCurrent} label="Current" height="h-64" /></div>
          <div><Label>Generated next screen</Label><ImageDrop file={generated} onChange={setGenerated} label="Generated" height="h-64" /></div>
          <div><Label>Ground-truth next screen</Label><ImageDrop file={gt} onChange={setGt} label="Ground truth" height="h-64" /></div>
        </div>
        <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-3">
          <div><Label htmlFor="ea">Action applied</Label><input id="ea" className={inputCls} value={action} onChange={(e) => setAction(e.target.value)} placeholder="Click the + button" /></div>
          <div><Label htmlFor="eg" hint="for s_ar">User goal</Label><input id="eg" className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Create an alarm for 5:45" /></div>
          <div><Label htmlFor="en" hint="for s_ar">Next action</Label><input id="en" className={inputCls} value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Set the hour to 5" /></div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line p-4">
          <Button onClick={run} loading={loading} disabled={!ready}><Gauge className="size-4" /> Evaluate</Button>
          {!gt && current && <span className="text-xs text-muted">Add the ground-truth screen to enable scoring.</span>}
          {error && <div className="w-full"><ErrorBanner message={error} onClose={() => setError(null)} /></div>}
        </div>
      </Card>

      {res && (
        <div className="mt-4 animate-fade-in space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Ring value={res.s_gc} label="s_gc" desc="GUI consistency vs. ground truth" />
            <Ring value={res.s_ia} label="s_ia" desc="Instructional accuracy" />
            <Ring value={res.s_ar} label="s_ar" desc="Action readiness" />
            <Ring value={res.s_h} label="s_h" desc="Harmonic mean" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Judge reasoning</p>
              <p className="mt-3 text-xs font-medium text-muted">s_ia</p>
              <p className="mt-0.5 text-fg">{res.details.ia_thoughts}</p>
              <p className="mt-3 text-xs font-medium text-muted">s_ar</p>
              <p className="mt-0.5 text-fg">{res.details.ar_thoughts}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">This sample vs. paper (ViMo, automatic)</p>
              <div className="mt-4 space-y-3">
                {([
                  ['s_gc', res.s_gc, ref.sgc],
                  ['s_ia', res.s_ia, ref.sia / 100],
                  ['s_ar', res.s_ar, ref.sar / 100],
                  ['s_h', res.s_h, ref.sh],
                ] as const).map(([k, v, p]) => (
                  <div key={k} className="grid grid-cols-[40px_1fr] items-center gap-3 text-xs">
                    <span className="font-mono text-muted">{k}</span>
                    <div className="relative h-2 rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${v * 100}%` }} />
                      <span className="absolute -top-1 h-4 w-0.5 rounded bg-fg" style={{ left: `${p * 100}%` }} title={`paper: ${p.toFixed(2)}`} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-subtle">Bar = this sample · tick = paper average over the test split.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
