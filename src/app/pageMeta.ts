import { useEffect } from 'react'

export const APP_NAME = 'Quiz Claude Code'

/** Título da aba por página (WCAG 2.4.2). */
export function usePageTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}

// Na carga inicial o foco fica onde o navegador colocou; só depois de uma navegação dentro do
// app o título da nova página recebe o foco (o botão clicado desmontou e o foco cairia no body).
let navigated = false

/** Chamado pelo Layout depois da primeira montagem: daqui em diante, toda página nova é navegação. */
export function markInitialRenderDone(): void {
  navigated = true
}

export function shouldFocusPageHeading(): boolean {
  return navigated
}

/** Só para testes: volta ao estado de carga inicial. */
export function resetNavigationFocus(): void {
  navigated = false
}
