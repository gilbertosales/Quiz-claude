import { isObject, readJSON, removeItem, STORAGE_KEYS, writeJSON } from '../../lib/storage'
import { LEVELS } from '../../types/quiz'
import type { QuizPhase, QuizState } from './quizReducer'

// O sessionStorage pode conter um estado de outra versão do app ou adulterado. Restaurar algo
// incoerente (ex.: index fora do array) quebraria a tela, então só aceitamos estados consistentes.

const PHASES: ReadonlySet<string> = new Set<QuizPhase>([
  'idle',
  'identifying',
  'playing',
  'feedback',
  'levelTransition',
  'finished',
  'submitting',
  'done',
  'submitError',
])
const RESULT_PHASES: ReadonlySet<string> = new Set<QuizPhase>([
  'finished',
  'submitting',
  'done',
  'submitError',
])

const isNumberOrNull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v))

const isQuestion = (q: unknown) =>
  isObject(q) &&
  typeof q.id === 'string' &&
  (LEVELS as readonly unknown[]).includes(q.level) &&
  typeof q.statement === 'string' &&
  typeof q.answer === 'boolean' &&
  typeof q.explanation === 'string' &&
  typeof q.docUrl === 'string'

export function isRestorableQuizState(v: unknown): v is QuizState {
  if (!isObject(v) || typeof v.phase !== 'string' || !PHASES.has(v.phase)) return false
  const { phase, questions, answers, index } = v
  if (!Array.isArray(questions) || !Array.isArray(answers)) return false
  if (!isNumberOrNull(v.startedAt) || !isNumberOrNull(v.finishedAt)) return false
  if (phase === 'idle' || phase === 'identifying') return true

  // Partida em andamento ou finalizada: tudo precisa ser coerente.
  if (questions.length === 0 || !questions.every(isQuestion)) return false
  if (answers.length !== questions.length) return false
  if (!answers.every((a) => a === null || typeof a === 'boolean')) return false
  if (typeof index !== 'number' || !Number.isInteger(index)) return false
  if (index < 0 || index >= questions.length) return false
  if (typeof v.gameId !== 'string' || typeof v.startedAt !== 'number') return false
  const identity = v.identity
  if (
    !isObject(identity) ||
    typeof identity.name !== 'string' ||
    typeof identity.email !== 'string'
  )
    return false

  if (phase === 'playing') return answers[index] === null
  if (phase === 'feedback') return answers[index] !== null
  if (phase === 'levelTransition') return index > 0 && answers[index] === null
  if (RESULT_PHASES.has(phase)) {
    return answers.every((a) => a !== null) && typeof v.finishedAt === 'number'
  }
  return false
}

export function loadSavedQuiz(): QuizState | null {
  const saved = readJSON('session', STORAGE_KEYS.quiz, isRestorableQuizState)
  if (!saved) removeItem('session', STORAGE_KEYS.quiz) // ausente, ilegível ou inválido
  return saved
}

export function saveQuiz(state: QuizState): void {
  if (state.phase === 'idle') removeItem('session', STORAGE_KEYS.quiz)
  else writeJSON('session', STORAGE_KEYS.quiz, state)
}
