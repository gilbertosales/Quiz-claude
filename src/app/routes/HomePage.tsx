import { useNavigate } from 'react-router-dom'
import { LEVEL_STYLES, LEVEL_DESCRIPTIONS } from '../../components/levels'
import { LogoMark } from '../../components/Logo'
import { PageHeading } from '../../components/PageHeading'
import { loadHistory } from '../../features/quiz/history'
import { IN_PROGRESS_PHASES } from '../../features/quiz/quizReducer'
import { useQuiz } from '../../features/quiz/useQuiz'
import {
  LEVEL_LABELS,
  LEVELS,
  MAX_SCORE,
  POINTS_BY_LEVEL,
  QUESTIONS_PER_LEVEL,
  TOTAL_QUESTIONS,
} from '../../types/quiz'
import { usePageTitle } from '../pageMeta'

export default function HomePage() {
  const { state, dispatch } = useQuiz()
  const navigate = useNavigate()
  const { best } = loadHistory()
  const inProgress = IN_PROGRESS_PHASES.has(state.phase)
  usePageTitle(null)

  function start() {
    dispatch({ type: 'START' })
    navigate('/quiz')
  }

  return (
    <div className="space-y-14 sm:space-y-20">
      <section className="space-y-6 pt-2 text-center sm:pt-6">
        <LogoMark className="mx-auto size-14" />
        <p className="eyebrow">Treinamento interno</p>
        <PageHeading className="text-4xl leading-[1.1] font-medium sm:text-6xl">
          Verdadeiro ou Falso: Claude Code
        </PageHeading>
        <p className="mx-auto max-w-xl text-lg text-muted">
          {TOTAL_QUESTIONS} afirmações em 4 níveis, do conceito ao uso avançado. Cada resposta traz
          uma explicação e o link para a documentação oficial. Leva uns 10 minutos.
        </p>

        <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:justify-center">
          {inProgress && (
            <button
              type="button"
              className="btn-primary px-7 py-3"
              onClick={() => navigate('/quiz')}
            >
              Continuar partida
            </button>
          )}
          <button
            type="button"
            className={inProgress ? 'btn-secondary px-7 py-3' : 'btn-primary px-7 py-3'}
            onClick={start}
          >
            {inProgress ? 'Começar de novo' : 'Começar'}
          </button>
          <button
            type="button"
            className="btn-secondary px-7 py-3"
            onClick={() => navigate('/ranking')}
          >
            Ver ranking
          </button>
        </div>

        {best && (
          <p className="text-sm text-muted">
            Seu recorde:{' '}
            <span className="font-semibold text-clay-ink">
              {best.score} de {MAX_SCORE} pts
            </span>
          </p>
        )}
      </section>

      <section aria-labelledby="niveis" className="space-y-5">
        <div className="space-y-1">
          <h2 id="niveis" className="text-2xl font-medium sm:text-3xl">
            Como funciona
          </h2>
          <p className="text-muted">
            Máximo de {MAX_SCORE} pontos. Erros não descontam; o tempo total só serve para
            desempate.
          </p>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {LEVELS.map((level, i) => (
            <li key={level} className="flex items-start gap-4 py-5">
              <span
                className={`mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${LEVEL_STYLES[level].badge}`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg font-medium">{LEVEL_LABELS[level]}</p>
                <p className="text-sm text-muted">{LEVEL_DESCRIPTIONS[level]}</p>
              </div>
              <p className="shrink-0 pt-1 text-right text-sm text-muted">
                {QUESTIONS_PER_LEVEL} perguntas
                <br />
                <span className="font-medium text-ink">
                  {POINTS_BY_LEVEL[level]} pt{POINTS_BY_LEVEL[level] > 1 ? 's' : ''} cada
                </span>
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
