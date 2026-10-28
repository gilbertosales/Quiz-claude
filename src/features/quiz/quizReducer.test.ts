import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/questions'
import { drawQuestions } from './draw'
import {
  durationMs,
  initialQuizState,
  quizReducer,
  type QuizAction,
  type QuizState,
} from './quizReducer'

const questions = drawQuestions(QUESTIONS)
const identity = { name: 'Ana', email: 'ana@empresa.com' }

function run(state: QuizState, ...actions: QuizAction[]) {
  return actions.reduce(quizReducer, state)
}

function playing() {
  return run(
    initialQuizState,
    { type: 'START' },
    { type: 'SET_IDENTITY', identity, questions, gameId: 'g1', now: 1000 },
  )
}

/** Responde e avança até ficar na pergunta `target` (fase playing). */
function playUntil(target: number) {
  let s = playing()
  while (s.index < target || s.phase !== 'playing') {
    s =
      s.phase === 'playing'
        ? quizReducer(s, { type: 'ANSWER', answer: true, now: 2000 })
        : quizReducer(s, { type: 'NEXT' })
  }
  return s
}

describe('quizReducer', () => {
  it('START leva a identifying e SET_IDENTITY inicia a partida', () => {
    const s = playing()
    expect(s.phase).toBe('playing')
    expect(s.index).toBe(0)
    expect(s.identity).toEqual(identity)
    expect(s.answers).toEqual(Array(20).fill(null))
    expect(s.startedAt).toBe(1000)
  })

  it('ignora SET_IDENTITY fora de identifying', () => {
    const s = quizReducer(initialQuizState, {
      type: 'SET_IDENTITY',
      identity,
      questions,
      gameId: 'g',
      now: 0,
    })
    expect(s).toBe(initialQuizState)
  })

  it('ANSWER registra a resposta e mostra feedback; uma segunda resposta é ignorada', () => {
    const s1 = quizReducer(playing(), { type: 'ANSWER', answer: false, now: 1500 })
    expect(s1.phase).toBe('feedback')
    expect(s1.answers[0]).toBe(false)
    const s2 = quizReducer(s1, { type: 'ANSWER', answer: true, now: 1600 })
    expect(s2).toBe(s1)
  })

  it('NEXT dentro do nível vai para a próxima pergunta', () => {
    const s = run(playing(), { type: 'ANSWER', answer: true, now: 1 }, { type: 'NEXT' })
    expect(s.phase).toBe('playing')
    expect(s.index).toBe(1)
  })

  it('NEXT no fim de um nível mostra a transição, e o próximo NEXT segue para o novo nível', () => {
    let s = playUntil(4)
    s = run(s, { type: 'ANSWER', answer: true, now: 1 }, { type: 'NEXT' })
    expect(s.phase).toBe('levelTransition')
    expect(s.index).toBe(5)
    expect(s.questions[5].level).toBe('basico')
    s = quizReducer(s, { type: 'NEXT' })
    expect(s.phase).toBe('playing')
    expect(s.index).toBe(5)
  })

  it('a última resposta registra o fim e NEXT finaliza', () => {
    let s = playUntil(19)
    s = quizReducer(s, { type: 'ANSWER', answer: true, now: 61_000 })
    expect(s.finishedAt).toBe(61_000)
    expect(durationMs(s)).toBe(60_000)
    s = quizReducer(s, { type: 'NEXT' })
    expect(s.phase).toBe('finished')
    expect(s.answers.every((a) => a !== null)).toBe(true)
  })

  it('fluxo de envio: FINISH → SUBMIT_FAIL → FINISH → SUBMIT_OK', () => {
    let s = run(playUntil(19), { type: 'ANSWER', answer: true, now: 30_000 }, { type: 'NEXT' })
    s = quizReducer(s, { type: 'FINISH' })
    expect(s.phase).toBe('submitting')
    s = quizReducer(s, { type: 'SUBMIT_FAIL', error: 'offline' })
    expect(s).toMatchObject({ phase: 'submitError', submitError: 'offline' })
    s = run(s, { type: 'FINISH' }, { type: 'SUBMIT_OK' })
    expect(s).toMatchObject({ phase: 'done', submitError: null })
  })

  it('RESTORE retoma o estado salvo e converte envio interrompido em erro', () => {
    const saved = playUntil(7)
    expect(quizReducer(initialQuizState, { type: 'RESTORE', state: saved })).toEqual(saved)
    const interrupted = { ...saved, phase: 'submitting' as const }
    expect(quizReducer(initialQuizState, { type: 'RESTORE', state: interrupted }).phase).toBe(
      'submitError',
    )
  })

  it('RESET volta ao estado inicial', () => {
    expect(quizReducer(playUntil(3), { type: 'RESET' })).toBe(initialQuizState)
  })
})
