import { Link } from 'react-router-dom'
import { loadIdentity } from '../../features/identity/storedIdentity'
import { LeaderboardSkeleton, LeaderboardTable } from '../../features/leaderboard/LeaderboardTable'
import { useLeaderboard } from '../../features/leaderboard/useLeaderboard'
import { useQuiz } from '../../features/quiz/useQuiz'

export default function RankingPage() {
  const { state } = useQuiz()
  const email = state.identity?.email ?? loadIdentity()?.email ?? null
  const { status, rows, error, reload } = useLeaderboard(email)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ranking</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Melhor partida de cada pessoa · pontuação, depois menor tempo.
          </p>
        </div>
        <Link to="/" className="link text-sm">
          Voltar ao início
        </Link>
      </div>

      {(status === 'idle' || status === 'loading') && <LeaderboardSkeleton />}
      {status === 'error' && (
        <div role="alert" className="card space-y-3 text-center">
          <p>
            <span aria-hidden="true">⚠ </span>Não foi possível carregar o ranking. {error}
          </p>
          <button type="button" className="btn-secondary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      )}
      {status === 'ready' && <LeaderboardTable rows={rows} />}
    </div>
  )
}
