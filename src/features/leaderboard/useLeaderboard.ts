import { useCallback, useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardRow } from './api'
import { loadMyResultIds } from './myResults'

export type LeaderboardStatus = 'idle' | 'loading' | 'ready' | 'error'

interface Settled {
  key: string
  rows: LeaderboardRow[]
  error: string | null
}

export function useLeaderboard(enabled = true) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  // "loading" é derivado: há requisição para esta chave ainda sem resposta.
  const key = String(attempt)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    // Lido na hora da requisição: inclui a partida que acabou de ser enviada.
    fetchLeaderboard(loadMyResultIds())
      .then((rows) => {
        if (!cancelled) setSettled({ key, rows, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const error = err instanceof Error ? err.message : 'Erro ao carregar o ranking.'
          setSettled({ key, rows: [], error })
        }
      })
    return () => {
      cancelled = true
    }
  }, [enabled, key])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  let status: LeaderboardStatus = 'idle'
  if (enabled) status = settled?.key !== key ? 'loading' : settled.error ? 'error' : 'ready'
  const current = status === 'ready' || status === 'error' ? settled : null

  return { status, rows: current?.rows ?? [], error: current?.error ?? null, reload }
}
