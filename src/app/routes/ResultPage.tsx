import { useCallback, useEffect, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DocLink } from '../../components/DocLink'
import { LevelBadge } from '../../components/LevelBadge'
import { LEVEL_STYLES } from '../../components/levels'
import { RichText } from '../../components/RichText'
import { submitGame } from '../../features/leaderboard/pending'
import { useLeaderboard } from '../../features/leaderboard/useLeaderboard'
import { recordGame } from '../../features/quiz/history'
import { durationMs } from '../../features/quiz/quizReducer'
import { scoreAnswers } from '../../features/quiz/scoring'
import { toPendingSubmission } from '../../features/quiz/submission'
import { useQuiz } from '../../features/quiz/useQuiz'
import { formatAnswer, formatDuration } from '../../lib/format'
import {
  LEVEL_LABELS,
  LEVELS,
  MAX_SCORE,
  POINTS_BY_LEVEL,
  QUESTIONS_PER_LEVEL,
  TOTAL_QUESTIONS,
} from '../../types/quiz'

const RESULT_PHASES = new Set(['finished', 'submitting', 'done', 'submitError'])

export default function ResultPage() {
  const { state, dispatch } = useQuiz()
  const navigate = useNavigate()
  const { phase, questions, answers, identity } = state
  const summary = useMemo(() => scoreAnswers(questions, answers), [questions, answers])
  const duration = durationMs(state)

  const submit = useCallback(() => {
    const item = toPendingSubmission(state)
    if (!item) return
    dispatch({ type: 'FINISH' })
    submitGame(item).then(
      () => dispatch({ type: 'SUBMIT_OK' }),
      (err: unknown) =>
        dispatch({
          type: 'SUBMIT_FAIL',
          error: err instanceof Error ? err.message : 'Falha ao enviar o resultado.',
        }),
    )
  }, [state, dispatch])

  // Ao chegar aqui com a partida finalizada: grava o histórico local e envia ao ranking.
  useEffect(() => {
    if (phase !== 'finished') return
    const item = toPendingSubmission(state)
    if (item) {
      recordGame({
        gameId: item.gameId,
        score: item.payload.score,
        correctCount: item.payload.correctCount,
        durationMs: item.payload.durationMs,
        playedAt: item.queuedAt,
      })
    }
    submit()
  }, [phase, state, submit])

  const leaderboard = useLeaderboard(identity?.email ?? null, phase === 'done')
  const myPosition = leaderboard.rows.find((r) => r.isMe)?.position

  if (!RESULT_PHASES.has(phase)) return <Navigate to="/" replace />

  function playAgain() {
    dispatch({ type: 'START' })
    navigate('/quiz')
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 text-center">
        <h1 className="text-2xl font-bold">Resultado</h1>
        <p className="text-5xl font-extrabold tabular-nums">
          {summary.score}
          <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">
            {' '}
            / {MAX_SCORE} pts
          </span>
        </p>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-slate-600 dark:text-slate-400">Acertos</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {summary.correctCount}/{TOTAL_QUESTIONS}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600 dark:text-slate-400">Tempo</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {duration !== null ? formatDuration(duration) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-600 dark:text-slate-400">Posição</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {myPosition ? `${myPosition}º` : '—'}
            </dd>
          </div>
        </dl>
        <SubmitStatus
          phase={phase}
          error={state.submitError}
          loadingPosition={phase === 'done' && leaderboard.status === 'loading'}
          onRetry={submit}
        />
      </section>

      <section aria-labelledby="por-nivel">
        <h2 id="por-nivel" className="mb-3 text-lg font-bold">
          Acertos por nível
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEVELS.map((level) => {
            const correct = summary.correctByLevel[level]
            return (
              <li key={level} className="card space-y-2 p-4 sm:p-4">
                <p className="font-semibold">{LEVEL_LABELS[level]}</p>
                <p className="text-2xl font-bold tabular-nums">
                  {correct}/{QUESTIONS_PER_LEVEL}
                </p>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full ${LEVEL_STYLES[level].bar}`}
                    style={{ width: `${(correct / QUESTIONS_PER_LEVEL) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {correct * POINTS_BY_LEVEL[level]} pts
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button type="button" className="btn-primary" onClick={playAgain}>
          Jogar novamente
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate('/ranking')}>
          Ver ranking
        </button>
      </div>

      <section aria-labelledby="revisao">
        <h2 id="revisao" className="mb-3 text-lg font-bold">
          Revisão das respostas
        </h2>
        <ol className="space-y-3">
          {questions.map((q, i) => {
            const given = answers[i]
            const correct = given === q.answer
            return (
              <li key={q.id}>
                <details className="card group p-4 sm:p-5">
                  <summary className="flex cursor-pointer list-none items-start gap-3">
                    <span aria-hidden="true">{correct ? '✅' : '❌'}</span>
                    <span className="flex-1">
                      <span className="sr-only">{correct ? 'Acertou: ' : 'Errou: '}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{i + 1}. </span>
                      <RichText text={q.statement} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-slate-500 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    >
                      ›
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
                    <LevelBadge level={q.level} />
                    <p>
                      Sua resposta: <strong>{given === null ? '—' : formatAnswer(given)}</strong> ·
                      Correta: <strong>{formatAnswer(q.answer)}</strong>
                    </p>
                    <p>
                      <RichText text={q.explanation} />
                    </p>
                    <p>
                      <DocLink href={q.docUrl} />
                    </p>
                  </div>
                </details>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function SubmitStatus({
  phase,
  error,
  loadingPosition,
  onRetry,
}: {
  phase: string
  error: string | null
  loadingPosition: boolean
  onRetry: () => void
}) {
  return (
    <div aria-live="polite" className="text-sm">
      {(phase === 'finished' || phase === 'submitting') && (
        <p>Enviando resultado para o ranking…</p>
      )}
      {phase === 'done' && (
        <p className="text-green-800 dark:text-green-300">
          <span aria-hidden="true">✓ </span>Resultado salvo no ranking
          {loadingPosition ? '. Calculando sua posição…' : '.'}
        </p>
      )}
      {phase === 'submitError' && (
        <div className="space-y-2">
          <p className="text-red-700 dark:text-red-400">
            <span aria-hidden="true">⚠ </span>
            {error} Seu resultado ficou guardado neste navegador e será reenviado.
          </p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
