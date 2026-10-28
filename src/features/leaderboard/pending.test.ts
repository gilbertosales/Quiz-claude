import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitResult, ApiError, type ResultPayload } from './api'
import { loadMyResultIds } from './myResults'
import {
  flushPending,
  loadPending,
  MAX_PENDING,
  submitGame,
  type PendingSubmission,
} from './pending'

const supabase = vi.hoisted(() => ({ configured: true }))
vi.mock('../../lib/supabase', () => ({
  get isSupabaseConfigured() {
    return supabase.configured
  },
  getSupabase: vi.fn(),
}))

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  submitResult: vi.fn(),
}))

const submit = vi.mocked(submitResult)

function item(gameId: string): PendingSubmission {
  return {
    gameId,
    queuedAt: '2026-10-27T10:00:00Z',
    payload: { name: 'Ana', email: 'ana@empresa.com', score: 10 } as ResultPayload,
  }
}

beforeEach(() => {
  submit.mockReset()
  supabase.configured = true
})

describe('fila de reenvio', () => {
  it('envia com o gameId como chave, remove da fila e guarda o id do resultado', async () => {
    submit.mockResolvedValueOnce('result-1').mockResolvedValueOnce('result-2')
    await submitGame(item('g1'))
    await submitGame(item('g2'))
    expect(submit).toHaveBeenCalledWith('g1', item('g1').payload)
    expect(loadPending()).toEqual([])
    expect(loadMyResultIds()).toEqual(['result-2', 'result-1'])
  })

  it('reenvio aceito pelo servidor (idempotente) não duplica o id guardado', async () => {
    submit.mockResolvedValue('result-1')
    await submitGame(item('g1'))
    await submitGame(item('g1'))
    expect(loadMyResultIds()).toEqual(['result-1'])
  })

  it('mantém na fila após erro transitório', async () => {
    submit.mockRejectedValue(new ApiError('network'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'network' })
    expect(loadPending().map((p) => p.gameId)).toEqual(['g1'])
  })

  it('trata exceções desconhecidas como erro de rede', async () => {
    submit.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'network' })
    expect(loadPending()).toHaveLength(1)
  })

  it('descarta da fila após erro permanente', async () => {
    submit.mockRejectedValue(new ApiError('domain'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'domain' })
    expect(loadPending()).toEqual([])
  })

  it('não envia a mesma partida em paralelo', async () => {
    submit.mockResolvedValue('id')
    await Promise.all([submitGame(item('g1')), submitGame(item('g1'))])
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('flushPending reenvia as pendentes e conta os sucessos', async () => {
    submit.mockRejectedValue(new ApiError('network'))
    await submitGame(item('g1')).catch(() => {})
    await submitGame(item('g2')).catch(() => {})
    expect(loadPending()).toHaveLength(2)

    submit.mockReset()
    submit.mockResolvedValueOnce('a').mockRejectedValueOnce(new ApiError('network'))
    await expect(flushPending()).resolves.toBe(1)
    expect(loadPending().map((p) => p.gameId)).toEqual(['g2'])
  })

  it('sem Supabase configurado, falha como "unavailable" e não enfileira', async () => {
    supabase.configured = false
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'unavailable' })
    expect(submit).not.toHaveBeenCalled()
    expect(loadPending()).toEqual([])
    await expect(flushPending()).resolves.toBe(0)
  })

  it(`mantém no máximo ${MAX_PENDING} partidas na fila, descartando as mais antigas`, async () => {
    submit.mockRejectedValue(new ApiError('network'))
    for (let i = 1; i <= MAX_PENDING + 2; i++) await submitGame(item(`g${i}`)).catch(() => {})
    const ids = loadPending().map((p) => p.gameId)
    expect(ids).toHaveLength(MAX_PENDING)
    expect(ids[0]).toBe('g3')
    expect(ids.at(-1)).toBe(`g${MAX_PENDING + 2}`)
  })
})
