import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getSupabaseEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isUnauthenticated = !user || Boolean(error)

  // Unauthenticated users trying to access protected routes → login
  if (isUnauthenticated) {
    if (pathname.startsWith('/admin')) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      const redirect = NextResponse.redirect(loginUrl)
      // Never let this be cached/replayed by the router — a stale copy of
      // this redirect must not be reused once the user is actually logged in.
      redirect.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      redirect.headers.set('Pragma', 'no-cache')
      return redirect
    }
    return supabaseResponse
  }

  // Authenticated users on protected pages: prevent browser from caching so
  // the back-button always hits the server (which will redirect if logged out)
  if (pathname.startsWith('/admin')) {
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    supabaseResponse.headers.set('Pragma', 'no-cache')
    return supabaseResponse
  }

  // Authenticated users visiting login/signup → send to the admin dashboard.
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
    const dest = request.nextUrl.clone()
    dest.pathname = '/admin/dashboard'
    return NextResponse.redirect(dest)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
