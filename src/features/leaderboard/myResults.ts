import { readJSON, STORAGE_KEYS, writeJSON } from '../../lib/storage'

// Ids (no servidor) das partidas enviadas por este navegador. O ranking usa esses ids para
// marcar a linha da pessoa sem precisar do e-mail, que não pode servir de chave de consulta.

const LIMIT = 50 // o mesmo corte aplicado em get_leaderboard

const isIdList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((id) => typeof id === 'string')

export function loadMyResultIds(): string[] {
  return readJSON('local', STORAGE_KEYS.myResults, isIdList) ?? []
}

/** Guarda o id mais recente primeiro, sem repetir. */
export function addMyResultId(id: string): void {
  const ids = [id, ...loadMyResultIds().filter((x) => x !== id)].slice(0, LIMIT)
  writeJSON('local', STORAGE_KEYS.myResults, ids)
}
