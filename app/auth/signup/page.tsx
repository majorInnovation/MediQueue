'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, Phone, Mail, Lock, User, Clock, ShieldCheck,
  Eye, EyeOff, Upload, Image as ImageIcon, FileText, X,
  CheckCircle, AlertCircle, MailCheck, ArrowLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CLINIC_TYPES = [
  'Health Post', 'Health Centre', 'General Hospital',
  'District Hospital', 'Provincial Hospital', 'Central Hospital',
  'Private Clinic', 'Specialist Clinic',
]

const PROVINCES = [
  'Central', 'Copperbelt', 'Eastern', 'Luapula',
  'Lusaka', 'Muchinga', 'North-Western', 'Northern', 'Southern', 'Western',
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
const selectCls = inputCls + ' appearance-none'

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-blue-800" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleRow({ label, desc, checked, onToggle }: { label: string; desc: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-200 transition-colors">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <div
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${checked ? 'bg-blue-700' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </label>
  )
}

export default function ClinicSignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdStrength, setPwdStrength] = useState(0)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  const [f, setF] = useState({
    clinicName: '',
    clinicType: '',
    registrationNumber: '',
    province: '',
    district: '',
    town: '',
    address: '',
    adminFullName: '',
    adminPosition: '',
    adminPhone: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    openingTime: '08:00',
    closingTime: '17:00',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
    smsEnabled: true,
    voiceEnabled: false,
    displayEnabled: true,
    agreeTerms: false,
  })

  const set = (key: keyof typeof f) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.value
    setF(prev => ({ ...prev, [key]: val }))
    if (key === 'password') {
      let s = 0
      if (val.length >= 8) s++
      if (/[a-z]/.test(val) && /[A-Z]/.test(val)) s++
      if (/[0-9]/.test(val)) s++
      if (/[!@#$%^&*]/.test(val)) s++
      setPwdStrength(s)
    }
  }

  const toggleFlag = (key: 'smsEnabled' | 'voiceEnabled' | 'displayEnabled') => () =>
    setF(prev => ({ ...prev, [key]: !prev[key] }))

  const toggleDay = (day: string) => () =>
    setF(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day],
    }))

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : '')
  }

  const strengthColors = ['bg-red-400', 'bg-amber-400', 'bg-blue-500', 'bg-green-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  function validate(): string {
    if (!f.clinicName.trim()) return 'Clinic name is required'
    if (!f.clinicType) return 'Clinic type is required'
    if (!f.province) return 'Province is required'
    if (!f.district.trim()) return 'District is required'
    if (!f.town.trim()) return 'Town is required'
    if (!f.address.trim()) return 'Physical address is required'
    if (!f.adminFullName.trim()) return 'Administrator full name is required'
    if (!f.adminPosition.trim()) return 'Administrator position is required'
    if (!f.adminPhone.trim()) return 'Administrator phone number is required'
    if (!f.adminEmail.trim()) return 'Administrator email is required'
    if (!f.password) return 'Password is required'
    if (f.password.length < 8) return 'Password must be at least 8 characters'
    if (f.password !== f.confirmPassword) return 'Passwords do not match'
    if (!f.agreeTerms) return 'Please agree to the Terms to continue'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: f.adminEmail,
      password: f.password,
      options: { data: { role: 'administrator', name: f.adminFullName } },
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Registration failed — please try again.'); setLoading(false); return }

    const body = new FormData()
    body.append('userId', userId)
    body.append('clinicName', f.clinicName)
    body.append('clinicType', f.clinicType)
    body.append('registrationNumber', f.registrationNumber)
    body.append('province', f.province)
    body.append('district', f.district)
    body.append('town', f.town)
    body.append('address', f.address)
    body.append('adminFullName', f.adminFullName)
    body.append('adminPosition', f.adminPosition)
    body.append('adminPhone', f.adminPhone)
    body.append('adminEmail', f.adminEmail)
    body.append('openingTime', f.openingTime)
    body.append('closingTime', f.closingTime)
    body.append('workingDays', JSON.stringify(f.workingDays))
    body.append('smsEnabled', String(f.smsEnabled))
    body.append('voiceEnabled', String(f.voiceEnabled))
    body.append('displayEnabled', String(f.displayEnabled))
    if (logoFile) body.append('logo', logoFile)
    if (licenseFile) body.append('license', licenseFile)

    const res = await fetch('/api/auth/register-clinic', { method: 'POST', body })
    if (!res.ok) {
      const { error: regErr } = await res.json()
      setError(regErr ?? 'Failed to register clinic. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    setVerifyEmail(f.adminEmail)
  }

  if (verifyEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <MailCheck className="w-8 h-8 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">We sent a verification link to</p>
            <p className="text-sm font-semibold text-blue-800 mt-0.5 break-all">{verifyEmail}</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Verify your email, then sign in to finish setting up {f.clinicName || 'your clinic'}.
              Your account will be reviewed and marked verified once your license is confirmed.
            </p>
          </div>
          <div className="w-full pt-2 space-y-2">
            <Link href="/auth/login"
              className="block w-full py-3.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm rounded-xl text-center transition-all shadow-md">
              Go to Sign In
            </Link>
            <p className="text-xs text-gray-400">Didn&apos;t receive it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
              <rect x="14" y="3" width="6" height="28" rx="2.5" fill="white" />
              <rect x="3" y="14" width="28" height="6" rx="2.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">Clinic Registration</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">Register your facility and create its administrator account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 sm:px-8 py-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Clinic Information ─────────────────────────── */}
            <section>
              <SectionHeader icon={Building2} title="Clinic Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Clinic Name" required>
                  <input value={f.clinicName} onChange={set('clinicName')} placeholder="City Health Clinic" className={inputCls} />
                </Field>
                <Field label="Clinic Type" required>
                  <select value={f.clinicType} onChange={set('clinicType')} className={selectCls}>
                    <option value="">Select type…</option>
                    {CLINIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Registration Number" className="sm:col-span-2">
                  <input value={f.registrationNumber} onChange={set('registrationNumber')} placeholder="MOH/2024/XXXXX" className={inputCls} />
                </Field>
                <Field label="Clinic Logo" className="sm:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview
                        ? <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        : <ImageIcon className="w-6 h-6 text-gray-300" />}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {logoFile ? 'Change logo' : 'Upload logo'}
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogoChange} className="hidden" />
                      </label>
                      {logoFile && (
                        <button type="button" onClick={() => { setLogoFile(null); setLogoPreview('') }}
                          className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                          Remove
                        </button>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">PNG, JPG or SVG. Max 2MB.</p>
                    </div>
                  </div>
                </Field>
              </div>
            </section>

            {/* ── Location ────────────────────────────────────── */}
            <section className="pt-2 border-t border-gray-100">
              <SectionHeader icon={MapPin} title="Location" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Province" required>
                  <select value={f.province} onChange={set('province')} className={selectCls}>
                    <option value="">Select province…</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="District" required>
                  <input value={f.district} onChange={set('district')} placeholder="Lusaka District" className={inputCls} />
                </Field>
                <Field label="Town" required>
                  <input value={f.town} onChange={set('town')} placeholder="Lusaka" className={inputCls} />
                </Field>
                <Field label="Physical Address" required>
                  <input value={f.address} onChange={set('address')} placeholder="Plot 12, Addis Ababa Drive" className={inputCls} />
                </Field>
              </div>
            </section>

            {/* ── Administrator ───────────────────────────────── */}
            <section className="pt-2 border-t border-gray-100">
              <SectionHeader icon={User} title="Administrator" subtitle="This person will be the primary clinic administrator" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={f.adminFullName} onChange={set('adminFullName')} placeholder="Dr. John Banda" className={inputCls + ' pl-10'} />
                  </div>
                </Field>
                <Field label="Position" required>
                  <input value={f.adminPosition} onChange={set('adminPosition')} placeholder="Medical Superintendent" className={inputCls} />
                </Field>
                <Field label="Phone Number" required>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={f.adminPhone} onChange={set('adminPhone')} placeholder="+260 XXX XXX XXX" className={inputCls + ' pl-10'} />
                  </div>
                </Field>
                <Field label="Email" required>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={f.adminEmail} onChange={set('adminEmail')} placeholder="admin@clinic.zm" className={inputCls + ' pl-10'} />
                  </div>
                </Field>
                <Field label="Password" required>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPwd ? 'text' : 'password'} value={f.password} onChange={set('password')}
                      placeholder="Create a strong password" className={inputCls + ' pl-10 pr-11'} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {f.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[pwdStrength - 1] ?? 'bg-transparent'}`}
                          style={{ width: `${(pwdStrength / 4) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{strengthLabels[pwdStrength - 1] ?? ''}</span>
                    </div>
                  )}
                </Field>
                <Field label="Confirm Password" required>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showConfirm ? 'text' : 'password'} value={f.confirmPassword} onChange={set('confirmPassword')}
                      placeholder="Re-enter your password" className={inputCls + ' pl-10 pr-11'} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {f.password && f.confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {f.password === f.confirmPassword
                        ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-600">Passwords match</span></>
                        : <><AlertCircle className="w-3.5 h-3.5 text-red-500" /><span className="text-xs text-red-600">Passwords do not match</span></>}
                    </div>
                  )}
                </Field>
              </div>
            </section>

            {/* ── Clinic Settings ─────────────────────────────── */}
            <section className="pt-2 border-t border-gray-100">
              <SectionHeader icon={Clock} title="Clinic Settings" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Opening Time">
                  <input type="time" value={f.openingTime} onChange={set('openingTime')} className={inputCls} />
                </Field>
                <Field label="Closing Time">
                  <input type="time" value={f.closingTime} onChange={set('closingTime')} className={inputCls} />
                </Field>
              </div>
              <Field label="Working Days" className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => {
                    const active = f.workingDays.includes(day)
                    return (
                      <button key={day} type="button" onClick={toggleDay(day)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-blue-800 border-blue-800 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-blue-200'
                        }`}>
                        {day}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <div className="space-y-3">
                <ToggleRow label="SMS Notifications" desc="Send queue updates to patients via SMS"
                  checked={f.smsEnabled} onToggle={toggleFlag('smsEnabled')} />
                <ToggleRow label="Voice Announcements" desc="Announce patient numbers audibly"
                  checked={f.voiceEnabled} onToggle={toggleFlag('voiceEnabled')} />
                <ToggleRow label="Queue Display" desc="Show live queue on external screens"
                  checked={f.displayEnabled} onToggle={toggleFlag('displayEnabled')} />
              </div>
            </section>

            {/* ── Verification ────────────────────────────────── */}
            <section className="pt-2 border-t border-gray-100">
              <SectionHeader icon={ShieldCheck} title="Verification" subtitle="Helps us confirm your facility is a licensed healthcare provider" />
              <Field label="Upload License" className="mb-4">
                {licenseFile ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-700 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{licenseFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setLicenseFile(null)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:border-blue-300 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload PDF or image (max 5MB)</span>
                    <input type="file" accept="application/pdf,image/png,image/jpeg"
                      onChange={e => setLicenseFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </label>
                )}
              </Field>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={f.agreeTerms}
                  onChange={e => setF(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <Link href="#" className="text-blue-700 font-medium hover:underline">Terms of Service</Link>
                  {' '}&amp;{' '}
                  <Link href="#" className="text-blue-700 font-medium hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </section>

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-blue-100 disabled:cursor-not-allowed">
              {isLoading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Clinic Account…
                  </span>
                : 'Create Clinic Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          Already registered?{' '}
          <Link href="/auth/login" className="text-blue-700 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
