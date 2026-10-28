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
          className="text-lg leading-relaxed font-medium outline-none sm:text-xl"
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
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Atalhos: <kbd className="font-mono">V</kbd> / <kbd className="font-mono">←</kbd> para
          Verdadeiro, <kbd className="font-mono">F</kbd> / <kbd className="font-mono">→</kbd> para
          Falso
        </p>
      )}

      <div aria-live="polite">
        {answered && (
          <div
            className={`card motion-safe:animate-fade-in border-l-4 ${
              correct
                ? 'border-l-green-600 dark:border-l-green-500'
                : 'border-l-red-600 dark:border-l-red-500'
            }`}
          >
            <p className="text-lg font-bold">
              <span aria-hidden="true">{correct ? '✅ ' : '❌ '}</span>
              {correct ? 'Correto!' : 'Incorreto'}
            </p>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              Resposta correta: <strong>{formatAnswer(question.answer)}</strong>
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

  let state =
    'border-slate-300 bg-white hover:border-indigo-500 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
  if (answered) {
    state = isRight
      ? 'border-green-600 bg-green-50 text-green-900 dark:border-green-500 dark:bg-green-950 dark:text-green-100'
      : chosen
        ? 'border-red-600 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950 dark:text-red-100'
        : 'border-slate-200 bg-white opacity-60 dark:border-slate-800 dark:bg-slate-900'
  }

  return (
    <button
      type="button"
      disabled={answered}
      aria-pressed={chosen}
      onClick={() => onAnswer(value)}
      className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-3 py-3 text-lg font-bold transition-colors disabled:cursor-default ${state}`}
    >
      <span>{formatAnswer(value)}</span>
      {answered && (isRight || chosen) && (
        <span className="text-xs font-medium">
          {isRight ? 'Resposta correta' : 'Sua resposta'}
          {isRight && chosen ? ' · sua resposta' : ''}
        </span>
      )}
    </button>
  )
}
