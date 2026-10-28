import { isObject, readJSON, STORAGE_KEYS, writeJSON } from '../../lib/storage'
import type { Identity } from '../../types/quiz'

const isIdentity = (v: unknown): v is Identity =>
  isObject(v) && typeof v.name === 'string' && typeof v.email === 'string'

/** Identidade da última partida, para pré-preencher o formulário. */
export function loadIdentity(): Identity | null {
  return readJSON('local', STORAGE_KEYS.identity, isIdentity)
}

export function saveIdentity(identity: Identity): void {
  writeJSON('local', STORAGE_KEYS.identity, identity)
}
