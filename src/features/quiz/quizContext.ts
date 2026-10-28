import { createContext, type Dispatch } from 'react'
import type { QuizAction, QuizState } from './quizReducer'

export interface QuizContextValue {
  state: QuizState
  dispatch: Dispatch<QuizAction>
}

export const QuizContext = createContext<QuizContextValue | null>(null)
