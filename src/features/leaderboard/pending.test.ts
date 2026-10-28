import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitResult, SubmitError, type ResultPayload } from './api'
import { flushPending, loadPending, submitGame, type PendingSubmission } from './pending'

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
})

describe('fila de reenvio', () => {
  it('remove da fila após envio com sucesso', async () => {
    submit.mockResolvedValue('id')
    await submitGame(item('g1'))
    expect(loadPending()).toEqual([])
  })

  it('mantém na fila após erro transitório', async () => {
    submit.mockRejectedValue(new SubmitError('network'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'network' })
    expect(loadPending().map((p) => p.gameId)).toEqual(['g1'])
  })

  it('trata exceções desconhecidas como erro de rede', async () => {
    submit.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'network' })
    expect(loadPending()).toHaveLength(1)
  })

  it('descarta da fila após erro permanente', async () => {
    submit.mockRejectedValue(new SubmitError('domain'))
    await expect(submitGame(item('g1'))).rejects.toMatchObject({ kind: 'domain' })
    expect(loadPending()).toEqual([])
  })

  it('não envia a mesma partida em paralelo', async () => {
    submit.mockResolvedValue('id')
    await Promise.all([submitGame(item('g1')), submitGame(item('g1'))])
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('flushPending reenvia as pendentes e conta os sucessos', async () => {
    submit.mockRejectedValue(new SubmitError('network'))
    await submitGame(item('g1')).catch(() => {})
    await submitGame(item('g2')).catch(() => {})
    expect(loadPending()).toHaveLength(2)

    submit.mockReset()
    submit.mockResolvedValueOnce('a').mockRejectedValueOnce(new SubmitError('network'))
    await expect(flushPending()).resolves.toBe(1)
    expect(loadPending().map((p) => p.gameId)).toEqual(['g2'])
  })
})
