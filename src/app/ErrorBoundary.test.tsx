import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ explode }: { explode: { current: boolean } }) {
  if (explode.current) throw new Error('boom')
  return <p>Conteúdo normal</p>
}

describe('ErrorBoundary', () => {
  it('mostra o conteúdo quando não há erro', () => {
    render(
      <ErrorBoundary onReset={() => {}}>
        <Bomb explode={{ current: false }} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
  })

  it('troca a tela em branco por uma mensagem e permite voltar ao início', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}) // React e o boundary logam o erro
    const explode = { current: true }
    const onReset = vi.fn(() => {
      explode.current = false // o reset remove a causa (ex.: partida salva inválida)
    })
    render(
      <ErrorBoundary onReset={onReset}>
        <Bomb explode={explode} />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado')
    expect(screen.getByRole('button', { name: 'Recarregar a página' })).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Voltar ao início' }))
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Conteúdo normal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
