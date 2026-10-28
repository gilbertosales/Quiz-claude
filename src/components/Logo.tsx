/**
 * Marca própria do quiz (✓ e ✗ num quadrado na cor de acento da marca). Não usa o logo do
 * Claude/Anthropic, que é marca registrada: o quiz é um treinamento interno, não um produto oficial.
 * O mesmo desenho está em public/favicon.svg.
 */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#d97757" />
      <path
        d="M6.5 16.5 9.6 19.6 15 13"
        fill="none"
        stroke="#faf9f5"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m19 13 6.5 6.5M25.5 13 19 19.5"
        fill="none"
        stroke="#faf9f5"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-serif text-lg font-semibold tracking-tight">Quiz Claude Code</span>
    </span>
  )
}
