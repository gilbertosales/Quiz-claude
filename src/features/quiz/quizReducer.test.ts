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

  describe('cronômetro (só tempo ativo)', () => {
    it('cada resposta acumula o tempo do trecho', () => {
      const s = run(
        playing(), // começa em 1000
        { type: 'ANSWER', answer: true, now: 5000 },
        { type: 'NEXT' },
        { type: 'ANSWER', answer: true, now: 9000 },
      )
      expect(s).toMatchObject({ elapsedMs: 8000, runningSince: 9000 })
    })

    it('PAUSE/RESUME descontam o tempo fora da página', () => {
      let s = run(playing(), { type: 'PAUSE', now: 3000 }) // 2s ativos
      expect(s).toMatchObject({ elapsedMs: 2000, runningSince: null })
      s = run(
        s,
        { type: 'RESUME', now: 3_600_000 },
        { type: 'ANSWER', answer: true, now: 3_601_000 },
      )
      expect(s.elapsedMs).toBe(3000) // a hora parada não conta
    })

    it('PAUSE repetido e RESUME fora de partida não mudam nada', () => {
      const paused = run(playing(), { type: 'PAUSE', now: 3000 })
      expect(quizReducer(paused, { type: 'PAUSE', now: 9000 })).toBe(paused)
      expect(quizReducer(initialQuizState, { type: 'RESUME', now: 1 })).toBe(initialQuizState)
      const done = run(playUntil(19), { type: 'ANSWER', answer: true, now: 5000 }, { type: 'NEXT' })
      expect(quizReducer(done, { type: 'RESUME', now: 9000 })).toBe(done)
    })

    it('reload no meio da partida não penaliza: RESTORE pausa e RESUME retoma', () => {
      const beforeUnload = run(playing(), { type: 'PAUSE', now: 4000 })
      let s = quizReducer(initialQuizState, { type: 'RESTORE', state: beforeUnload })
      s = run(s, { type: 'RESUME', now: 100_000 }, { type: 'ANSWER', answer: true, now: 101_000 })
      expect(s.elapsedMs).toBe(4000)
    })

    it('a duração final é o tempo ativo', () => {
      let s = run(playing(), { type: 'PAUSE', now: 2000 }, { type: 'RESUME', now: 50_000 })
      expect(durationMs(s)).toBeNull()
      for (let i = 0; i < 20; i++) {
        s = run(s, { type: 'ANSWER', answer: true, now: 50_000 + (i + 1) * 1000 }, { type: 'NEXT' })
        if (s.phase === 'levelTransition') s = quizReducer(s, { type: 'NEXT' })
      }
      expect(s.phase).toBe('finished')
      expect(durationMs(s)).toBe(1000 + 20_000)
      expect(s.runningSince).toBeNull()
    })
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

  it('RESTORE retoma o estado salvo (pausado) e converte envio interrompido em erro', () => {
    const saved = playUntil(7)
    expect(quizReducer(initialQuizState, { type: 'RESTORE', state: saved })).toEqual({
      ...saved,
      runningSince: null,
    })
    const interrupted = { ...saved, phase: 'submitting' as const }
    expect(quizReducer(initialQuizState, { type: 'RESTORE', state: interrupted }).phase).toBe(
      'submitError',
    )
  })

  it('RESET volta ao estado inicial', () => {
    expect(quizReducer(playUntil(3), { type: 'RESET' })).toBe(initialQuizState)
  })
})
