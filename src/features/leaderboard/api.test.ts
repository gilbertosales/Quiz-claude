import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabase } from '../../lib/supabase'
import { fetchLeaderboard, submitResult, SubmitError, type ResultPayload } from './api'

vi.mock('../../lib/supabase', () => ({ getSupabase: vi.fn() }))

const rpc = vi.fn()
const payload: ResultPayload = {
  name: 'Ana',
  email: 'ana@empresa.com',
  score: 30,
  correctCount: 14,
  correctByLevel: { negocio: 5, basico: 4, intermediario: 3, avancado: 2 },
  durationMs: 120_000,
  questionIds: ['neg-01'],
  appVersion: '1.0.0',
}

beforeEach(() => {
  rpc.mockReset()
  vi.mocked(getSupabase).mockResolvedValue({ rpc } as never)
})

async function submitErrorKind(error: { message?: string; code?: string }) {
  rpc.mockResolvedValue({ data: null, error })
  const err = await submitResult(payload).catch((e: unknown) => e)
  expect(err).toBeInstanceOf(SubmitError)
  return (err as SubmitError).kind
}

describe('submitResult', () => {
  it('chama a RPC submit_result com os parâmetros mapeados', async () => {
    rpc.mockResolvedValue({ data: 'uuid-1', error: null })
    await expect(submitResult(payload)).resolves.toBe('uuid-1')
    expect(rpc).toHaveBeenCalledWith('submit_result', {
      p_name: 'Ana',
      p_email: 'ana@empresa.com',
      p_score: 30,
      p_correct_count: 14,
      p_correct_by_level: payload.correctByLevel,
      p_duration_ms: 120_000,
      p_question_ids: ['neg-01'],
      p_app_version: '1.0.0',
    })
  })

  it('classifica os erros do banco', async () => {
    expect(await submitErrorKind({ code: 'P0001', message: 'email domain not allowed' })).toBe(
      'domain',
    )
    expect(await submitErrorKind({ code: 'P0001', message: 'too many submissions' })).toBe(
      'rateLimited',
    )
    expect(await submitErrorKind({ code: '23514', message: 'check constraint' })).toBe('invalid')
    expect(await submitErrorKind({ code: '', message: 'TypeError: Failed to fetch' })).toBe(
      'network',
    )
  })

  it('falha como "unavailable" sem Supabase configurado', async () => {
    vi.mocked(getSupabase).mockResolvedValue(null)
    await expect(submitResult(payload)).rejects.toMatchObject({
      kind: 'unavailable',
      permanent: false,
    })
  })
})

describe('fetchLeaderboard', () => {
  it('chama get_leaderboard e converte as colunas', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          position: 1,
          name: 'Ana',
          score: 50,
          correct_count: 20,
          duration_ms: 90_000,
          created_at: '2026-10-27T10:00:00Z',
          is_me: true,
        },
      ],
      error: null,
    })
    const rows = await fetchLeaderboard('ana@empresa.com')
    expect(rpc).toHaveBeenCalledWith('get_leaderboard', { p_limit: 50, p_email: 'ana@empresa.com' })
    expect(rows).toEqual([
      {
        position: 1,
        name: 'Ana',
        score: 50,
        correctCount: 20,
        durationMs: 90_000,
        createdAt: '2026-10-27T10:00:00Z',
        isMe: true,
      },
    ])
  })
})
