'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPwd]    = useState(false)
  const [isLoading, setLoading]       = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    if (searchParams.get('error')) {
      setError('Authentication failed. Please try again.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/admin/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect x="14" y="3" width="6" height="28" rx="2.5" fill="white" />
              <rect x="3" y="14" width="28" height="6" rx="2.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">MediQueue</h1>
          <p className="text-xs text-gray-500 text-center mt-0.5">Smart Clinic Queue &amp; Priority Triage</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span />
              <Link href="#" className="text-sm text-blue-700 font-medium hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full mt-1 py-3.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-100 disabled:cursor-not-allowed">
              {isLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                : 'Sign in'}
            </button>
          </form>

        </div>

        <div className="mt-5">
          <p className="text-center text-sm text-gray-600">
            Registering a new clinic?{' '}
            <Link href="/auth/signup" className="text-blue-700 font-bold hover:underline">Register your clinic</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
