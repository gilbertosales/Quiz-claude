// Wrappers seguros de localStorage/sessionStorage: em modo privado ou com storage bloqueado,
// o acesso pode lançar exceção ou o conteúdo pode estar corrompido. Nada aqui deve quebrar o app.

export type StorageArea = 'local' | 'session'

export const STORAGE_KEYS = {
  identity: 'qcc:identity',
  history: 'qcc:history',
  pending: 'qcc:pending',
  myResults: 'qcc:my-results',
  quiz: 'qcc:quiz',
} as const

function getStore(area: StorageArea): Storage | null {
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

/** Lê e desserializa; `guard` descarta valores com formato inesperado. */
export function readJSON<T>(
  area: StorageArea,
  key: string,
  guard: (value: unknown) => value is T,
): T | null {
  try {
    const raw = getStore(area)?.getItem(key)
    if (raw == null) return null
    const value: unknown = JSON.parse(raw)
    return guard(value) ? value : null
  } catch {
    return null
  }
}

export function writeJSON(area: StorageArea, key: string, value: unknown): void {
  try {
    getStore(area)?.setItem(key, JSON.stringify(value))
  } catch {
    // Cota excedida ou storage indisponível: segue sem persistir.
  }
}

export function removeItem(area: StorageArea, key: string): void {
  try {
    getStore(area)?.removeItem(key)
  } catch {
    // ignorado
  }
}

export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
