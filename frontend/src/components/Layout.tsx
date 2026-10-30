import clsx from 'clsx'
import {
  BarChart3, BookOpen, Bot, ChevronsLeft, ChevronsRight, FileCode2, Gauge, History, LayoutDashboard, Menu, Moon, Plus, Settings, Sun, Wand2, X,
} from 'lucide-react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getApiBase } from '../api/client'
import { paper } from '../data/paper'
import { useApp } from '../state/AppState'
import { useHealth } from './useHealth'

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }>; external?: boolean }
const groups: { title: string; items: Item[] }[] = [
  {
    title: 'Workspace',
    items: [
      { to: '/', label: 'Home', icon: LayoutDashboard },
      { to: '/studio', label: 'Studio', icon: Wand2 },
      { to: '/agent', label: 'Agent Planner', icon: Bot },
      { to: '/evaluate', label: 'Evaluation', icon: Gauge },
      { to: '/history', label: 'History', icon: History },
    ],
  },
  {
    title: 'Research',
    items: [
      { to: '/benchmarks', label: 'Benchmarks', icon: BarChart3 },
      { to: paper.arxiv, label: 'Paper', icon: BookOpen, external: true },
      { to: '/docs', label: 'API reference', icon: FileCode2, external: true },
    ],
  },
  { title: 'System', items: [{ to: '/settings', label: 'Settings', icon: Settings }] },
]
const allItems = groups.flatMap((g) => g.items)

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-8 shrink-0" />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-fg">ViMo Studio</span>
          <span className="block text-[10.5px] text-subtle">Visual GUI world model</span>
        </span>
      )}
    </Link>
  )
}

function NavItem({ item, compact, onNavigate }: { item: Item; compact?: boolean; onNavigate?: () => void }) {
  const cls = (active: boolean) =>
    clsx(
      'group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
      compact && 'justify-center px-0',
      active ? 'bg-surface-2 text-fg ring-1 ring-inset ring-line' : 'text-muted hover:bg-surface-2 hover:text-fg',
    )
  const content = (active: boolean) => (
    <>
      <item.icon className={clsx('size-4 shrink-0', active ? 'text-brand-500' : 'text-subtle group-hover:text-fg')} />
      {!compact && <span className="truncate">{item.label}</span>}
    </>
  )
  if (item.external) {
    const href = item.to.startsWith('/') ? `${getApiBase()}${item.to}` : item.to
    return (
      <a href={href} target="_blank" rel="noreferrer" title={compact ? item.label : undefined} className={cls(false)} onClick={onNavigate}>
        {content(false)}
      </a>
    )
  }
  return (
    <NavLink to={item.to} end={item.to === '/'} title={compact ? item.label : undefined} onClick={onNavigate} className={({ isActive }) => cls(isActive)}>
      {({ isActive }) => content(isActive)}
    </NavLink>
  )
}

function Sidebar({ compact, onNavigate, onToggle }: { compact?: boolean; onNavigate?: () => void; onToggle?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={clsx('flex h-14 items-center border-b border-line', compact ? 'justify-center' : 'px-4')}>
        <Logo compact={compact} />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.title}>
            {!compact && <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-subtle">{g.title}</p>}
            <div className="space-y-0.5">
              {g.items.map((i) => <NavItem key={i.label} item={i} compact={compact} onNavigate={onNavigate} />)}
            </div>
          </div>
        ))}
      </nav>
      {onToggle && (
        <div className="border-t border-line p-3">
          <button onClick={onToggle} className={clsx('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted hover:bg-surface-2 hover:text-fg', compact && 'justify-center px-0')} aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}>
            {compact ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
          </button>
        </div>
      )}
    </div>
  )
}

function StatusPill() {
  const { state } = useHealth()
  const mock = state.status === 'online' && Object.values(state.data.mode).some((m) => m.startsWith('mock'))
  const label = state.status === 'online' ? (mock ? 'Mock backend' : 'Model online') : state.status === 'offline' ? 'API offline' : 'Connecting'
  return (
    <Link to="/settings" title={state.status === 'offline' ? state.error : label} className="flex h-8 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-muted hover:text-fg">
      <span className="relative flex size-2">
        {state.status === 'online' && <span className={clsx('absolute inset-0 animate-ping rounded-full opacity-60', mock ? 'bg-amber-400' : 'bg-emerald-400')} />}
        <span className={clsx('relative size-2 rounded-full', state.status === 'online' ? (mock ? 'bg-amber-500' : 'bg-emerald-500') : state.status === 'offline' ? 'bg-rose-500' : 'bg-zinc-400')} />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useApp()
  const [drawer, setDrawer] = useState(false)
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem('vimo.sidebar') === 'compact'
    } catch {
      return false
    }
  })
  const { pathname } = useLocation()
  const current = allItems.find((n) => !n.external && (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))

  useEffect(() => {
    try {
      localStorage.setItem('vimo.sidebar', compact ? 'compact' : 'full')
    } catch {
      /* ignore */
    }
  }, [compact])
  useEffect(() => {
    setDrawer(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className={clsx('min-h-screen lg:grid', compact ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[232px_1fr]')}>
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
        <Sidebar compact={compact} onToggle={() => setCompact((c) => !c)} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-in border-r border-line bg-surface shadow-2xl">
            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:bg-surface-2">
              <X className="size-4" />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="-ml-1 rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden">
            <Menu className="size-5" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-subtle sm:inline">ViMo</span>
            <span className="hidden text-subtle sm:inline">/</span>
            <span className="truncate font-medium text-fg">{current?.label ?? 'Home'}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <StatusPill />
            <button onClick={toggleTheme} aria-label="Toggle theme" className="grid size-8 place-items-center rounded-lg border border-line bg-surface text-muted hover:text-fg">
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            {!pathname.startsWith('/studio') && (
              <Link to="/studio" className="hidden h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white shadow-sm hover:bg-brand-700 sm:flex">
                <Plus className="size-3.5" /> New prediction
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
