import clsx from 'clsx'
import {
  ArrowRight, Braces, Check, Clock3, Copy, Download, Gauge, Layers, Maximize2, Repeat, ScanText, Smartphone, SplitSquareHorizontal, Type, Wand2, Workflow,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, dataUriToFile } from '../api/client'
import { ImageDrop } from '../components/ImageDrop'
import { SamplePicker } from '../components/SamplePicker'
import { CompareSlider, SymbolOverlay } from '../components/SymbolOverlay'
import { Badge, Button, Card, DeviceFrame, EmptyState, ErrorBanner, Kbd, Label, Lightbox, ScreenSkeleton, Segmented, Switch, inputCls } from '../components/ui'
import { useObjectUrl } from '../components/useObjectUrl'
import { samples, sampleToFile } from '../data/samples'
import { useApp, type Run } from '../state/AppState'
import { useToast } from '../state/Toasts'

type View = 'predicted' | 'compare' | 'pipeline' | 'str'
type Tab = 'text' | 'timing' | 'json'

const GENERIC = ['Click on the search bar at the top', 'Tap the back arrow', 'Scroll down', 'Open the menu at the top left']

const STAGES: { key: keyof Run['images']; title: string; sub: string }[] = [
  { key: 'current', title: 'Current GUI', sub: 'Input xₖ' },
  { key: 'str_current', title: 'STR', sub: 'OCR → text symbols' },
  { key: 'str_next', title: 'Predicted STR', sub: 'Diffusion' },
  { key: 'str_next_ids', title: 'Symbol IDs', sub: 'Located for the LLM' },
  { key: 'predicted', title: 'Next GUI', sub: 'Output xᵃₖ₊₁' },
]

const TIMING_LABEL: Record<string, string> = { str_build: 'STR construction', str_predictor: 'STR predictor', gui_text_predictor: 'GUI-text predictor' }

export default function Studio() {
  const { studio, setStudio, runs, addRun, activeRunId, setActiveRunId } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('predicted')
  const [tab, setTab] = useState<Tab>('text')
  const [active, setActive] = useState<number | null>(null)
  const [zoom, setZoom] = useState<{ src: string; caption: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showBoxes, setShowBoxes] = useState(false)

  const result = runs.find((r) => r.id === activeRunId) ?? null
  const inputUrl = useObjectUrl(studio.file)
  const sample = samples.find((s) => s.id === studio.source)
  const suggestions = sample?.actions ?? GENERIC
  const generated = result?.symbols.filter((s) => !s.unchanged).length ?? 0

  // preload first sample so the studio is never empty on first visit
  useEffect(() => {
    if (!studio.file) sampleToFile(samples[0]).then((file) => setStudio({ file, source: samples[0].id }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) return
    const t0 = performance.now()
    const id = setInterval(() => setElapsed((performance.now() - t0) / 1000), 100)
    return () => clearInterval(id)
  }, [loading])

  const run = async () => {
    if (!studio.file || !studio.action.trim() || loading) return
    setLoading(true)
    setElapsed(0)
    setError(null)
    try {
      const r = await api.predict(studio.file, studio.action.trim(), studio.preserveStatic)
      addRun(r, sample?.name ?? (studio.source === 'rollout' ? 'Roll-out' : studio.file.name))
      setView('predicted')
      toast({ tone: 'success', title: 'Next screen predicted', body: `${r.symbols.length} text symbols · ${r.timings.total?.toFixed(2)} s` })
    } catch (e) {
      setError((e as Error).message)
      toast({ tone: 'error', title: 'Prediction failed', body: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const rollout = async () => {
    if (!result) return
    setStudio({ file: await dataUriToFile(result.images.predicted, `rollout-${result.id}.png`), source: 'rollout', action: '' })
    setActiveRunId(null)
    toast({ tone: 'info', title: 'Prediction loaded as the new input', body: 'Describe the next action to roll out one more step.' })
  }

  const json = useMemo(() => (result ? JSON.stringify({ action: result.action, symbols: result.symbols, timings: result.timings }, null, 2) : ''), [result])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] min-[1760px]:grid-cols-[330px_minmax(0,1fr)_360px]">
      {/* ------------------------------------------------------------------ input panel */}
      <Card className="flex h-fit flex-col lg:sticky lg:top-[4.75rem]">
        <div className="space-y-5 p-4">
          <section>
            <Label hint={sample ? sample.category : studio.source === 'rollout' ? 'roll-out' : undefined}>
              <span className="flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded bg-brand-500/15 text-[10px] font-bold text-brand-600 dark:text-brand-300">1</span> Current screen</span>
            </Label>
            <SamplePicker
              selected={studio.source}
              onPick={async (s) => {
                setStudio({ file: await sampleToFile(s), source: s.id })
                setActiveRunId(null)
              }}
            />
            <div className="my-3 flex items-center gap-3 text-[10.5px] uppercase tracking-wider text-subtle">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
            <ImageDrop
              file={sample || studio.source === 'rollout' ? null : studio.file}
              onChange={(file) => {
                setStudio({ file, source: 'upload' })
                setActiveRunId(null)
              }}
              height="h-24"
              label="Upload your own screenshot"
            />
          </section>

          <section>
            <Label htmlFor="action" hint="natural language">
              <span className="flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded bg-brand-500/15 text-[10px] font-bold text-brand-600 dark:text-brand-300">2</span> User action</span>
            </Label>
            <textarea
              id="action"
              rows={3}
              value={studio.action}
              onChange={(e) => setStudio({ action: e.target.value })}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && run()}
              placeholder="e.g. Click the + button to add an alarm"
              className={clsx(inputCls, 'resize-none')}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => setStudio({ action: s })} className={clsx('rounded-md border px-2 py-1 text-left text-[11px] transition', studio.action === s ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'border-line text-muted hover:border-brand-400 hover:text-fg')}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          <Switch checked={studio.preserveStatic} onChange={(v) => setStudio({ preserveStatic: v })} label="Preserve static text" description="Keep keyboard keys and clock faces as pixels rather than sending them to the LLM (Table 6)." />
          {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        </div>
        <div className="border-t border-line p-4">
          <Button size="lg" className="w-full" onClick={run} loading={loading} disabled={!studio.file || !studio.action.trim()}>
            {!loading && <Wand2 className="size-4" />} {loading ? `Predicting… ${elapsed.toFixed(1)} s` : 'Predict next screen'}
          </Button>
          <p className="mt-2 text-center text-[11px] text-subtle"><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to run</p>
        </div>
      </Card>

      {/* ------------------------------------------------------------------ canvas */}
      <Card className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'predicted', label: <><Smartphone className="size-3.5" /> <span className="hidden sm:inline">Predicted</span></> },
              { value: 'compare', label: <><SplitSquareHorizontal className="size-3.5" /> <span className="hidden sm:inline">Compare</span></> },
              { value: 'pipeline', label: <><Workflow className="size-3.5" /> <span className="hidden sm:inline">Pipeline</span></> },
              { value: 'str', label: <><ScanText className="size-3.5" /> <span className="hidden sm:inline">STR</span></> },
            ]}
          />
          <div className="flex items-center gap-1">
            {result && (
              <>
                {view === 'predicted' && (
                  <button onClick={() => setShowBoxes((v) => !v)} title="Show text-symbol boxes" aria-pressed={showBoxes} className={clsx('grid size-8 place-items-center rounded-lg hover:bg-surface-2', showBoxes ? 'bg-brand-500/10 text-brand-500' : 'text-muted hover:text-fg')}><ScanText className="size-4" /></button>
                )}
                <a href={result.images.predicted} download={`vimo-${result.id}.png`} title="Download PNG" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"><Download className="size-4" /></a>
                <button onClick={() => setZoom({ src: result.images.predicted, caption: result.action })} title="Full screen" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"><Maximize2 className="size-4" /></button>
                <Button size="sm" variant="secondary" onClick={rollout} title="Use this prediction as the next input"><Repeat className="size-3.5" /> Roll out</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/evaluate', { state: { runId: result.id } })}><Gauge className="size-3.5" /> Evaluate</Button>
              </>
            )}
          </div>
        </div>

        <div className="@container dot-grid flex min-h-[560px] flex-1 overflow-x-auto p-6 sm:p-10">
          <div className="m-auto">
          {loading ? (
            <div className="flex items-center gap-6 sm:gap-10">
              {inputUrl && (
                <DeviceFrame className="hidden w-[200px] opacity-60 sm:block">
                  <img src={inputUrl} alt="Input" className="block w-full" />
                </DeviceFrame>
              )}
              <div className="hidden flex-col items-center gap-2 text-xs text-muted sm:flex">
                <ArrowRight className="size-5 animate-pulse text-brand-500" />
                <span className="font-mono tabular-nums">{elapsed.toFixed(1)} s</span>
              </div>
              <ScreenSkeleton className="w-[260px]" />
            </div>
          ) : !result ? (
            inputUrl ? (
              <div className="flex flex-col items-center gap-4">
                <DeviceFrame className="w-[260px]">
                  <img src={inputUrl} alt="Input screen" className="block w-full" />
                </DeviceFrame>
                <p className="text-xs text-muted">Input ready. Describe an action and press <span className="font-medium text-fg">Predict next screen</span>.</p>
              </div>
            ) : (
              <EmptyState icon={Smartphone} title="Choose a screen to begin">Pick a sample on the left or upload a screenshot of any Android app.</EmptyState>
            )
          ) : view === 'predicted' ? (
            <div className="flex items-center gap-6 sm:gap-10">
              <figure className="hidden flex-col items-center gap-3 @3xl:flex">
                <DeviceFrame className="w-[200px] opacity-90">
                  <img src={result.images.current} alt="Current" className="block w-full" />
                </DeviceFrame>
                <figcaption className="text-xs text-muted">Current</figcaption>
              </figure>
              <div className="hidden w-[140px] shrink-0 flex-col items-center gap-2 text-center @3xl:flex">
                <span className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium leading-snug text-fg shadow-sm">“{result.action}”</span>
                <ArrowRight className="size-5 text-brand-500" />
              </div>
              <figure className="flex flex-col items-center gap-3">
                <DeviceFrame className="w-[270px] sm:w-[290px]" glow>
                  <SymbolOverlay src={result.images.predicted} symbols={result.symbols} active={active} onHover={setActive} showBoxes={showBoxes} />
                </DeviceFrame>
                <figcaption className="text-xs font-medium text-brand-600 dark:text-brand-300">Predicted next screen</figcaption>
              </figure>
            </div>
          ) : view === 'compare' ? (
            <div className="flex flex-col items-center gap-3">
              <DeviceFrame className="w-[290px]">
                <CompareSlider before={result.images.current} after={result.images.predicted} />
              </DeviceFrame>
              <p className="text-xs text-muted">Drag across the screen to compare</p>
            </div>
          ) : view === 'pipeline' ? (
            <div className="flex items-start gap-3">
              {STAGES.map((s, i) => (
                <div key={s.key} className="flex items-start gap-3">
                  <button onClick={() => setZoom({ src: result.images[s.key], caption: s.title })} className="group flex w-[150px] flex-col items-center gap-2.5 text-center">
                    <DeviceFrame className={clsx('w-full transition group-hover:-translate-y-1', i === 4 && 'ring-2 ring-brand-500')}>
                      <img src={result.images[s.key]} alt={s.title} className="block w-full" />
                    </DeviceFrame>
                    <span>
                      <span className="block text-xs font-semibold text-fg"><span className="text-subtle">{i + 1}.</span> {s.title}</span>
                      <span className="block text-[11px] text-muted">{s.sub}</span>
                    </span>
                  </button>
                  {i < STAGES.length - 1 && <ArrowRight className="mt-[140px] size-4 shrink-0 text-subtle" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-6 sm:gap-10">
              {(['str_current', 'str_next_ids'] as const).map((k) => (
                <figure key={k} className="flex flex-col items-center gap-3">
                  <DeviceFrame className="w-[220px] sm:w-[250px]">
                    <img src={result.images[k]} alt={k} className="block w-full" />
                  </DeviceFrame>
                  <figcaption className="text-xs text-muted">{k === 'str_current' ? 'Current STR' : 'Predicted STR + symbol IDs'}</figcaption>
                </figure>
              ))}
            </div>
          )}
          </div>
        </div>

        {result && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-muted">
            <Clock3 className="size-3.5" />
            <span className="font-medium text-fg tabular-nums">{result.timings.total?.toFixed(2)} s</span>
            <span className="text-subtle">·</span>
            <span className="truncate">{result.source}</span>
            <span className="text-subtle">·</span>
            <span className="truncate">“{result.action}”</span>
          </div>
        )}
      </Card>

      {/* ------------------------------------------------------------------ inspector */}
      <Card className="flex h-fit min-w-0 flex-col lg:col-start-2 min-[1760px]:sticky min-[1760px]:top-[4.75rem] min-[1760px]:col-start-3 min-[1760px]:row-start-1 min-[1760px]:max-h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: 'text', label: <><Type className="size-3.5" /> Text</> },
              { value: 'timing', label: <><Clock3 className="size-3.5" /> Timing</> },
              { value: 'json', label: <><Braces className="size-3.5" /> JSON</> },
            ]}
          />
          {result && tab === 'text' && (
            <div className="flex gap-1">
              <Badge tone="green">{generated} LLM</Badge>
              <Badge>{result.symbols.length - generated} copied</Badge>
            </div>
          )}
        </div>

        {!result ? (
          <EmptyState icon={Layers} title="Inspector">Once you run a prediction, the GUI-text predictor's output and the time each stage took appear here.</EmptyState>
        ) : tab === 'text' ? (
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {result.symbols.map((s) => (
              <li
                key={s.id}
                onMouseEnter={() => setActive(s.id)}
                onMouseLeave={() => setActive(null)}
                className={clsx('flex cursor-default items-center gap-3 px-4 py-2.5 transition', active === s.id ? 'bg-brand-500/10' : 'hover:bg-surface-2')}
              >
                <span className="grid h-6 min-w-6 place-items-center rounded-md bg-rose-500/10 px-1 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">{s.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-fg">{s.text || <span className="text-subtle">(empty)</span>}</p>
                  <p className="truncate text-[11px] text-muted">{s.role}</p>
                </div>
                {s.unchanged ? <Badge>G.1 copy</Badge> : <Badge tone="green">G.3 LLM</Badge>}
              </li>
            ))}
            {result.symbols.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted">No text symbols detected.</li>}
            <li className="px-4 py-2.5 text-[11px] text-subtle">{result.static_text.length} static text region(s) preserved as pixels</li>
          </ul>
        ) : tab === 'timing' ? (
          <div className="space-y-4 p-4">
            {Object.entries(result.timings).filter(([k]) => k !== 'total').map(([k, v]) => (
              <div key={k}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-fg">{TIMING_LABEL[k] ?? k}</span>
                  <span className="font-mono text-muted tabular-nums">{v.toFixed(3)} s</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, (v / (result.timings.total || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-3 text-xs font-semibold text-fg">
              <span>Total</span>
              <span className="font-mono tabular-nums">{result.timings.total?.toFixed(3)} s</span>
            </div>
            <p className="rounded-lg bg-surface-2 p-3 text-[11px] leading-relaxed text-muted">
              Reference from the paper (V100): about 8 s to generate the STR and about 30 s to predict the text. Roughly 2 minutes per request for three candidate actions,
              including overhead.
            </p>
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(json)
                setCopied(true)
                setTimeout(() => setCopied(false), 1200)
              }}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] text-muted hover:text-fg"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />} {copied ? 'Copied' : 'Copy'}
            </button>
            <pre className="max-h-[560px] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-muted">{json}</pre>
          </div>
        )}
      </Card>

      {zoom && <Lightbox src={zoom.src} caption={zoom.caption} onClose={() => setZoom(null)} />}
    </div>
  )
}
