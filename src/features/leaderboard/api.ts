import { getSupabase } from '../../lib/supabase'
import type { CorrectByLevel } from '../../types/quiz'

export interface ResultPayload {
  name: string
  email: string
  score: number
  correctCount: number
  correctByLevel: CorrectByLevel
  durationMs: number
  questionIds: string[]
  appVersion: string
}

export interface LeaderboardRow {
  position: number
  name: string
  score: number
  correctCount: number
  durationMs: number
  createdAt: string
  isMe: boolean
}

export type SubmitErrorKind = 'unavailable' | 'network' | 'rateLimited' | 'domain' | 'invalid'

const MESSAGES: Record<SubmitErrorKind, string> = {
  unavailable: 'O ranking não está configurado neste ambiente.',
  network: 'Não foi possível conectar ao servidor.',
  rateLimited: 'Muitos envios seguidos. Tente novamente em instantes.',
  domain: 'Este domínio de e-mail não pode participar do ranking.',
  invalid: 'O resultado foi recusado pelo servidor.',
}

export class SubmitError extends Error {
  readonly kind: SubmitErrorKind
  constructor(kind: SubmitErrorKind) {
    super(MESSAGES[kind])
    this.kind = kind
  }
  /** Erros permanentes não adianta reenviar: a partida sai da fila. */
  get permanent(): boolean {
    return this.kind === 'domain' || this.kind === 'invalid'
  }
}

interface PostgrestLikeError {
  message?: string
  code?: string
}

function classify(error: PostgrestLikeError): SubmitErrorKind {
  const message = error.message ?? ''
  if (message.includes('email domain not allowed')) return 'domain'
  if (message.includes('too many submissions')) return 'rateLimited'
  // check_violation, not_null_violation, invalid_text_representation, função/parâmetros inválidos
  if (['23514', '23502', '22P02', 'PGRST202'].includes(error.code ?? '')) return 'invalid'
  return 'network'
}

export async function submitResult(payload: ResultPayload): Promise<string> {
  const supabase = await getSupabase()
  if (!supabase) throw new SubmitError('unavailable')
  const { data, error } = await supabase.rpc('submit_result', {
    p_name: payload.name,
    p_email: payload.email,
    p_score: payload.score,
    p_correct_count: payload.correctCount,
    p_correct_by_level: payload.correctByLevel,
    p_duration_ms: payload.durationMs,
    p_question_ids: payload.questionIds,
    p_app_version: payload.appVersion,
  })
  if (error) throw new SubmitError(classify(error))
  return data as string
}

interface LeaderboardRowDb {
  position: number
  name: string
  score: number
  correct_count: number
  duration_ms: number
  created_at: string
  is_me: boolean
}

export async function fetchLeaderboard(
  email: string | null,
  limit = 50,
): Promise<LeaderboardRow[]> {
  const supabase = await getSupabase()
  if (!supabase) throw new SubmitError('unavailable')
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_limit: limit,
    p_email: email,
  })
  if (error) throw new SubmitError(classify(error))
  return ((data ?? []) as LeaderboardRowDb[]).map((r) => ({
    position: Number(r.position),
    name: r.name,
    score: r.score,
    correctCount: r.correct_count,
    durationMs: r.duration_ms,
    createdAt: r.created_at,
    isMe: r.is_me,
  }))
}
