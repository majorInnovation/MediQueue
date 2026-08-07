import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth/login', request.url))
}

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const response = NextResponse.json({ success: true })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
