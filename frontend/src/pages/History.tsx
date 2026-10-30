import { History as HistoryIcon, Search, Trash2, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DeviceFrame, EmptyState, PageHeader, inputCls } from '../components/ui'
import { useApp } from '../state/AppState'

export default function HistoryPage() {
  const { runs, clearRuns, setActiveRunId } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const list = useMemo(() => runs.filter((r) => `${r.action} ${r.source}`.toLowerCase().includes(q.toLowerCase())), [runs, q])

  return (
    <div>
      <PageHeader
        eyebrow="Session"
        title="History"
        actions={runs.length > 0 && <Button variant="secondary" size="sm" onClick={clearRuns}><Trash2 className="size-3.5" /> Clear</Button>}
      >
        Predictions from this session. Open one to inspect it in Studio. History stays in memory and is cleared when you reload the page.
      </PageHeader>

      {runs.length === 0 ? (
        <Card>
          <EmptyState icon={HistoryIcon} title="No predictions yet" action={<Link to="/studio"><Button><Wand2 className="size-4" /> Open Studio</Button></Link>}>
            Each prediction you run in Studio shows up here.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by action or source" className={`${inputCls} pl-9`} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {list.map((r) => (
              <button key={r.id} onClick={() => { setActiveRunId(r.id); navigate('/studio') }} className="group overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg">
                <div className="dot-grid flex justify-center px-6 pb-4 pt-6">
                  <DeviceFrame className="w-full max-w-[150px]">
                    <img src={r.images.predicted} alt="" className="block w-full" />
                  </DeviceFrame>
                </div>
                <div className="border-t border-line p-3">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-fg">{r.action}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge>{r.source}</Badge>
                    <span className="text-[11px] text-subtle">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
