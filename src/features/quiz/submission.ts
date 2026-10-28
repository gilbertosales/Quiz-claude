import type { PendingSubmission } from '../leaderboard/pending'
import { durationMs, type QuizState } from './quizReducer'
import { scoreAnswers } from './scoring'

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev'

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
      durationMs: duration,
      questionIds: state.questions.map((q) => q.id),
      appVersion: APP_VERSION,
    },
  }
}
