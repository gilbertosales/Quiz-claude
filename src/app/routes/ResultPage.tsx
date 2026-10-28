import { useCallback, useEffect, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DocLink } from '../../components/DocLink'
import { LevelBadge } from '../../components/LevelBadge'
import { PageHeading } from '../../components/PageHeading'
import { LEVEL_STYLES } from '../../components/levels'
import { RichText } from '../../components/RichText'
import { ApiError } from '../../features/leaderboard/api'
import { submitGame } from '../../features/leaderboard/pending'
import { useLeaderboard } from '../../features/leaderboard/useLeaderboard'
import { recordGame } from '../../features/quiz/history'
import { durationMs, RESULT_PHASES } from '../../features/quiz/quizReducer'
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
import { usePageTitle } from '../pageMeta'

export default function ResultPage() {
  const { state, dispatch } = useQuiz()
  const navigate = useNavigate()
  const { phase, questions, answers } = state
  const summary = useMemo(() => scoreAnswers(questions, answers), [questions, answers])
  const duration = durationMs(state)
  usePageTitle('Resultado')

  const submit = useCallback(() => {
    const item = toPendingSubmission(state)
    if (!item) return
    dispatch({ type: 'FINISH' })
    submitGame(item).then(
      () => dispatch({ type: 'SUBMIT_OK' }),
      (err: unknown) => dispatch({ type: 'SUBMIT_FAIL', error: describeSubmitError(err) }),
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

  const leaderboard = useLeaderboard(phase === 'done')
  const myPosition = leaderboard.rows.find((r) => r.isMe)?.position

  if (!RESULT_PHASES.has(phase)) return <Navigate to="/" replace />

  function playAgain() {
    dispatch({ type: 'START' })
    navigate('/quiz')
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 text-center">
        <PageHeading className="text-3xl font-medium">Resultado</PageHeading>
        <p className="font-serif text-6xl font-medium tabular-nums">
          {summary.score}
          <span className="text-2xl text-muted"> / {MAX_SCORE} pts</span>
        </p>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-muted">Acertos</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {summary.correctCount}/{TOTAL_QUESTIONS}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tempo</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {duration !== null ? formatDuration(duration) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Posição</dt>
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
        <h2 id="por-nivel" className="mb-4 text-2xl font-medium">
          Acertos por nível
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LEVELS.map((level) => {
            const correct = summary.correctByLevel[level]
            return (
              <li key={level} className="card space-y-2 p-4 sm:p-4">
                <p className="font-semibold">{LEVEL_LABELS[level]}</p>
                <p className="font-serif text-3xl font-medium tabular-nums">
                  {correct}/{QUESTIONS_PER_LEVEL}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                  <div
                    className={`h-full ${LEVEL_STYLES[level].bar}`}
                    style={{ width: `${(correct / QUESTIONS_PER_LEVEL) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted">{correct * POINTS_BY_LEVEL[level]} pts</p>
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
        <h2 id="revisao" className="mb-4 text-2xl font-medium">
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
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm text-on-ink ${
                        correct ? 'bg-ok' : 'bg-bad'
                      }`}
                    >
                      {correct ? '✓' : '✗'}
                    </span>
                    <span className="flex-1">
                      <span className="sr-only">{correct ? 'Acertou: ' : 'Errou: '}</span>
                      <span className="text-sm text-muted">{i + 1}. </span>
                      <RichText text={q.statement} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-muted transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    >
                      ›
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
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

/** Só promete reenvio quando a partida de fato continua na fila. */
function describeSubmitError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Falha ao enviar o resultado.'
  if (err.kind === 'unavailable') return `${err.message} O resultado não entrou no ranking.`
  if (err.permanent) return err.message
  return `${err.message} Seu resultado ficou guardado neste navegador e será reenviado.`
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
        <p className="text-ok">
          <span aria-hidden="true">✓ </span>Resultado salvo no ranking
          {loadingPosition ? '. Calculando sua posição…' : '.'}
        </p>
      )}
      {phase === 'submitError' && (
        <div className="space-y-2">
          <p className="text-bad">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
