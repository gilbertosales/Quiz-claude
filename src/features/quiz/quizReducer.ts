import type { Identity, Question } from '../../types/quiz'

export type QuizPhase =
  | 'idle'
  | 'identifying'
  | 'playing'
  | 'feedback'
  | 'levelTransition'
  | 'finished'
  | 'submitting'
  | 'done'
  | 'submitError'

export const QUIZ_PHASES: ReadonlySet<QuizPhase> = new Set<QuizPhase>([
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

/** Partida em andamento: o cronômetro corre. */
export const IN_PROGRESS_PHASES: ReadonlySet<QuizPhase> = new Set<QuizPhase>([
  'playing',
  'feedback',
  'levelTransition',
])

/** Partida finalizada: a tela é a de resultado. */
export const RESULT_PHASES: ReadonlySet<QuizPhase> = new Set<QuizPhase>([
  'finished',
  'submitting',
  'done',
  'submitError',
])

export interface QuizState {
  phase: QuizPhase
  identity: Identity | null
  questions: Question[]
  answers: (boolean | null)[]
  /** Índice da pergunta atual (em levelTransition, já aponta para a 1ª do próximo nível). */
  index: number
  startedAt: number | null
  finishedAt: number | null
  /** Tempo ativo acumulado até `runningSince` (ou até o fim, se pausado/finalizado). */
  elapsedMs: number
  /** Início do trecho em andamento; null quando pausado (ex.: página fechada) ou finalizado. */
  runningSince: number | null
  /** ID local da partida, usado na fila de reenvio. */
  gameId: string | null
  submitError: string | null
}

export type QuizAction =
  | { type: 'START' }
  | { type: 'SET_IDENTITY'; identity: Identity; questions: Question[]; gameId: string; now: number }
  | { type: 'ANSWER'; answer: boolean; now: number }
  | { type: 'NEXT' }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'FINISH' }
  | { type: 'SUBMIT_OK' }
  | { type: 'SUBMIT_FAIL'; error: string }
  | { type: 'RESTORE'; state: QuizState }
  | { type: 'RESET' }

export const initialQuizState: QuizState = {
  phase: 'idle',
  identity: null,
  questions: [],
  answers: [],
  index: 0,
  startedAt: null,
  finishedAt: null,
  elapsedMs: 0,
  runningSince: null,
  gameId: null,
  submitError: null,
}

/** Soma o trecho em andamento ao tempo acumulado. */
function elapsedAt(state: QuizState, now: number): number {
  return state.elapsedMs + (state.runningSince === null ? 0 : Math.max(0, now - state.runningSince))
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START':
      return { ...initialQuizState, phase: 'identifying' }

    case 'SET_IDENTITY':
      if (state.phase !== 'identifying' || action.questions.length === 0) return state
      return {
        ...initialQuizState,
        phase: 'playing',
        identity: action.identity,
        questions: action.questions,
        answers: action.questions.map(() => null),
        startedAt: action.now,
        runningSince: action.now,
        gameId: action.gameId,
      }

    case 'ANSWER': {
      // RF02: só é possível responder uma vez, e só a pergunta atual.
      if (state.phase !== 'playing' || state.answers[state.index] !== null) return state
      const answers = state.answers.slice()
      answers[state.index] = action.answer
      const isLast = state.index === state.questions.length - 1
      // Cada resposta fecha um trecho do cronômetro: se a página cair sem aviso,
      // o tempo salvo perde no máximo o intervalo desde a última resposta.
      return {
        ...state,
        phase: 'feedback',
        answers,
        elapsedMs: elapsedAt(state, action.now),
        runningSince: isLast ? null : action.now,
        finishedAt: isLast ? action.now : state.finishedAt,
      }
    }

    case 'NEXT': {
      if (state.phase === 'levelTransition') return { ...state, phase: 'playing' }
      if (state.phase !== 'feedback') return state
      const next = state.index + 1
      if (next >= state.questions.length) return { ...state, phase: 'finished' }
      const changesLevel = state.questions[next].level !== state.questions[state.index].level
      return { ...state, index: next, phase: changesLevel ? 'levelTransition' : 'playing' }
    }

    case 'PAUSE':
      if (state.runningSince === null) return state
      return { ...state, elapsedMs: elapsedAt(state, action.now), runningSince: null }

    case 'RESUME':
      if (!IN_PROGRESS_PHASES.has(state.phase) || state.runningSince !== null) return state
      return { ...state, runningSince: action.now }

    case 'FINISH':
      if (state.phase !== 'finished' && state.phase !== 'submitError') return state
      return { ...state, phase: 'submitting', submitError: null }

    case 'SUBMIT_OK':
      if (state.phase !== 'submitting') return state
      return { ...state, phase: 'done', submitError: null }

    case 'SUBMIT_FAIL':
      if (state.phase !== 'submitting') return state
      return { ...state, phase: 'submitError', submitError: action.error }

    case 'RESTORE': {
      // O tempo fora da página não conta (RF06: retomar sem penalidade): a partida volta
      // pausada e o cronômetro reinicia no RESUME. Um envio interrompido volta como erro;
      // a fila de reenvio cuida do resto.
      const restored = { ...action.state, runningSince: null }
      return restored.phase === 'submitting'
        ? { ...restored, phase: 'submitError', submitError: 'O envio foi interrompido.' }
        : restored
    }

    case 'RESET':
      return initialQuizState
  }
}

/** Tempo ativo da partida finalizada (sem pausas nem recargas); null se ainda não terminou. */
export function durationMs(state: QuizState): number | null {
  return state.finishedAt !== null ? state.elapsedMs : null
}
