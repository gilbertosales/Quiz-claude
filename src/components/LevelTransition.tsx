import { useEffect, useRef } from 'react'
import { LEVEL_LABELS, POINTS_BY_LEVEL, QUESTIONS_PER_LEVEL, type Level } from '../types/quiz'
import { LevelBadge } from './LevelBadge'
import { LEVEL_DESCRIPTIONS } from './levels'

interface Props {
  completed: Level
  correct: number
  next: Level
  onContinue: () => void
}

export function LevelTransition({ completed, correct, next, onContinue }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Foco no botão: Enter continua, e o leitor de tela lê o resumo via aria-describedby.
  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <div className="card motion-safe:animate-fade-in space-y-5 text-center">
      <h1 id="level-done" className="text-3xl font-medium">
        Nível {LEVEL_LABELS[completed]} concluído: {correct}/{QUESTIONS_PER_LEVEL}
      </h1>
      <div className="space-y-2">
        <p className="text-muted">A seguir:</p>
        <LevelBadge level={next} />
        <p>{LEVEL_DESCRIPTIONS[next]}</p>
        <p className="text-sm text-muted">Cada acerto vale {POINTS_BY_LEVEL[next]} pontos.</p>
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="btn-primary w-full sm:w-auto"
        onClick={onContinue}
        aria-describedby="level-done"
      >
        Começar nível {LEVEL_LABELS[next]}
      </button>
    </div>
  )
}
