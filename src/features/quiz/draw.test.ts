import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { LEVELS, QUESTIONS_PER_LEVEL, TOTAL_QUESTIONS } from '../../types/quiz'
import { drawQuestions, shuffle } from './draw'

/** RNG determinístico (mulberry32) para testes reprodutíveis. */
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('shuffle', () => {
  it('preserva os elementos e não altera a entrada', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffle(input, seeded(1))
    expect(out).not.toBe(input)
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gera permutações aproximadamente uniformes', () => {
    const rng = seeded(42)
    const firstCounts = [0, 0, 0]
    for (let i = 0; i < 3000; i++) firstCounts[shuffle([0, 1, 2], rng)[0]]++
    for (const c of firstCounts) expect(c).toBeGreaterThan(850)
  })
})

describe('drawQuestions', () => {
  it('sorteia 5 perguntas por nível, na ordem dos níveis, sem repetir', () => {
    const drawn = drawQuestions(QUESTIONS, seeded(7))
    expect(drawn).toHaveLength(TOTAL_QUESTIONS)
    expect(new Set(drawn.map((q) => q.id)).size).toBe(TOTAL_QUESTIONS)
    LEVELS.forEach((level, li) => {
      const slice = drawn.slice(li * QUESTIONS_PER_LEVEL, (li + 1) * QUESTIONS_PER_LEVEL)
      expect(slice.every((q) => q.level === level)).toBe(true)
    })
  })

  it('produz partidas diferentes com sementes diferentes', () => {
    const a = drawQuestions(QUESTIONS, seeded(1)).map((q) => q.id)
    const b = drawQuestions(QUESTIONS, seeded(2)).map((q) => q.id)
    expect(a).not.toEqual(b)
  })

  it('falha se um nível não tiver perguntas suficientes', () => {
    const bank = QUESTIONS.filter((q) => q.level !== 'avancado')
    expect(() => drawQuestions(bank)).toThrow(/avancado/)
  })
})
