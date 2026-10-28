import { LEVELS, POINTS_BY_LEVEL, type CorrectByLevel, type Question } from '../../types/quiz'

export interface ScoreSummary {
  score: number
  correctCount: number
  correctByLevel: CorrectByLevel
}

export function emptyByLevel(): CorrectByLevel {
  return Object.fromEntries(LEVELS.map((l) => [l, 0])) as CorrectByLevel
}

/** Pontua as respostas dadas (null = ainda não respondida). Erros não descontam (RF08). */
export function scoreAnswers(
  questions: readonly Question[],
  answers: readonly (boolean | null)[],
): ScoreSummary {
  const correctByLevel = emptyByLevel()
  let score = 0
  let correctCount = 0
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) {
      correctByLevel[q.level]++
      correctCount++
      score += POINTS_BY_LEVEL[q.level]
    }
  })
  return { score, correctCount, correctByLevel }
}
