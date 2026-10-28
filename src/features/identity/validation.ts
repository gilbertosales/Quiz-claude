import { z } from 'zod'

export function parseAllowedDomains(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean)
}

export const ALLOWED_DOMAINS = parseAllowedDomains(import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS)

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Lista vazia aceita qualquer domínio (RF10). */
export function isEmailDomainAllowed(email: string, allowed: readonly string[]): boolean {
  if (allowed.length === 0) return true
  const domain = normalizeEmail(email).split('@')[1] ?? ''
  return allowed.includes(domain)
}

export function makeIdentitySchema(allowed: readonly string[] = ALLOWED_DOMAINS) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe seu nome (mínimo de 2 caracteres).')
      .max(60, 'O nome pode ter no máximo 60 caracteres.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email({ message: 'Informe um e-mail válido.', abort: true }))
      .refine((email) => isEmailDomainAllowed(email, allowed), {
        message: `Use seu e-mail corporativo (${allowed.map((d) => '@' + d).join(', ')}).`,
      }),
    consent: z.literal(true, 'É preciso concordar para participar do ranking.'),
  })
}

export type IdentityInput = z.input<ReturnType<typeof makeIdentitySchema>>
