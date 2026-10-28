import { lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { flushPending } from '../features/leaderboard/pending'
import { QuizProvider } from '../features/quiz/QuizProvider'
import { Layout } from './Layout'
import HomePage from './routes/HomePage'
import QuizPage from './routes/QuizPage'

const ResultPage = lazy(() => import('./routes/ResultPage'))
const RankingPage = lazy(() => import('./routes/RankingPage'))

export function App() {
  // Reenvia partidas que ficaram pendentes em sessões anteriores (RF17).
  useEffect(() => {
    void flushPending()
  }, [])

  return (
    <QuizProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="quiz" element={<QuizPage />} />
            <Route path="resultado" element={<ResultPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QuizProvider>
  )
}
