'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function parseRecoveryParams() {
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const merged = new URLSearchParams([...params.entries(), ...hashParams.entries()])

  return {
    code: merged.get('code') || '',
    accessToken: merged.get('access_token') || '',
    refreshToken: merged.get('refresh_token') || '',
    token: merged.get('token') || '',
    email: merged.get('email') || '',
    type: merged.get('type') || '',
  }
}

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)

  useEffect(() => {
    const restoreRecoverySession = async () => {
      const { code, accessToken, refreshToken, token, email, type } = parseRecoveryParams()
      const isRecoveryType = type?.toLowerCase() === 'recovery'

      if (!code && !(accessToken && isRecoveryType) && !(token && isRecoveryType)) {
        setError('This page must be opened from your password reset email link.')
        setIsLoading(false)
        return
      }

      try {
        if (code) {
          const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (codeError) throw codeError
        } else if (token && email) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery',
          })
          if (verifyError) throw verifyError
        } else if (accessToken && refreshToken) {
          // Fallback for non-PKCE reset links. Do not force this during normal recovery handling,
          // because the URL-based flow can overwrite the active session and trigger the PKCE warning.
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError) throw sessionError
        }

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
          throw new Error('Your reset link is invalid or expired. Please request a new one.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to restore the password reset session.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreRecoverySession()
  }, [supabase])

  useEffect(() => {
    setCanSubmit(
      newPassword.length >= 8 && newPassword === confirmPassword
    )
  }, [newPassword, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        throw new Error('Your reset session has expired. Please request a new password reset link.')
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) {
        throw updateErr
      }

      setMessage('Your password has been updated. You can now sign in with your new password.')
      setTimeout(() => {
        window.location.assign('/auth/login')
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update your password. Please try again.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Create a new password</h1>
            <p className="text-sm text-gray-500 mt-2">Enter your new password below and use it to sign in again.</p>
          </div>

          {isLoading && (
            <div className="p-6 rounded-2xl bg-gray-100 text-gray-700 text-center">Loading reset session...</div>
          )}

          {!isLoading && (
            <>
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

              {!message && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="w-full py-3.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Updating password...' : 'Save new password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
