import { isObject, readJSON, STORAGE_KEYS, writeJSON } from '../../lib/storage'
import { submitResult, SubmitError, type ResultPayload } from './api'
import { addMyResultId } from './myResults'

// Fila de reenvio (RF17): toda partida entra na fila antes do envio e só sai quando o servidor
// confirma ou recusa de forma permanente. Assim nada se perde se a aba fechar no meio do envio.
// O envio é idempotente por gameId no servidor, então reenviar uma partida já gravada é seguro.

export interface PendingSubmission {
  gameId: string
  payload: ResultPayload
  queuedAt: string
}

const isPendingList = (v: unknown): v is PendingSubmission[] =>
  Array.isArray(v) &&
  v.every((p) => isObject(p) && typeof p.gameId === 'string' && isObject(p.payload))

export function loadPending(): PendingSubmission[] {
  return readJSON('local', STORAGE_KEYS.pending, isPendingList) ?? []
}

function savePending(list: PendingSubmission[]) {
  writeJSON('local', STORAGE_KEYS.pending, list)
}

export function enqueue(item: PendingSubmission): void {
  const list = loadPending()
  if (!list.some((p) => p.gameId === item.gameId)) savePending([...list, item])
}

export function removePending(gameId: string): void {
  savePending(loadPending().filter((p) => p.gameId !== gameId))
}

// Evita envio duplicado da mesma partida (ex.: tela de resultado + reenvio ao abrir o app).
const inFlight = new Map<string, Promise<void>>()

/** Enfileira e envia a partida. Rejeita com SubmitError se falhar. */
export function submitGame(item: PendingSubmission): Promise<void> {
  const running = inFlight.get(item.gameId)
  if (running) return running
  enqueue(item)
  const promise = submitResult(item.gameId, item.payload)
    .then((resultId) => {
      addMyResultId(resultId)
      removePending(item.gameId)
    })
    .catch((err: unknown) => {
      const error = err instanceof SubmitError ? err : new SubmitError('network')
      if (error.permanent) removePending(item.gameId)
      throw error
    })
    .finally(() => inFlight.delete(item.gameId))
  inFlight.set(item.gameId, promise)
  return promise
}

/** Tenta reenviar todas as partidas pendentes; devolve quantas foram enviadas. */
export async function flushPending(): Promise<number> {
  const results = await Promise.allSettled(loadPending().map(submitGame))
  return results.filter((r) => r.status === 'fulfilled').length
}
