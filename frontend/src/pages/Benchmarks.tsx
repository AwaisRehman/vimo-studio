import clsx from 'clsx'
import { Activity, Bot, Globe, Trophy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, PageHeader, Segmented, Stat } from '../components/ui'
import { table1, table10, table2, table3, table5, table7 } from '../data/paper'

const BRAND = '#6366f1'
const MUTED = 'var(--bar-muted)'
const axis = { fontSize: 11, fill: 'var(--subtle)' }
const grid = { stroke: 'var(--line)' }
const tip = {
  contentStyle: { borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,.08)' },
  labelStyle: { color: 'var(--fg)', fontWeight: 600 },
  itemStyle: { color: 'var(--muted)' },
  cursor: { fill: 'var(--surface-2)' },
}

function ChartCard({ title, subtitle, children, h = 300 }: { title: string; subtitle: string; children: ReactNode; h?: number }) {
  return (
    <Card className="min-w-0">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="p-4" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">{children as never}</ResponsiveContainer>
      </div>
    </Card>
  )
}

type Metric = 'sgc' | 'sia' | 'sar' | 'sh'

export default function Benchmarks() {
  const [study, setStudy] = useState<'auto' | 'user'>('auto')
  const t1 = table1.map((r) => ({ method: r.method, ...r[study] }))
  const best = (k: Metric) => Math.max(...t1.map((x) => x[k]))

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Reported in the paper" title="Benchmarks">
        Results from arXiv:2504.13936v2, for comparing against your reproduction. ViMo is shown in indigo; baselines are grey.
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Trophy} label="GUI quality (s_h)" value="0.76" sub="Best of 4 world models" />
        <Stat icon={Bot} label="M3A + ViMo step acc." value="50.16%" sub="+4.15 pts over M3A" />
        <Stat icon={Globe} label="Zero-shot (unseen apps)" value="47.6%" sub="M3A + ViMo, Gemini-2.0-Flash" />
        <Stat icon={Activity} label="Online success" value="40.95%" sub="AndroidWorld, 116 tasks" />
      </div>

      <Card>
        <CardHeader
          title="Table 1 · GUI quality"
          subtitle="s_gc and s_h on a 0–1 scale · s_ia and s_ar in %"
          right={<Segmented value={study} onChange={setStudy} options={[{ value: 'auto', label: 'Automatic' }, { value: 'user', label: 'User study' }]} />}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-subtle">
              <tr className="border-b border-line">{['Method', 's_gc', 's_ia', 's_ar', 's_h'].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {t1.map((r) => (
                <tr key={r.method} className={clsx(r.method === 'ViMo' && 'bg-brand-500/[0.06]')}>
                  <td className="px-5 py-3 font-medium text-fg">{r.method}{r.method === 'ViMo' && <span className="ml-2 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">ours</span>}</td>
                  {(['sgc', 'sia', 'sar', 'sh'] as const).map((k) => (
                    <td key={k} className={clsx('px-5 py-3 font-mono tabular-nums', r[k] === best(k) ? 'font-semibold text-brand-600 dark:text-brand-300' : 'text-muted')}>{r[k].toFixed(2)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Table 2 · App agents" subtitle="Overall step accuracy (%), with and without ViMo">
          <BarChart data={table2} layout="vertical" margin={{ left: 10, right: 24 }}>
            <CartesianGrid horizontal={false} {...grid} />
            <XAxis type="number" domain={[30, 52]} tick={axis} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="agent" tick={axis} width={112} axisLine={false} tickLine={false} />
            <Tooltip {...tip} />
            <Bar dataKey="overall" name="Step acc. (%)" radius={[0, 6, 6, 0]} barSize={16}>
              {table2.map((r) => <Cell key={r.agent} fill={r.ours ? BRAND : MUTED} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Table 3 · World models plugged into M3A" subtitle="Step accuracy (%)">
          <BarChart data={table3} margin={{ right: 10, bottom: 10 }}>
            <CartesianGrid vertical={false} {...grid} />
            <XAxis dataKey="wm" tick={axis} interval={0} angle={-20} textAnchor="end" height={50} axisLine={false} tickLine={false} />
            <YAxis domain={[44, 51]} tick={axis} axisLine={false} tickLine={false} />
            <Tooltip {...tip} />
            <Bar dataKey="acc" name="Step acc. (%)" radius={[6, 6, 0, 0]} barSize={28}>
              {table3.map((r) => <Cell key={r.wm} fill={r.ours ? BRAND : MUTED} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Table 5 · Online AndroidWorld" subtitle="Task success rate (%) over 116 tasks">
          <BarChart data={table5} layout="vertical" margin={{ left: 10, right: 24 }}>
            <CartesianGrid horizontal={false} {...grid} />
            <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="agent" tick={axis} width={170} axisLine={false} tickLine={false} />
            <Tooltip {...tip} />
            <Bar dataKey="acc" name="Task acc. (%)" radius={[0, 6, 6, 0]} barSize={16}>
              {table5.map((r) => <Cell key={r.agent} fill={r.ours ? BRAND : MUTED} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Table 7 · Roll-out iterations" subtitle="T3A + ViMo step accuracy (%). Two steps peak; accumulated errors outweigh the gain at three">
          <LineChart data={table7} margin={{ right: 24, top: 10 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="it" tick={axis} axisLine={false} tickLine={false} />
            <YAxis domain={[38, 48]} tick={axis} axisLine={false} tickLine={false} />
            <Tooltip {...tip} />
            <Line isAnimationActive={false} dataKey="acc" name="Step acc. (%)" stroke={BRAND} strokeWidth={2.5} dot={{ r: 4, fill: BRAND, strokeWidth: 0 }} />
          </LineChart>
        </ChartCard>
      </div>

      <ChartCard title="Table 10 · Trajectory synthesis" subtitle="Accuracy of the whole L-step trajectory (%)" h={340}>
        <LineChart data={(['t1', 't2', 't3', 't4'] as const).map((k, i) => ({ L: `T+${i + 1}`, ...Object.fromEntries(table10.map((r) => [r.wm, r[k]])) }))} margin={{ right: 24, top: 10 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="L" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} />
          <Tooltip {...tip} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
          {table10.map((r) => (
            <Line isAnimationActive={false} key={r.wm} dataKey={r.wm} stroke={r.wm === 'ViMo' ? BRAND : 'var(--subtle)'} strokeWidth={r.wm === 'ViMo' ? 3 : 1.25} strokeDasharray={r.wm === 'ViMo' ? undefined : '4 3'} dot={r.wm === 'ViMo' ? { r: 3.5, fill: BRAND, strokeWidth: 0 } : false} />
          ))}
        </LineChart>
      </ChartCard>
    </div>
  )
}
