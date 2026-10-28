import { useEffect, useRef, type ReactNode } from 'react'
import { shouldFocusPageHeading } from '../app/pageMeta'

/**
 * <h1> da página. Ao chegar por navegação interna, recebe o foco: o leitor de tela anuncia a
 * página nova e o Tab segue a partir do conteúdo, e não do topo do documento.
 */
export function PageHeading({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (shouldFocusPageHeading()) ref.current?.focus()
  }, [])

  return (
    <h1 ref={ref} tabIndex={-1} className={`outline-none ${className ?? ''}`}>
      {children}
    </h1>
  )
}
