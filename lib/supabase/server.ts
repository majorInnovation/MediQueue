import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabaseEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = name === 'NEXT_PUBLIC_SUPABASE_URL'
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function isHttpsEnvironment() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      return new URL(appUrl).protocol === 'https:'
    } catch {
      return false
    }
  }

  return process.env.NODE_ENV === 'production'
}

function getCookieOptions(options?: Record<string, unknown>) {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: isHttpsEnvironment(),
    ...options,
  }
}

type SupabaseAuth = ReturnType<typeof createServerClient>['auth']

function createSafeAuth(auth: SupabaseAuth) {
  return new Proxy(auth, {
    get(target, prop, receiver) {
      if (prop === 'getUser') {
        return async (...args: Parameters<SupabaseAuth['getUser']>) => {
          try {
            return await target.getUser(...args)
          } catch (error) {
            return {
              data: { user: null },
              error: error as Error,
            }
          }
        }
      }

      if (prop === 'getSession') {
        return async (...args: Parameters<SupabaseAuth['getSession']>) => {
          try {
            return await target.getSession(...args)
          } catch (error) {
            return {
              data: { session: null },
              error: error as Error,
            }
          }
        }
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}

export async function createClient() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, getCookieOptions(options as Record<string, unknown>))
            )
          } catch {
            // Called from a Server Component — ignored (middleware.ts refreshes session)
          }
        },
      },
    }
  )

  return new Proxy(supabase, {
    get(target, prop, receiver) {
      if (prop === 'auth') {
        return createSafeAuth(target.auth)
      }

      return Reflect.get(target, prop, receiver)
    },
  }) as typeof supabase
}

/** Service-role client — bypasses RLS. Use only in trusted server contexts. */
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    getSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getSupabaseEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
