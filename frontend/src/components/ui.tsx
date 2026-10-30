import clsx from 'clsx'
import { Loader2, X } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'

/* ----------------------------------------------------------------- surfaces */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-2xl border border-line bg-surface', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, right, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon className="size-4 shrink-0 text-brand-500" />}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {children && <div className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}

/* ----------------------------------------------------------------- controls */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-11 px-5 text-sm',
        variant === 'primary' && 'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 active:scale-[0.98]',
        variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-surface-2',
        variant === 'ghost' && 'text-muted hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

const badgeTones = {
  neutral: 'bg-surface-2 text-muted ring-line',
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  red: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-400',
  brand: 'bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:text-brand-300',
}
export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', badgeTones[tone], className)}>
      {children}
    </span>
  )
}

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg">{children}</label>
      {hint && <span className="text-[11px] text-subtle">{hint}</span>}
    </div>
  )
}

export const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-subtle transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15'

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-surface-2 p-0.5 text-xs ring-1 ring-inset ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition',
            value === o.value ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:bg-surface-2">
      <span className={clsx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-surface-3')}>
        <span className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
      <span>
        <span className="block text-xs font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{description}</span>}
      </span>
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">{children}</kbd>
}

/* ----------------------------------------------------------------- feedback */
export function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-xs text-rose-700 dark:text-rose-300">
      <span className="flex-1 leading-relaxed">{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: ComponentType<{ className?: string }>; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-fg">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, icon: Icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && <Icon className="size-4 text-subtle" />}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export function Lightbox({ src, caption, onClose }: { src: string; caption?: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-black/80 p-6 backdrop-blur-sm" onClick={onClose}>
      <img src={src} alt={caption} className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
      {caption && <p className="mt-3 text-sm text-white/80">{caption}</p>}
    </div>
  )
}

/* ----------------------------------------------------------------- device */
/** Phone frame. Children render inside the screen; width is controlled by className. */
export function DeviceFrame({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={clsx('relative rounded-[2.2rem] bg-zinc-900 p-[7px] shadow-xl ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10', glow && 'shadow-brand-500/25', className)}>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-white">
        {children}
        <span className="pointer-events-none absolute left-1/2 top-2 h-[14px] w-[64px] -translate-x-1/2 rounded-full bg-zinc-900/90" />
      </div>
    </div>
  )
}

export function ScreenSkeleton({ className }: { className?: string }) {
  return (
    <DeviceFrame className={className}>
      <div className="shimmer aspect-[540/1170] w-full" />
    </DeviceFrame>
  )
}
