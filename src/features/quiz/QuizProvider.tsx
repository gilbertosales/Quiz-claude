import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { loadSavedQuiz, saveQuiz } from './persistence'
import { QuizContext } from './quizContext'
import { initialQuizState, quizReducer, type QuizState } from './quizReducer'

function init(): QuizState {
  const saved = loadSavedQuiz()
  return saved ? quizReducer(initialQuizState, { type: 'RESTORE', state: saved }) : initialQuizState
}

/** Estado da partida, persistido no sessionStorage para sobreviver a um reload (RF06). */
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, undefined, init)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
    saveQuiz(state)
  }, [state])

  // O cronômetro pausa enquanto a página está fechada/recarregando (RF06: sem penalidade).
  useEffect(() => {
    dispatch({ type: 'RESUME', now: Date.now() })
    function onPageHide() {
      const now = Date.now()
      // O effect de persistência não roda a tempo no unload: salva o estado pausado aqui.
      saveQuiz(quizReducer(stateRef.current, { type: 'PAUSE', now }))
      dispatch({ type: 'PAUSE', now })
    }
    function onPageShow(e: PageTransitionEvent) {
      // Volta do bfcache: a página não recarrega, então o RESUME do mount não roda de novo.
      if (e.persisted) dispatch({ type: 'RESUME', now: Date.now() })
    }
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <QuizContext value={value}>{children}</QuizContext>
}
