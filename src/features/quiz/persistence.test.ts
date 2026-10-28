import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { STORAGE_KEYS } from '../../lib/storage'
import { drawQuestions } from './draw'
import { isRestorableQuizState, loadSavedQuiz, saveQuiz } from './persistence'
import { initialQuizState, quizReducer, type QuizState } from './quizReducer'

const questions = drawQuestions(QUESTIONS)

function playing(): QuizState {
  return [
    { type: 'START' as const },
    {
      type: 'SET_IDENTITY' as const,
      identity: { name: 'Ana', email: 'ana@empresa.com' },
      questions,
      gameId: 'g1',
      now: 1000,
    },
  ].reduce(quizReducer, initialQuizState)
}

function finished(): QuizState {
  let s = playing()
  while (s.phase !== 'finished') {
    s =
      s.phase === 'playing'
        ? quizReducer(s, { type: 'ANSWER', answer: true, now: 60_000 })
        : quizReducer(s, { type: 'NEXT' })
  }
  return s
}

describe('isRestorableQuizState', () => {
  it('aceita estados válidos', () => {
    expect(isRestorableQuizState(initialQuizState)).toBe(true)
    expect(isRestorableQuizState({ ...initialQuizState, phase: 'identifying' })).toBe(true)
    expect(isRestorableQuizState(playing())).toBe(true)
    expect(
      isRestorableQuizState(quizReducer(playing(), { type: 'ANSWER', answer: true, now: 2 })),
    ).toBe(true)
    expect(isRestorableQuizState(finished())).toBe(true)
  })

  it.each([
    ['fase desconhecida', { phase: 'hacked' }],
    ['partida sem perguntas', { questions: [], answers: [] }],
    ['index fora do intervalo', { index: 20 }],
    ['index negativo', { index: -1 }],
    ['index não inteiro', { index: 1.5 }],
    ['answers com tamanho diferente', { answers: [null] }],
    ['resposta inválida', { answers: Array(20).fill('sim') }],
    ['pergunta malformada', { questions: [{ id: 'x' }, ...questions.slice(1)] }],
    ['playing com a pergunta atual já respondida', { answers: [true, ...Array(19).fill(null)] }],
    ['sem identidade', { identity: null }],
    ['sem gameId', { gameId: null }],
    ['startedAt inválido', { startedAt: 'ontem' }],
    ['elapsedMs ausente', { elapsedMs: undefined }],
    ['elapsedMs negativo', { elapsedMs: -1 }],
    ['runningSince inválido', { runningSince: 'agora' }],
  ])('rejeita %s', (_, patch) => {
    expect(isRestorableQuizState({ ...playing(), ...patch })).toBe(false)
  })

  it('rejeita fase de resultado com perguntas sem resposta', () => {
    const s = finished()
    expect(isRestorableQuizState({ ...s, answers: [null, ...s.answers.slice(1)] })).toBe(false)
    expect(isRestorableQuizState({ ...s, finishedAt: null })).toBe(false)
  })

  it('rejeita valores que não são objetos', () => {
    for (const v of [null, 42, 'x', []]) expect(isRestorableQuizState(v)).toBe(false)
  })
})

describe('loadSavedQuiz / saveQuiz', () => {
  it('salva e restaura uma partida', () => {
    saveQuiz(playing())
    expect(loadSavedQuiz()).toEqual(playing())
  })

  it('descarta e apaga um estado inválido', () => {
    sessionStorage.setItem(STORAGE_KEYS.quiz, JSON.stringify({ ...playing(), index: 99 }))
    expect(loadSavedQuiz()).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEYS.quiz)).toBeNull()
  })

  it('descarta JSON corrompido', () => {
    sessionStorage.setItem(STORAGE_KEYS.quiz, '{oops')
    expect(loadSavedQuiz()).toBeNull()
  })

  it('apaga o estado salvo ao voltar para idle', () => {
    saveQuiz(playing())
    saveQuiz(initialQuizState)
    expect(sessionStorage.getItem(STORAGE_KEYS.quiz)).toBeNull()
  })
})
