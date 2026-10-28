import { isObject, readJSON, STORAGE_KEYS, writeJSON } from '../../lib/storage'

export interface GameRecord {
  gameId: string
  score: number
  correctCount: number
  durationMs: number
  playedAt: string
}

export interface LocalHistory {
  best: GameRecord | null
  recent: GameRecord[]
}

const RECENT_LIMIT = 5

const isHistory = (v: unknown): v is LocalHistory =>
  isObject(v) && Array.isArray(v.recent) && (v.best === null || isObject(v.best))

export function loadHistory(): LocalHistory {
  return readJSON('local', STORAGE_KEYS.history, isHistory) ?? { best: null, recent: [] }
}

/** Mesmo critério do ranking: pontuação ↓, depois tempo ↑. */
function isBetter(a: GameRecord, b: GameRecord | null): boolean {
  if (!b) return true
  return a.score > b.score || (a.score === b.score && a.durationMs < b.durationMs)
}

/** Registra a partida (idempotente por gameId) e devolve o histórico atualizado (RF18). */
export function recordGame(game: GameRecord): LocalHistory {
  const history = loadHistory()
  if (history.recent.some((g) => g.gameId === game.gameId)) return history
  const next: LocalHistory = {
    best: isBetter(game, history.best) ? game : history.best,
    recent: [game, ...history.recent].slice(0, RECENT_LIMIT),
  }
  writeJSON('local', STORAGE_KEYS.history, next)
  return next
}
