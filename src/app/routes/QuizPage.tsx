import { useCallback, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { LevelBadge } from '../../components/LevelBadge'
import { LevelTransition } from '../../components/LevelTransition'
import { ProgressBar } from '../../components/ProgressBar'
import { QuestionCard } from '../../components/QuestionCard'
import { QUESTIONS } from '../../data/questions'
import { IdentityForm } from '../../features/identity/IdentityForm'
import { saveIdentity } from '../../features/identity/storedIdentity'
import { drawQuestions } from '../../features/quiz/draw'
import { scoreAnswers } from '../../features/quiz/scoring'
import { RESULT_PHASES } from '../../features/quiz/quizReducer'
import { useQuiz } from '../../features/quiz/useQuiz'
import { newId } from '../../lib/id'
import type { Identity } from '../../types/quiz'

export default function QuizPage() {
  const { state, dispatch } = useQuiz()
  const { phase, questions, answers, index } = state

  useEffect(() => {
    if (phase === 'idle') dispatch({ type: 'START' })
  }, [phase, dispatch])

  const onAnswer = useCallback(
    (answer: boolean) => dispatch({ type: 'ANSWER', answer, now: Date.now() }),
    [dispatch],
  )
  const onNext = useCallback(() => dispatch({ type: 'NEXT' }), [dispatch])

  function onIdentity(identity: Identity) {
    saveIdentity(identity)
    dispatch({
      type: 'SET_IDENTITY',
      identity,
      questions: drawQuestions(QUESTIONS),
      gameId: newId(),
      now: Date.now(),
    })
  }

  if (RESULT_PHASES.has(phase)) return <Navigate to="/resultado" replace />
  if (phase === 'idle' || phase === 'identifying') return <IdentityForm onSubmit={onIdentity} />

  const question = questions[index]
  const { score, correctByLevel } = scoreAnswers(questions, answers)

  if (phase === 'levelTransition') {
    const completed = questions[index - 1].level
    return (
      <LevelTransition
        completed={completed}
        correct={correctByLevel[completed]}
        next={question.level}
        onContinue={onNext}
      />
    )
  }

  const answeredCount = answers.filter((a) => a !== null).length

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LevelBadge level={question.level} />
          <span
            className="text-sm font-semibold tabular-nums"
            aria-label={`Pontuação parcial: ${score} pontos`}
          >
            {score} pts
          </span>
        </div>
        <h1 className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Pergunta {index + 1} de {questions.length}
        </h1>
        <ProgressBar value={answeredCount} max={questions.length} level={question.level} />
      </div>
      <QuestionCard
        key={question.id}
        question={question}
        given={answers[index]}
        isLast={index === questions.length - 1}
        onAnswer={onAnswer}
        onNext={onNext}
      />
    </div>
  )
}
