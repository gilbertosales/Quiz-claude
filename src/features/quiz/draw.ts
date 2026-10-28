import { LEVELS, QUESTIONS_PER_LEVEL, type Question } from '../../types/quiz'

export type Rng = () => number

/** Fisher–Yates; devolve uma cópia embaralhada. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Sorteia `perLevel` perguntas de cada nível, mantendo a ordem dos níveis (RF01). */
export function drawQuestions(
  bank: readonly Question[],
  rng: Rng = Math.random,
  perLevel = QUESTIONS_PER_LEVEL,
): Question[] {
  return LEVELS.flatMap((level) => {
    const pool = bank.filter((q) => q.level === level)
    if (pool.length < perLevel) {
      throw new Error(`Nível "${level}" tem ${pool.length} perguntas; são necessárias ${perLevel}.`)
    }
    return shuffle(pool, rng).slice(0, perLevel)
  })
}
