import clsx from 'clsx'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: Tone
  title: string
  body?: string
}

const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs.slice(-3), { ...t, id }])
    setTimeout(() => dismiss(id), t.tone === 'error' ? 7000 : 3500)
  }, [])
  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {items.map((t) => {
          const I = Icon[t.tone]
          return (
            <div key={t.id} className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-lg shadow-black/5">
              <I className={clsx('mt-0.5 size-4 shrink-0', t.tone === 'success' && 'text-emerald-500', t.tone === 'error' && 'text-rose-500', t.tone === 'info' && 'text-brand-500')} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-muted">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-subtle hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
