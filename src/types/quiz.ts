export const LEVELS = ['negocio', 'basico', 'intermediario', 'avancado'] as const

export type Level = (typeof LEVELS)[number]

export const QUESTIONS_PER_LEVEL = 5
export const TOTAL_QUESTIONS = LEVELS.length * QUESTIONS_PER_LEVEL

export const POINTS_BY_LEVEL: Record<Level, number> = {
  negocio: 1,
  basico: 2,
  intermediario: 3,
  avancado: 4,
}

export const MAX_SCORE = LEVELS.reduce(
  (sum, l) => sum + POINTS_BY_LEVEL[l] * QUESTIONS_PER_LEVEL,
  0,
)

export const LEVEL_LABELS: Record<Level, string> = {
  negocio: 'Negócio',
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export interface Question {
  id: string
  level: Level
  statement: string
  answer: boolean
  explanation: string
  docUrl: string
  tags?: string[]
}

export type CorrectByLevel = Record<Level, number>

export interface Identity {
  name: string
  /** Normalizado: trim + lowercase (RF11). */
  email: string
}
