import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Limpa o estado que pode ter causado o erro (ex.: partida salva) e volta ao início. */
  onReset: () => void
}

interface State {
  error: Error | null
}

/**
 * Sem isto, qualquer erro de renderização deixa a tela em branco. Também cobre a falha ao
 * carregar um chunk lazy (ex.: deploy novo enquanto a aba estava aberta).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na interface:', error, info.componentStack)
  }

  private reset = () => {
    this.props.onReset()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="card space-y-4 text-center">
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="text-slate-700 dark:text-slate-300">
          Não foi possível exibir esta tela. Seus resultados já enviados continuam no ranking.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary" onClick={this.reset}>
            Voltar ao início
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            Recarregar a página
          </button>
        </div>
      </div>
    )
  }
}
