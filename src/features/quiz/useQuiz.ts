import { useContext } from 'react'
import { QuizContext, type QuizContextValue } from './quizContext'

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz precisa estar dentro de <QuizProvider>')
  return ctx
}
