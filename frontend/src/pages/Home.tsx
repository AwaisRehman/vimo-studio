import { ArrowRight, BarChart3, BookOpen, Bot, Check, Copy, Gauge, ScanText, Sparkles, Type, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, DeviceFrame } from '../components/ui'
import { paper } from '../data/paper'
import { samples, sampleToFile } from '../data/samples'
import { useApp } from '../state/AppState'

const BIBTEX = `@article{luo2025vimo,
  title   = {A Generative Visual GUI World Model for App Agents},
  author  = {Luo, Dezhao and Tang, Bohan and Li, Kang and Papoudakis, Georgios and Song, Jifei and Gong, Shaogang and Hao, Jianye and Wang, Jun and Shao, Kun},
  journal = {arXiv preprint arXiv:2504.13936},
  year    = {2025}
}`

const steps = [
  { icon: ScanText, title: 'Symbolise text', eq: 'xₖ → STRₓₖ', body: 'OCR finds every piece of text and covers it with a placeholder box. The diffusion model then only has to place text, not spell it.' },
  { icon: Sparkles, title: 'Predict graphics', eq: 'ε_θ(zₜ, E(STRₓₖ), t, a)', body: 'A fine-tuned InstructPix2Pix model draws the next screen’s layout, conditioned on the current STR and the action.' },
  { icon: Type, title: 'Write the text', eq: 'LLM(STRᵃₖ₊₁, xₖ, a, T)', body: 'An LLM decides which text stays the same, what role each box plays, and what it should say. The text is then drawn in sharp.' },
]

const tools = [
  { to: '/studio', icon: Wand2, title: 'Studio', body: 'Predict the next screen and inspect every stage of the pipeline.' },
  { to: '/agent', icon: Bot, title: 'Agent Planner', body: 'Compare candidate actions by their imagined outcomes (Algorithm 1).' },
  { to: '/evaluate', icon: Gauge, title: 'Evaluation', body: 'Score generated screens with s_gc, s_ia, s_ar and s_h.' },
  { to: '/benchmarks', icon: BarChart3, title: 'Benchmarks', body: 'Reported results across 6 agents and 6 world models.' },
]

export default function Home() {
  const { setStudio, setActiveRunId, runs } = useApp()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const openSample = async (i: number) => {
    const s = samples[i]
    setStudio({ file: await sampleToFile(s), source: s.id, action: s.actions[0] })
    setActiveRunId(null)
    navigate('/studio')
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(99,102,241,0.18),transparent_70%)]" />
        <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <div className="min-w-0">
            <Badge tone="brand"><Sparkles className="size-3" /> Research preview · arXiv 2504.13936</Badge>
            <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl">
              See the next screen <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">before you tap.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
              ViMo is a generative <em>visual</em> world model for mobile apps. Give it a screenshot and an action, and it renders the screen that comes next.
              Diffusion handles the graphics and an LLM handles the text, so the predicted screens stay readable. App agents use it to plan before they act.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/studio" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
                <Wand2 className="size-4" /> Open Studio
              </Link>
              <a href={paper.arxiv} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-medium text-fg hover:bg-surface-2">
                <BookOpen className="size-4" /> Read the paper
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 sm:gap-6 border-t border-line pt-6">
              {[
                ['+14.07%', 'agent step accuracy'],
                ['40.95%', 'AndroidWorld success'],
                ['0.88', 'user-study s_h'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-xl font-semibold sm:text-2xl tracking-tight text-fg tabular-nums">{v}</dt>
                  <dd className="mt-0.5 text-xs text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* visual: current → STR → symbols */}
          <div className="relative mx-auto flex h-[400px] w-full min-w-0 max-w-[520px] items-center justify-center sm:h-[500px]">
            <DeviceFrame className="absolute left-0 top-10 w-[150px] -rotate-6 opacity-90 sm:left-2 sm:w-[180px]">
              <img src="/samples/clock.png" alt="Current screen" className="block w-full" />
            </DeviceFrame>
            <DeviceFrame className="relative z-10 w-[190px] sm:w-[220px]" glow>
              <img src="/hero/clock_str.png" alt="Symbolic Text Representation" className="block w-full" />
            </DeviceFrame>
            <DeviceFrame className="absolute right-0 top-14 w-[150px] rotate-6 opacity-90 sm:right-2 sm:w-[180px]">
              <img src="/hero/clock_ids.png" alt="Located text symbols" className="block w-full" />
            </DeviceFrame>
            <span className="absolute bottom-4 left-1/2 z-20 w-max max-w-[92%] -translate-x-1/2 rounded-full text-center border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-lg">
              <span className="mr-1.5 text-brand-500">●</span>a = “Click the + button to add an alarm”
            </span>
            <span className="absolute left-2 top-0 text-[11px] font-medium text-muted">xₖ</span>
            <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[11px] font-medium text-brand-500">STR</span>
            <span className="absolute right-2 top-0 text-[11px] font-medium text-muted">symbols T</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={s.title} className="p-5">
            <div className="flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20"><s.icon className="size-4" /></div>
              <span className="font-mono text-[11px] text-subtle">0{i + 1}</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-fg">{s.title}</h3>
            <code className="mt-1 block font-mono text-[11px] text-brand-600 dark:text-brand-300">{s.eq}</code>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.body}</p>
          </Card>
        ))}
      </section>

      {/* ------------------------------------------------------------ samples */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-fg">Start from a sample</h2>
            <p className="mt-0.5 text-sm text-muted">Opens in Studio with a suggested action ready to run.</p>
          </div>
          <Link to="/studio" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">Upload your own →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          {samples.map((s, i) => (
            <button key={s.id} onClick={() => openSample(i)} className="group overflow-hidden rounded-2xl border border-line bg-surface-2 text-left transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg">
              <div className="h-48 overflow-hidden bg-canvas sm:h-60">
                <img src={s.src} alt={s.name} loading="lazy" className="w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="border-t border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-fg">{s.name}</p>
                  <Badge>{s.category}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted">→ {s.actions[0]}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* ------------------------------------------------------------ tools + recent */}
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Link key={t.to} to={t.to} className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-brand-400">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg ring-1 ring-line group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600"><t.icon className="size-4" /></div>
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-semibold text-fg">{t.title} <ArrowRight className="size-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.body}</p>
              </div>
            </Link>
          ))}
        </div>
        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h3 className="text-sm font-semibold text-fg">Recent predictions</h3>
            <Link to="/history" className="text-xs font-medium text-brand-600 dark:text-brand-300">View all</Link>
          </div>
          {runs.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-5 py-8 text-center text-sm text-muted">Nothing yet. Run your first prediction in Studio.</p>
          ) : (
            <ul className="divide-y divide-line">
              {runs.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <button onClick={() => { setActiveRunId(r.id); navigate('/studio') }} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2">
                    <img src={r.images.predicted} alt="" className="h-12 w-[22px] rounded object-cover object-top ring-1 ring-line" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-fg">{r.action}</p>
                      <p className="truncate text-[11px] text-muted">{r.source} · {new Date(r.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ------------------------------------------------------------ citation */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Cite</h3>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(BIBTEX)
              setCopied(true)
              setTimeout(() => setCopied(false), 1200)
            }}
            className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy BibTeX'}
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-[11px] leading-relaxed text-muted">{BIBTEX}</pre>
        <p className="mt-4 text-xs text-subtle">This is an independent reproduction and demo; it is not affiliated with the paper's authors.</p>
      </Card>
    </div>
  )
}
