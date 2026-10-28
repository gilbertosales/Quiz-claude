import { LEVEL_LABELS, type Level } from '../types/quiz'
import { LEVEL_STYLES } from './levels'

export function LevelBadge({ level, prefix = 'Nível' }: { level: Level; prefix?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${LEVEL_STYLES[level].badge}`}
    >
      {prefix ? `${prefix} ` : ''}
      {LEVEL_LABELS[level]}
    </span>
  )
}
