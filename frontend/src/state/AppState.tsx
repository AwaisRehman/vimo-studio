import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PredictResponse } from '../api/types'

export interface Run extends PredictResponse {
  createdAt: number
  source: string
}

export interface StudioInputs {
  file: File | null
  source: string
  action: string
  preserveStatic: boolean
}

type Theme = 'light' | 'dark'

interface Ctx {
  theme: Theme
  toggleTheme: () => void
  runs: Run[]
  addRun: (r: PredictResponse, source: string) => Run
  clearRuns: () => void
  activeRunId: string | null
  setActiveRunId: (id: string | null) => void
  studio: StudioInputs
  setStudio: (p: Partial<StudioInputs>) => void
}

const AppCtx = createContext<Ctx | null>(null)

function initialTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Session state shared across pages (kept in memory — results contain large images). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [runs, setRuns] = useState<Run[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [studio, setStudioState] = useState<StudioInputs>({ file: null, source: '', action: '', preserveStatic: true })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('vimo.theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const addRun = useCallback((r: PredictResponse, source: string) => {
    const run: Run = { ...r, createdAt: Date.now(), source }
    setRuns((xs) => [run, ...xs].slice(0, 30))
    setActiveRunId(run.id)
    return run
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      runs,
      addRun,
      clearRuns: () => {
        setRuns([])
        setActiveRunId(null)
      },
      activeRunId,
      setActiveRunId,
      studio,
      setStudio: (p) => setStudioState((s) => ({ ...s, ...p })),
    }),
    [theme, runs, addRun, activeRunId, studio],
  )
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppStateProvider')
  return c
}
