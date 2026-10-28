import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../lib/storage'
import { loadHistory, recordGame, type GameRecord } from './history'

const game = (gameId: string, score: number, durationMs = 100_000): GameRecord => ({
  gameId,
  score,
  durationMs,
  correctCount: 0,
  playedAt: '2026-10-27T10:00:00Z',
})

describe('histórico local', () => {
  it('começa vazio', () => {
    expect(loadHistory()).toEqual({ best: null, recent: [] })
  })

  it('guarda o recorde (desempate por tempo) e as últimas 5 partidas', () => {
    recordGame(game('a', 20))
    recordGame(game('b', 30, 200_000))
    recordGame(game('c', 30, 150_000))
    recordGame(game('d', 10))
    recordGame(game('e', 5))
    const h = recordGame(game('f', 1))
    expect(h.best?.gameId).toBe('c')
    expect(h.recent.map((g) => g.gameId)).toEqual(['f', 'e', 'd', 'c', 'b'])
    expect(loadHistory()).toEqual(h)
  })

  it('é idempotente por partida', () => {
    recordGame(game('a', 20))
    expect(recordGame(game('a', 20)).recent).toHaveLength(1)
  })

  it('ignora dados corrompidos', () => {
    localStorage.setItem(STORAGE_KEYS.history, '{not json')
    expect(loadHistory()).toEqual({ best: null, recent: [] })
  })
})
