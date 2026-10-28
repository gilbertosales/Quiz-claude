import type { PendingSubmission } from '../leaderboard/pending'
import { durationMs, type QuizState } from './quizReducer'
import { scoreAnswers } from './scoring'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev'

/** Limite do banco (check de duration_ms). Acima disso, o envio seria recusado para sempre. */
export const MAX_DURATION_MS = 2 * 60 * 60 * 1000

/** Monta o envio da partida finalizada; null se o estado ainda não permite. */
export function toPendingSubmission(state: QuizState, now = new Date()): PendingSubmission | null {
  const duration = durationMs(state)
  if (!state.identity || !state.gameId || duration === null) return null
  const { score, correctCount, correctByLevel } = scoreAnswers(state.questions, state.answers)
  return {
    gameId: state.gameId,
    queuedAt: now.toISOString(),
    payload: {
      name: state.identity.name,
      email: state.identity.email,
      score,
      correctCount,
      correctByLevel,
      // O tempo só desempata: uma partida esquecida aberta entra com o tempo máximo
      // em vez de ser descartada.
      durationMs: Math.min(duration, MAX_DURATION_MS),
      questionIds: state.questions.map((q) => q.id),
      appVersion: APP_VERSION,
    },
  }
}
