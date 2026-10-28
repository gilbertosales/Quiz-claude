import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { loadSavedQuiz, saveQuiz } from './persistence'
import { QuizContext } from './quizContext'
import { initialQuizState, quizReducer, type QuizState } from './quizReducer'

function init(): QuizState {
  const saved = loadSavedQuiz()
  return saved ? quizReducer(initialQuizState, { type: 'RESTORE', state: saved }) : initialQuizState
}

/** Estado da partida, persistido no sessionStorage para sobreviver a um reload (RF06). */
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, undefined, init)

  useEffect(() => saveQuiz(state), [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <QuizContext value={value}>{children}</QuizContext>
}
