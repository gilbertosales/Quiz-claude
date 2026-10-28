import { useId, useRef, useState, type FormEvent } from 'react'
import { PageHeading } from '../../components/PageHeading'
import type { Identity } from '../../types/quiz'
import { loadIdentity } from './storedIdentity'
import { makeIdentitySchema } from './validation'

type Field = 'name' | 'email' | 'consent'
type Errors = Partial<Record<Field, string>>

const schema = makeIdentitySchema()

export function IdentityForm({ onSubmit }: { onSubmit: (identity: Identity) => void }) {
  const stored = loadIdentity()
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useRef<HTMLFormElement>(null)
  const id = useId()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const result = schema.safeParse({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      consent: data.get('consent') === 'on',
    })
    if (!result.success) {
      const next: Errors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as Field
        next[field] ??= issue.message
      }
      setErrors(next)
      const first = (['name', 'email', 'consent'] as const).find((f) => next[f])
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setErrors({})
    onSubmit({ name: result.data.name, email: result.data.email })
  }

  const describedBy = (field: Field) => (errors[field] ? `${id}-${field}-error` : undefined)
  const errorText = (field: Field) =>
    errors[field] && (
      <p
        id={`${id}-${field}-error`}
        className="mt-1 text-sm font-medium text-red-700 dark:text-red-400"
      >
        <span aria-hidden="true">⚠ </span>
        {errors[field]}
      </p>
    )
  const inputClass =
    'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base aria-invalid:border-red-600 dark:border-slate-700 dark:bg-slate-950 dark:aria-invalid:border-red-400'

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <PageHeading className="text-2xl font-bold">Antes de começar</PageHeading>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Seu nome aparece no ranking; o e-mail só identifica você e nunca é exibido.
        </p>
      </div>

      <div>
        <label htmlFor={`${id}-name`} className="font-semibold">
          Nome
        </label>
        <input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          defaultValue={stored?.name}
          maxLength={80}
          required
          aria-invalid={!!errors.name}
          aria-describedby={describedBy('name')}
          className={inputClass}
        />
        {errorText('name')}
      </div>

      <div>
        <label htmlFor={`${id}-email`} className="font-semibold">
          E-mail corporativo
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={stored?.email}
          required
          aria-invalid={!!errors.email}
          aria-describedby={describedBy('email')}
          className={inputClass}
        />
        {errorText('email')}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id={`${id}-consent`}
            name="consent"
            type="checkbox"
            required
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy('consent')}
            className="mt-1 size-5 shrink-0 accent-indigo-600"
          />
          <label htmlFor={`${id}-consent`}>
            Concordo que meu nome e pontuação sejam exibidos no ranking interno.
          </label>
        </div>
        {errorText('consent')}
      </div>

      <button type="submit" className="btn-primary w-full">
        Começar o quiz
      </button>
    </form>
  )
}
