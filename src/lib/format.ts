/** 125_000 → "2min 05s"; 42_000 → "42s". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}min ${String(seconds).padStart(2, '0')}s`
}

export function formatAnswer(answer: boolean): string {
  return answer ? 'Verdadeiro' : 'Falso'
}
