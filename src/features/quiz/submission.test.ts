import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { drawQuestions } from './draw'
import { initialQuizState, quizReducer, type QuizState } from './quizReducer'
import { MAX_DURATION_MS, toPendingSubmission } from './submission'

function finishedAfter(activeMs: number): QuizState {
  let s = [
    { type: 'START' as const },
    {
      type: 'SET_IDENTITY' as const,
      identity: { name: 'Ana', email: 'ana@empresa.com' },
      questions: drawQuestions(QUESTIONS),
      gameId: 'g1',
      now: 0,
    },
  ].reduce(quizReducer, initialQuizState)
  for (let i = 0; i < 20; i++) {
    s = quizReducer(s, { type: 'ANSWER', answer: true, now: ((i + 1) * activeMs) / 20 })
    s = quizReducer(s, { type: 'NEXT' })
    if (s.phase === 'levelTransition') s = quizReducer(s, { type: 'NEXT' })
  }
  return s
}

describe('toPendingSubmission', () => {
  it('só monta o envio de partidas finalizadas', () => {
    expect(toPendingSubmission(initialQuizState)).toBeNull()
  })

  it('envia o tempo ativo', () => {
    expect(toPendingSubmission(finishedAfter(300_000))?.payload.durationMs).toBe(300_000)
  })

  it('limita a duração ao máximo aceito pelo banco, em vez de perder a partida', () => {
    const item = toPendingSubmission(finishedAfter(5 * 60 * 60 * 1000))
    expect(item?.payload.durationMs).toBe(MAX_DURATION_MS)
    expect(MAX_DURATION_MS).toBe(7_200_000) // check duration_ms do banco
  })
})
