import type { Question } from '../types/quiz'
import raw from './questions.json'

// A validação do schema roda em teste (questions.test.ts), não em runtime, para não pesar no bundle.
export const QUESTIONS = raw as Question[]

export const QUESTIONS_BY_ID: ReadonlyMap<string, Question> = new Map(
  QUESTIONS.map((q) => [q.id, q]),
)
