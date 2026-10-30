import clsx from 'clsx'
import { Bot, CheckCircle2, Crown, ListPlus, Plus, Sparkles, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { AgentResponse } from '../api/types'
import { ImageDrop } from '../components/ImageDrop'
import { SamplePicker } from '../components/SamplePicker'
import { Badge, Button, Card, CardHeader, DeviceFrame, EmptyState, ErrorBanner, Label, Lightbox, PageHeader, ScreenSkeleton, inputCls } from '../components/ui'
import { samples, sampleToFile, type Sample } from '../data/samples'
import { useToast } from '../state/Toasts'

const STEPS = [
  { title: 'Generate options', eq: 'A = Agent(xₖ, g)' },
  { title: 'Imagine outcomes', eq: 'xᵃⁱₖ₊₁ = ViMo(xₖ, aᵢ)' },
  { title: 'Score & select', eq: 'aₛₑ = S({(aᵢ, xᵃⁱₖ₊₁)})' },
]

export default function Agent() {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState('')
  const [goal, setGoal] = useState('')
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [res, setRes] = useState<AgentResponse | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  const pick = async (s: Sample) => {
    setFile(await sampleToFile(s))
    setSource(s.id)
    setGoal(s.goal)
    setActions(s.actions.slice(0, 3))
    setRes(null)
  }
  useEffect(() => {
    pick(samples[0])
  }, [])

  const valid = actions.filter((a) => a.trim())
  const sample = samples.find((s) => s.id === source)

  const run = async () => {
    if (!file || !goal.trim() || !valid.length) return
    setLoading(true)
    setError(null)
    setRes(null)
    try {
      const r = await api.selectAction(file, goal.trim(), valid)
      setRes(r)
      toast({ tone: 'success', title: 'Action selected', body: r.candidates[r.selected_index].action })
    } catch (e) {
      setError((e as Error).message)
      toast({ tone: 'error', title: 'Planning failed', body: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const order = res ? res.candidates.map((_, i) => i).sort((a, b) => res.candidates[b].score - res.candidates[a].score) : []

  return (
    <div>
      <PageHeader eyebrow="Algorithm 1 · §3.3" title="Agent Planner">
        The agent imagines the result of each candidate action with ViMo. An LLM judge scores each imagined screen (+confidence if valid, −confidence if invalid),
        then picks the better of the top two.
      </PageHeader>

      <ol className="mb-5 grid gap-2 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-xs font-semibold text-white">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-fg">{s.title}</p>
              <code className="block truncate font-mono text-[11px] text-muted">{s.eq}</code>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-[4.75rem]">
          <CardHeader title="Task" icon={Bot} />
          <div className="space-y-5 p-4">
            <div>
              <Label>Current screen</Label>
              <SamplePicker selected={source} onPick={pick} />
              <div className="mt-3">
                <ImageDrop file={source === 'upload' ? file : null} onChange={(f) => { setFile(f); setSource('upload'); setRes(null) }} height="h-20" label="Or upload a screenshot" />
              </div>
            </div>
            <div>
              <Label htmlFor="goal">User goal (g)</Label>
              <input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Create a new alarm for 5:45 am" className={inputCls} />
            </div>
            <div>
              <Label hint={`${valid.length} / 6`}>Candidate actions (A)</Label>
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center font-mono text-[11px] text-subtle">a{i + 1}</span>
                    <input value={a} onChange={(e) => setActions((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} className={clsx(inputCls, 'py-2')} placeholder="Action instruction" />
                    <button onClick={() => setActions((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove action" className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-rose-500/10 hover:text-rose-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setActions((xs) => [...xs, ''])} disabled={actions.length >= 6}><Plus className="size-3.5" /> Add</Button>
                {sample && (
                  <Button variant="ghost" size="sm" onClick={() => setActions(sample.actions.slice(0, 6))}><ListPlus className="size-3.5" /> All suggestions</Button>
                )}
              </div>
            </div>
            {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
          </div>
          <div className="border-t border-line p-4">
            <Button size="lg" className="w-full" onClick={run} loading={loading} disabled={!file || !goal.trim() || !valid.length}>
              {!loading && <Sparkles className="size-4" />} {loading ? `Imagining ${valid.length} outcomes…` : 'Plan with ViMo'}
            </Button>
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          {loading && (
            <Card className="dot-grid grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
              {valid.map((_, i) => <ScreenSkeleton key={i} className="mx-auto w-full max-w-[200px]" />)}
            </Card>
          )}

          {!loading && !res && (
            <Card>
              <EmptyState icon={Bot} title="No plan yet">Pick a screen, set a goal and list a few candidate actions. ViMo will imagine where each one leads.</EmptyState>
            </Card>
          )}

          {res && (
            <>
              <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-700 p-5 text-white shadow-lg shadow-brand-600/20 sm:flex-row sm:items-center">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><Crown className="size-5 text-amber-300" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Selected action · aₛₑ</p>
                  <p className="mt-0.5 text-lg font-semibold">{res.candidates[res.selected_index].action}</p>
                  <p className="mt-1 text-sm text-white/75">{res.selection_reason}</p>
                </div>
                <span className="font-mono text-xs text-white/70">{res.timings.total?.toFixed(2)} s</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {order.map((i, rank) => {
                  const c = res.candidates[i]
                  const selected = i === res.selected_index
                  return (
                    <Card key={i} className={clsx('flex flex-col overflow-hidden transition', selected && 'ring-2 ring-brand-500')}>
                      <button onClick={() => setZoom(c.predicted_image)} className="dot-grid relative flex justify-center border-b border-line px-6 pb-5 pt-8">
                        <DeviceFrame className="w-[170px]">
                          <img src={c.predicted_image} alt={`Imagined outcome of ${c.action}`} className="block w-full" />
                        </DeviceFrame>
                        <span className="absolute left-3 top-3 rounded-md bg-fg px-1.5 py-0.5 font-mono text-[10px] font-semibold text-bg">#{rank + 1}</span>
                        {selected && <Badge tone="brand" className="absolute right-3 top-3"><Crown className="size-3" /> selected</Badge>}
                      </button>
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <p className="text-sm font-medium leading-snug text-fg">{c.action}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.judgement === 'valid' ? <Badge tone="green"><CheckCircle2 className="size-3" /> valid</Badge> : <Badge tone="red"><XCircle className="size-3" /> invalid</Badge>}
                          <Badge>conf {c.confidence.toFixed(2)}</Badge>
                          {res.top2.includes(i) && <Badge tone="brand">top-2</Badge>}
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-[11px] text-muted">
                            <span>Score</span>
                            <span className={clsx('font-mono font-semibold', c.score >= 0 ? 'text-emerald-500' : 'text-rose-500')}>{c.score >= 0 ? '+' : ''}{c.score.toFixed(2)}</span>
                          </div>
                          <div className="relative h-1.5 rounded-full bg-surface-2">
                            <span className="absolute inset-y-[-2px] left-1/2 w-px bg-line" />
                            <span className={clsx('absolute inset-y-0 rounded-full', c.score >= 0 ? 'left-1/2 bg-emerald-500' : 'right-1/2 bg-rose-500')} style={{ width: `${Math.abs(c.score) * 50}%` }} />
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-muted">{c.reason}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  )
}
