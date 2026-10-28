import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { isObject, readJSON, removeItem, STORAGE_KEYS, writeJSON } from '../../lib/storage'
import { QuizContext } from './quizContext'
import { initialQuizState, quizReducer, type QuizState } from './quizReducer'

const isQuizState = (v: unknown): v is QuizState =>
  isObject(v) &&
  typeof v.phase === 'string' &&
  Array.isArray(v.questions) &&
  Array.isArray(v.answers) &&
  typeof v.index === 'number'

function init(): QuizState {
  const saved = readJSON('session', STORAGE_KEYS.quiz, isQuizState)
  return saved ? quizReducer(initialQuizState, { type: 'RESTORE', state: saved }) : initialQuizState
}

/** Estado da partida, persistido no sessionStorage para sobreviver a um reload (RF06). */
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, undefined, init)

  useEffect(() => {
    if (state.phase === 'idle') removeItem('session', STORAGE_KEYS.quiz)
    else writeJSON('session', STORAGE_KEYS.quiz, state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <QuizContext value={value}>{children}</QuizContext>
}
