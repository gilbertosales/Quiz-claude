import type { Level } from '../types/quiz'
import { LEVEL_STYLES } from './levels'

export function ProgressBar({ value, max, level }: { value: number; max: number; level: Level }) {
  return (
    // <progress> nativo não aceita a cor por nível de forma consistente entre navegadores.
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="progressbar"
      aria-label="Progresso da partida"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none ${LEVEL_STYLES[level].bar}`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  )
}
