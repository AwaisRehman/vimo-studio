import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Health } from '../api/types'

export type HealthState = { status: 'loading' } | { status: 'online'; data: Health } | { status: 'offline'; error: string }

export function useHealth(pollMs = 15000) {
  const [state, setState] = useState<HealthState>({ status: 'loading' })
  const check = useCallback(async () => {
    try {
      setState({ status: 'online', data: await api.health() })
    } catch (e) {
      setState({ status: 'offline', error: (e as Error).message })
    }
  }, [])
  useEffect(() => {
    check()
    const t = setInterval(check, pollMs)
    return () => clearInterval(t)
  }, [check, pollMs])
  return { state, refresh: check }
}
