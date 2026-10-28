export function DocLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link">
      Saiba mais na documentação oficial
      <span className="sr-only"> (abre em nova aba)</span>
      <span aria-hidden="true"> ↗</span>
    </a>
  )
}
