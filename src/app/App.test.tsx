import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QUESTIONS_BY_ID } from '../data/questions'
import { submitResult, SubmitError } from '../features/leaderboard/api'
import { loadPending } from '../features/leaderboard/pending'
import { loadHistory } from '../features/quiz/history'
import { STORAGE_KEYS } from '../lib/storage'
import { App } from './App'

vi.mock('../features/leaderboard/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/leaderboard/api')>()),
  submitResult: vi.fn(),
  fetchLeaderboard: vi.fn().mockResolvedValue([]),
}))

beforeEach(() => {
  window.history.pushState({}, '', '/')
  vi.mocked(submitResult).mockReset()
})

async function startGame(user: ReturnType<typeof userEvent.setup>) {
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Começar' }))
  await user.type(screen.getByLabelText('Nome'), 'Ana Souza')
  await user.type(screen.getByLabelText('E-mail corporativo'), 'Ana@Empresa.com')
  await user.click(screen.getByLabelText(/Concordo/))
  await user.click(screen.getByRole('button', { name: 'Começar o quiz' }))
}

describe('fluxo do quiz', () => {
  it('valida a identificação antes de começar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    await user.click(screen.getByRole('button', { name: 'Começar o quiz' }))
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(screen.getByText(/Concordo/).closest('div')?.parentElement).toHaveTextContent(
      'É preciso concordar',
    )
  })

  it('joga as 20 perguntas pelo teclado, com transições, e envia o resultado', async () => {
    vi.mocked(submitResult).mockResolvedValue('uuid')
    const user = userEvent.setup()
    await startGame(user)

    for (let i = 1; i <= 20; i++) {
      expect(screen.getByRole('heading', { name: `Pergunta ${i} de 20` })).toBeInTheDocument()
      await user.keyboard('v')
      expect(screen.getByText(/^(Correto!|Incorreto)$/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /documentação oficial/ })).toHaveAttribute(
        'target',
        '_blank',
      )
      await user.keyboard('{Enter}')
      const levelDone = i % 5 === 0 && i < 20
      expect(screen.queryByRole('heading', { name: /concluído: \d\/5/ }) !== null).toBe(levelDone)
      if (levelDone) await user.keyboard('{Enter}')
    }

    expect(await screen.findByRole('heading', { name: 'Resultado' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Resultado salvo no ranking/)).toBeInTheDocument())
    expect(submitResult).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(submitResult).mock.calls[0][0]
    // Respondeu "Verdadeiro" em tudo: acerta exatamente as afirmações verdadeiras.
    const trueCount = payload.questionIds.filter((id) => QUESTIONS_BY_ID.get(id)?.answer).length
    expect(payload).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@empresa.com',
      correctCount: trueCount,
    })
    expect(payload.questionIds).toHaveLength(20)
    expect(loadPending()).toEqual([])
    expect(loadHistory().best?.score).toBe(payload.score)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(20)
  }, 30_000)

  it('guarda o resultado na fila quando o envio falha e permite tentar de novo', async () => {
    vi.mocked(submitResult)
      .mockRejectedValueOnce(new SubmitError('network'))
      .mockResolvedValueOnce('uuid')
    const user = userEvent.setup()
    await startGame(user)
    for (let i = 1; i <= 20; i++) {
      await user.keyboard('f{Enter}')
      if (i % 5 === 0 && i < 20) await user.keyboard('{Enter}')
    }
    expect(await screen.findByText(/Não foi possível conectar/)).toBeInTheDocument()
    expect(loadPending()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await waitFor(() => expect(screen.getByText(/Resultado salvo no ranking/)).toBeInTheDocument())
    expect(loadPending()).toEqual([])
  }, 30_000)

  it('não deixa alterar a resposta depois de responder', async () => {
    const user = userEvent.setup()
    await startGame(user)
    await user.keyboard('v')
    await user.keyboard('f')
    expect(screen.getByRole('button', { name: /^Verdadeiro/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /^Falso/ })).toBeDisabled()
  })

  it('persiste a partida no sessionStorage para retomar após reload', async () => {
    const user = userEvent.setup()
    await startGame(user)
    await user.keyboard('v{Enter}v')
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.quiz)!)
    expect(saved).toMatchObject({ phase: 'feedback', index: 1 })
  })
})
