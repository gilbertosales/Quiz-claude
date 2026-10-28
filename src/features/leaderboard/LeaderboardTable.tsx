import { formatDuration } from '../../lib/format'
import { MAX_SCORE, TOTAL_QUESTIONS } from '../../types/quiz'
import type { LeaderboardRow } from './api'

export function LeaderboardTable({ rows, limit = 50 }: { rows: LeaderboardRow[]; limit?: number }) {
  const top = rows.filter((r) => r.position <= limit)
  // Fora do top: a própria linha aparece fixada no fim (RF16).
  const pinned = rows.find((r) => r.isMe && r.position > limit)

  if (top.length === 0 && !pinned) {
    return (
      <p className="card text-center">Ninguém jogou ainda. Seja a primeira pessoa no ranking!</p>
    )
  }

  return (
    <div className="card overflow-hidden p-0 sm:p-0">
      <table className="w-full text-left text-sm sm:text-base">
        <caption className="sr-only">Ranking: top {limit} por pontuação e tempo</caption>
        <thead className="bg-slate-100 text-xs tracking-wide text-slate-700 uppercase dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th scope="col" className="px-3 py-3 sm:px-4">
              #
            </th>
            <th scope="col" className="px-3 py-3 sm:px-4">
              Nome
            </th>
            <th scope="col" className="px-3 py-3 text-right sm:px-4">
              Pontos
            </th>
            <th scope="col" className="hidden px-3 py-3 text-right sm:table-cell sm:px-4">
              Acertos
            </th>
            <th scope="col" className="px-3 py-3 text-right sm:px-4">
              Tempo
            </th>
          </tr>
        </thead>
        <tbody>
          {top.map((row) => (
            <Row key={row.position} row={row} />
          ))}
          {pinned && (
            <>
              <tr aria-hidden="true">
                <td colSpan={5} className="py-1 text-center text-slate-500">
                  ⋯
                </td>
              </tr>
              <Row row={pinned} />
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Row({ row }: { row: LeaderboardRow }) {
  return (
    <tr
      aria-current={row.isMe ? 'true' : undefined}
      className={`border-t border-slate-200 dark:border-slate-800 ${
        row.isMe ? 'bg-indigo-50 font-semibold dark:bg-indigo-950' : ''
      }`}
    >
      <td className="px-3 py-3 tabular-nums sm:px-4">{row.position}º</td>
      <td className="max-w-[9rem] truncate px-3 py-3 sm:max-w-none sm:px-4">
        {row.name}
        {row.isMe && (
          <span className="ml-1 text-xs text-indigo-700 dark:text-indigo-300">(você)</span>
        )}
      </td>
      <td className="px-3 py-3 text-right tabular-nums sm:px-4">
        {row.score}
        <span className="sr-only"> de {MAX_SCORE}</span>
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell sm:px-4">
        {row.correctCount}/{TOTAL_QUESTIONS}
      </td>
      <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums sm:px-4">
        {formatDuration(row.durationMs)}
      </td>
    </tr>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="card space-y-3" aria-busy="true" aria-label="Carregando ranking">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-6 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-slate-800"
        />
      ))}
    </div>
  )
}
