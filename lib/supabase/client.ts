import { createBrowserClient } from '@supabase/ssr'

function getSupabaseEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = name === 'NEXT_PUBLIC_SUPABASE_URL'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Module-level singleton — every page/component that calls createClient()
// shares this one instance. Creating a fresh client per call (the previous
// behavior) spins up a new GoTrueClient with its own auto-refresh timer each
// time, and several of those racing to refresh the same session token is a
// documented cause of spurious "logged out mid-navigation" session loss.
let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      getSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    )
  }
  return browserClient
}
