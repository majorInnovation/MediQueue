'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setIsLoading(true)
    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setIsLoading(false)

    if (resetError) {
      setError(resetError.message || 'Unable to send reset email. Please try again.')
      return
    }

    setMessage('If that email is registered, a password reset link has been sent. Check your inbox.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          <Link href="/auth/login" className="text-blue-700 font-medium hover:text-blue-900">Back to sign in</Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-7 py-9">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
            <p className="text-sm text-gray-500 mt-2">Enter your email and we&apos;ll send you a secure link to reset your password.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
