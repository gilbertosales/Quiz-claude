import { Suspense, useCallback, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuiz } from '../features/quiz/useQuiz'
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 dark:focus:bg-slate-900"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-bold tracking-tight">
            <span aria-hidden="true">✳ </span>Quiz Claude Code
          </Link>
          <nav aria-label="Principal">
            <Link to="/ranking" className="link text-sm">
              Ranking
            </Link>
          </nav>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
        {/* key: trocar de rota (ex.: pelo cabeçalho) também tira a tela de erro. */}
        <ErrorBoundary key={pathname} onReset={resetApp}>
          <Suspense fallback={<p className="text-center">Carregando…</p>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
