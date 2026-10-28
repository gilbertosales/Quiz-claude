import { Suspense, useCallback, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuiz } from '../features/quiz/useQuiz'
import { Logo } from '../components/Logo'
import { ErrorBoundary } from './ErrorBoundary'
import { markInitialRenderDone } from './pageMeta'

export function Layout() {
  const { dispatch } = useQuiz()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Efeitos dos filhos rodam antes: a página da carga inicial não rouba o foco.
  useEffect(() => markInitialRenderDone(), [])

  // RESET também apaga a partida salva no sessionStorage, que pode ser a causa do erro.
  const resetApp = useCallback(() => {
    dispatch({ type: 'RESET' })
    navigate('/')
  }, [dispatch, navigate])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Principal">
            <Link
              to="/ranking"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              Ranking
            </Link>
          </nav>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-14">
        {/* key: trocar de rota (ex.: pelo cabeçalho) também tira a tela de erro. */}
        <ErrorBoundary key={pathname} onReset={resetApp}>
          <Suspense fallback={<p className="text-center">Carregando…</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>Treinamento interno sobre o Claude Code.</p>
          <p>Não é um produto oficial da Anthropic.</p>
        </div>
      </footer>
    </div>
  )
}
