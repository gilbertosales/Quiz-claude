import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { MAX_SCORE } from '../../types/quiz'
import { drawQuestions } from './draw'
import { scoreAnswers } from './scoring'

const game = drawQuestions(QUESTIONS)

describe('scoreAnswers', () => {
  it('pontuação máxima é 50 quando acerta tudo', () => {
    const result = scoreAnswers(
      game,
      game.map((q) => q.answer),
    )
    expect(MAX_SCORE).toBe(50)
    expect(result).toEqual({
      score: 50,
      correctCount: 20,
      correctByLevel: { negocio: 5, basico: 5, intermediario: 5, avancado: 5 },
    })
  })

  it('erros não descontam pontos', () => {
    const result = scoreAnswers(
      game,
      game.map((q) => !q.answer),
    )
    expect(result.score).toBe(0)
    expect(result.correctCount).toBe(0)
  })

  it('pondera por nível (1/2/3/4)', () => {
    // Acerta só a 1ª pergunta de cada nível.
    const answers = game.map((q, i) => (i % 5 === 0 ? q.answer : !q.answer))
    const result = scoreAnswers(game, answers)
    expect(result.score).toBe(1 + 2 + 3 + 4)
    expect(result.correctByLevel).toEqual({ negocio: 1, basico: 1, intermediario: 1, avancado: 1 })
  })

  it('ignora perguntas ainda não respondidas', () => {
    const answers: (boolean | null)[] = game.map(() => null)
    answers[0] = game[0].answer
    expect(scoreAnswers(game, answers).score).toBe(1)
  })
})
