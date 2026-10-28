import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

let client: Promise<SupabaseClient | null> | null = null

/**
 * Cliente Supabase carregado sob demanda, para manter o supabase-js fora do bundle inicial.
 * Resolve para null quando as env vars não estão definidas.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  client ??= isSupabaseConfigured
    ? import('@supabase/supabase-js').then(({ createClient }) =>
        createClient(url!, anonKey!, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        }),
      )
    : Promise.resolve(null)
  return client
}
