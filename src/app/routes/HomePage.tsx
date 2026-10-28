import { useNavigate } from 'react-router-dom'
import { LevelBadge } from '../../components/LevelBadge'
import { loadHistory } from '../../features/quiz/history'
import { useQuiz } from '../../features/quiz/useQuiz'
import {
  LEVELS,
  MAX_SCORE,
  POINTS_BY_LEVEL,
  QUESTIONS_PER_LEVEL,
  TOTAL_QUESTIONS,
} from '../../types/quiz'

const IN_PROGRESS = new Set(['playing', 'feedback', 'levelTransition'])

export default function HomePage() {
  const { state, dispatch } = useQuiz()
  const navigate = useNavigate()
  const { best } = loadHistory()
  const inProgress = IN_PROGRESS.has(state.phase)

  function start() {
    dispatch({ type: 'START' })
    navigate('/quiz')
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Verdadeiro ou Falso: Claude Code
        </h1>
        <p className="mx-auto max-w-prose text-lg text-slate-700 dark:text-slate-300">
          {TOTAL_QUESTIONS} afirmações em 4 níveis, do conceito ao uso avançado. Cada resposta traz
          uma explicação e o link para a documentação oficial. Leva uns 10 minutos.
        </p>
        {best && (
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">
            Seu recorde: {best.score} pts
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {inProgress && (
          <button type="button" className="btn-primary" onClick={() => navigate('/quiz')}>
            Continuar partida
          </button>
        )}
        <button
          type="button"
          className={inProgress ? 'btn-secondary' : 'btn-primary'}
          onClick={start}
        >
          {inProgress ? 'Começar de novo' : 'Começar'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate('/ranking')}>
          Ver ranking
        </button>
      </div>

      <section aria-labelledby="niveis" className="card">
        <h2 id="niveis" className="mb-3 font-bold">
          Como funciona
        </h2>
        <ol className="space-y-2">
          {LEVELS.map((level) => (
            <li key={level} className="grid grid-cols-[auto_1fr] items-center gap-3">
              <LevelBadge level={level} prefix="" />
              <span className="text-right text-sm text-slate-700 dark:text-slate-300">
                {QUESTIONS_PER_LEVEL} perguntas · {POINTS_BY_LEVEL[level]} pt
                {POINTS_BY_LEVEL[level] > 1 ? 's' : ''} cada
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Máximo de {MAX_SCORE} pontos. Erros não descontam; o tempo total só serve para desempate.
        </p>
      </section>
    </div>
  )
}
