import { useEffect, useRef } from 'react'
import { formatAnswer } from '../lib/format'
import type { Question } from '../types/quiz'
import { DocLink } from './DocLink'
import { RichText } from './RichText'

interface Props {
  question: Question
  /** Resposta dada; null enquanto não respondida. */
  given: boolean | null
  isLast: boolean
  onAnswer: (answer: boolean) => void
  onNext: () => void
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  el.closest('input, textarea, select, [contenteditable="true"]') !== null

export function QuestionCard({ question, given, isLast, onAnswer, onNext }: Props) {
  const answered = given !== null
  const correct = given === question.answer
  const nextRef = useRef<HTMLButtonElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)

  // Nova pergunta: foco no enunciado, para leitores de tela lerem a afirmação.
  useEffect(() => {
    statementRef.current?.focus()
  }, [])

  // Ao responder, os botões V/F ficam desabilitados; o foco vai para "Próxima".
  useEffect(() => {
    if (answered) nextRef.current?.focus()
  }, [answered])

  // Atalhos: V/F ou ←/→ para responder, Enter para avançar.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return
      const key = e.key.toLowerCase()
      if (!answered) {
        if (key === 'v' || key === 'arrowleft') onAnswer(true)
        else if (key === 'f' || key === 'arrowright') onAnswer(false)
        else return
        e.preventDefault()
      } else if (
        key === 'enter' &&
        !(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)
      ) {
        // Em botões e links o Enter já tem ação nativa.
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [answered, onAnswer, onNext])

  return (
    <div className="space-y-5">
      <div className="card">
        <p
          id="statement"
          ref={statementRef}
          tabIndex={-1}
          className="font-serif text-xl leading-relaxed outline-none sm:text-2xl"
        >
          <RichText text={question.statement} />
        </p>
      </div>

      <fieldset aria-describedby="statement" className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Esta afirmação é verdadeira ou falsa?</legend>
        <AnswerButton value={true} {...{ question, given, onAnswer }} />
        <AnswerButton value={false} {...{ question, given, onAnswer }} />
      </fieldset>
      {!answered && (
        <p className="text-center text-sm text-muted">
          Atalhos: <Kbd>V</Kbd> / <Kbd>←</Kbd> para Verdadeiro, <Kbd>F</Kbd> / <Kbd>→</Kbd> para
          Falso
        </p>
      )}

      <div aria-live="polite">
        {answered && (
          <div
            className={`motion-safe:animate-fade-in rounded-2xl p-5 sm:p-7 ${
              correct ? 'bg-ok-bg' : 'bg-bad-bg'
            }`}
          >
            <p
              className={`flex items-center gap-2.5 font-serif text-xl font-medium ${
                correct ? 'text-ok' : 'text-bad'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex size-7 items-center justify-center rounded-full text-base text-on-ink ${
                  correct ? 'bg-ok' : 'bg-bad'
                }`}
              >
                {correct ? '✓' : '✗'}
              </span>
              {correct ? 'Correto!' : 'Incorreto'}
            </p>
            <p className="mt-2 text-muted">
              Resposta correta:{' '}
              <strong className="text-ink">{formatAnswer(question.answer)}</strong>
            </p>
            <p className="mt-3 leading-relaxed">
              <RichText text={question.explanation} />
            </p>
            <p className="mt-3">
              <DocLink href={question.docUrl} />
            </p>
          </div>
        )}
      </div>

      {answered && (
        <div className="flex justify-end">
          <button
            ref={nextRef}
            type="button"
            className="btn-primary w-full sm:w-auto"
            onClick={onNext}
          >
            {isLast ? 'Ver resultado' : 'Próxima'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  )
}

function AnswerButton({
  value,
  question,
  given,
  onAnswer,
}: {
  value: boolean
  question: Question
  given: boolean | null
  onAnswer: (answer: boolean) => void
}) {
  const answered = given !== null
  const chosen = given === value
  const isRight = question.answer === value

  let state = 'border-line bg-surface hover:border-ink hover:bg-subtle'
  if (answered) {
    state = isRight
      ? 'border-ok bg-ok-bg text-ok'
      : chosen
        ? 'border-bad bg-bad-bg text-bad'
        : 'border-line bg-surface opacity-50'
  }

  return (
    <button
      type="button"
      disabled={answered}
      aria-pressed={chosen}
      onClick={() => onAnswer(value)}
      className={`flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 px-3 py-3 font-serif text-xl font-medium transition-colors disabled:cursor-default ${state}`}
    >
      <span>{formatAnswer(value)}</span>
      {answered && (isRight || chosen) && (
        <span className="font-sans text-xs font-medium">
          {isRight ? 'Resposta correta' : 'Sua resposta'}
          {isRight && chosen ? ' · sua resposta' : ''}
        </span>
      )}
    </button>
  )
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
      {children}
    </kbd>
  )
}
