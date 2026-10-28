import { describe, expect, it } from 'vitest'
import { LEVELS, QUESTIONS_PER_LEVEL } from '../types/quiz'
import raw from './questions.json'
import { questionBankSchema } from './questions.schema'

describe('questions.json', () => {
  const bank = questionBankSchema.parse(raw)

  it('segue o schema', () => {
    expect(bank.length).toBeGreaterThan(0)
  })

  it('tem IDs únicos', () => {
    const ids = bank.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(LEVELS)('tem perguntas suficientes para uma partida no nível %s', (level) => {
    expect(bank.filter((q) => q.level === level).length).toBeGreaterThanOrEqual(QUESTIONS_PER_LEVEL)
  })

  it.each(LEVELS)('tem entre 30%% e 70%% de Verdadeiro no nível %s', (level) => {
    const qs = bank.filter((q) => q.level === level)
    const ratio = qs.filter((q) => q.answer).length / qs.length
    expect(ratio).toBeGreaterThanOrEqual(0.3)
    expect(ratio).toBeLessThanOrEqual(0.7)
  })

  it('usa o prefixo do ID coerente com o nível', () => {
    const prefix = { negocio: 'neg', basico: 'bas', intermediario: 'int', avancado: 'ava' }
    for (const q of bank) expect(q.id.startsWith(prefix[q.level])).toBe(true)
  })
})
