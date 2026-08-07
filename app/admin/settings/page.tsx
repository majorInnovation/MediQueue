'use client'

import React, { useState, useEffect } from 'react'
import {
  LogOut, Building2, MessageSquare, Users,
  Save, Shield, CheckCircle2, Mail,
  ToggleLeft, ToggleRight, AlertCircle, Plus, X, Trash2, Copy,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StaffRow = { id: string; name: string; role: string; email: string; status: 'active' | 'inactive' }
type Department = { id: string; name: string; active: boolean }

const STAFF_ROLES = ['administrator', 'receptionist', 'nurse', 'doctor'] as const

const roleBadge: Record<string, string> = {
  doctor: 'bg-blue-50 text-blue-700 border-blue-100',
  nurse: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  receptionist: 'bg-purple-50 text-purple-700 border-purple-100',
  administrator: 'bg-amber-50 text-amber-700 border-amber-100',
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">{title}</h3>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [smsEnabled, setSmsEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [clinic, setClinic] = useState({
    name: '', address: '', phone: '', email: '', openTime: '08:00', closeTime: '17:00',
  })

  const [sms, setSms] = useState({ apiKey: '', senderId: '', template: '' })

  const [newPassword, setNewPassword] = useState('')
  const [pwdStatus, setPwdStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pwdError, setPwdError] = useState('')

  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'receptionist', phone: '', department: '' })
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [newStaffCredentials, setNewStaffCredentials] = useState<{ email: string; password: string } | null>(null)

  const [showAddDept, setShowAddDept] = useState(false)
  const [deptForm, setDeptForm] = useState({ name: '', description: '' })
  const [deptSaving, setDeptSaving] = useState(false)
  const [deptError, setDeptError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? ''))

    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.clinic) {
          setClinic({
            name: data.clinic.name ?? '',
            address: data.clinic.address ?? '',
            phone: data.clinic.phone ?? '',
            email: data.clinic.email ?? '',
            openTime: data.clinic.opening_time ?? '08:00',
            closeTime: data.clinic.closing_time ?? '17:00',
          })
        }
        if (data.settings?.notification_channels) {
          setSmsEnabled(data.settings.notification_channels.sms ?? true)
          setVoiceEnabled(data.settings.notification_channels.voice ?? false)
          setEmailEnabled(data.settings.notification_channels.email ?? false)
        }
        if (data.smsSettings) {
          setSms({
            apiKey: data.smsSettings.api_key ?? '',
            senderId: data.smsSettings.sender_id ?? '',
            template: data.smsSettings.templates?.queueUpdate ?? '',
          })
        }
        setStaff((data.staff ?? []).map((s: any) => ({
          id: s.id, name: s.name, role: s.role, email: s.email, status: s.status ?? 'active',
        })))
        setDepartments((data.departments ?? []).map((d: any) => ({
          id: d.id, name: d.name, active: d.is_active ?? true,
        })))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    await Promise.all([
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'clinic',
          data: { name: clinic.name, address: clinic.address, phone: clinic.phone, email: clinic.email, opening_time: clinic.openTime, closing_time: clinic.closeTime },
        }),
      }),
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'notification_channels',
          data: { sms: smsEnabled, voice: voiceEnabled, email: emailEnabled },
        }),
      }),
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'sms_settings',
          data: { api_key: sms.apiKey, sender_id: sms.senderId, templates: { queueUpdate: sms.template } },
        }),
      }),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function toggleStaff(id: string) {
    const target = staff.find(s => s.id === id)
    if (!target) return
    const nextStatus = target.status === 'active' ? 'inactive' : 'active'
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s))
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'staff_status', data: { staffId: id, status: nextStatus } }),
    })
  }

  async function toggleDept(id: string) {
    const target = departments.find(d => d.id === id)
    if (!target) return
    const nextActive = !target.active
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, active: nextActive } : d))
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'department_status', data: { departmentId: id, is_active: nextActive } }),
    })
  }

  async function submitAddStaff() {
    setStaffError('')
    if (!staffForm.name.trim() || !staffForm.email.trim()) {
      setStaffError('Name and email are required')
      return
    }
    setStaffSaving(true)
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      })
      const result = await res.json()
      if (!res.ok) { setStaffError(result.error ?? 'Failed to add staff account'); return }

      setStaff(prev => [...prev, {
        id: result.staff.id, name: result.staff.name, role: result.staff.role,
        email: result.staff.email, status: result.staff.status ?? 'active',
      }])
      setNewStaffCredentials({ email: staffForm.email, password: result.tempPassword })
      setShowAddStaff(false)
      setStaffForm({ name: '', email: '', role: 'receptionist', phone: '', department: '' })
    } finally {
      setStaffSaving(false)
    }
  }

  async function removeStaff(id: string) {
    if (!confirm('Remove this staff account? This also deletes their login access.')) return
    setStaff(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' })
  }

  async function submitAddDept() {
    setDeptError('')
    if (!deptForm.name.trim()) { setDeptError('Department name is required'); return }
    setDeptSaving(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      })
      const result = await res.json()
      if (!res.ok) { setDeptError(result.error ?? 'Failed to add department'); return }

      setDepartments(prev => [...prev, { id: result.department.id, name: result.department.name, active: result.department.is_active ?? true }])
      setShowAddDept(false)
      setDeptForm({ name: '', description: '' })
    } finally {
      setDeptSaving(false)
    }
  }

  async function removeDept(id: string) {
    if (!confirm('Remove this department?')) return
    setDepartments(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' })
  }

  async function updatePassword() {
    if (newPassword.length < 8) { setPwdStatus('error'); setPwdError('Password must be at least 8 characters'); return }
    setPwdStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwdStatus('error'); setPwdError(error.message); return }
    setPwdStatus('saved')
    setNewPassword('')
    setTimeout(() => setPwdStatus('idle'), 3000)
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="6" y="1" width="4" height="14" rx="1.5" fill="white" />
                <rect x="1" y="6" width="14" height="4" rx="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">Settings</h1>
              <p className="text-xs text-gray-500 hidden md:block">Clinic configuration and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </div>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Changes</span>
            </button>
            <button type="button" onClick={() => { window.location.href = '/api/auth/logout' }} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-200 text-sm">Admin · Settings</p>
          <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Settings</h2>
          <p className="text-blue-300 text-sm mt-1">Manage clinic information, SMS, staff, and departments</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">

        {/* Clinic Information */}
        <Section title="Clinic Information" sub="Basic details and operating hours">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Clinic Name', key: 'name', type: 'text' },
              { label: 'Phone Number', key: 'phone', type: 'tel' },
              { label: 'Email Address', key: 'email', type: 'email' },
              { label: 'Address', key: 'address', type: 'text' },
              { label: 'Opening Time', key: 'openTime', type: 'time' },
              { label: 'Closing Time', key: 'closeTime', type: 'time' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">{label}</label>
                <input
                  type={type}
                  value={clinic[key as keyof typeof clinic]}
                  onChange={e => setClinic(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Notification Channels */}
        <Section title="Notification Channels" sub="Configure how patients are notified">
          <div className="space-y-3">
            {[
              { label: 'SMS Notifications', sub: 'Send queue updates via text message', icon: MessageSquare, enabled: smsEnabled, toggle: () => setSmsEnabled(v => !v) },
              { label: 'Voice Announcements', sub: 'Call out queue numbers on clinic speakers', icon: Users, enabled: voiceEnabled, toggle: () => setVoiceEnabled(v => !v) },
              { label: 'Email Notifications', sub: 'Send appointment reminders via email', icon: Mail, enabled: emailEnabled, toggle: () => setEmailEnabled(v => !v) },
            ].map(({ label, sub, icon: Icon, enabled, toggle }) => (
              <div key={label} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${enabled ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${enabled ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
                <button onClick={toggle} className="flex-shrink-0">
                  {enabled
                    ? <ToggleRight className="w-8 h-8 text-blue-700" />
                    : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Two column: Staff + Departments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Staff management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Staff Accounts</h3>
                <p className="text-xs text-gray-500">{staff.filter(s => s.status === 'active').length} active · {staff.filter(s => s.status === 'inactive').length} inactive</p>
              </div>
              <button
                onClick={() => { setStaffError(''); setShowAddStaff(true) }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Staff
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {staff.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">{loading ? 'Loading staff…' : 'No staff accounts yet.'}</p>
              ) : staff.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge[s.role] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>{roleLabel(s.role)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => toggleStaff(s.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {s.status === 'active'
                        ? <ToggleRight className="w-6 h-6 text-blue-600" />
                        : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                    </button>
                    <button onClick={() => removeStaff(s.id)} className="text-gray-300 hover:text-red-600 transition-colors" title="Remove staff account">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Departments</h3>
                <p className="text-xs text-gray-500">{departments.filter(d => d.active).length} active departments</p>
              </div>
              <button
                onClick={() => { setDeptError(''); setShowAddDept(true) }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Department
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {departments.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">{loading ? 'Loading departments…' : 'No departments configured yet.'}</p>
              ) : departments.map(d => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${d.active ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-200'}`}>
                    <Building2 className={`w-4 h-4 ${d.active ? 'text-blue-700' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${d.active ? 'text-gray-900' : 'text-gray-400'}`}>{d.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleDept(d.id)}>
                      {d.active
                        ? <ToggleRight className="w-6 h-6 text-blue-600" />
                        : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                    </button>
                    <button onClick={() => removeDept(d.id)} className="text-gray-300 hover:text-red-600 transition-colors" title="Remove department">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <Section title="Security & Access" sub="Your admin account credentials">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Admin Email</label>
              <input value={userEmail} disabled type="email" className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">New Password</label>
              <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" type="password" className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
          </div>
          {pwdStatus === 'error' && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{pwdError}</p>
          )}
          {pwdStatus === 'saved' && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Password updated</p>
          )}
          <div className="mt-4 flex gap-3">
            <button onClick={updatePassword} disabled={!newPassword || pwdStatus === 'saving'}
              className="h-10 px-6 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center gap-2">
              <Shield className="w-4 h-4" /> {pwdStatus === 'saving' ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </Section>

      </div>

      {/* Add Staff modal */}
      {showAddStaff && (
        <Modal title="Add Staff Account" onClose={() => setShowAddStaff(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Full Name</label>
              <input
                value={staffForm.name}
                onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jane Mwansa"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Email Address</label>
              <input
                value={staffForm.email}
                onChange={e => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                type="email"
                placeholder="jane@clinic.com"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Phone</label>
                <input
                  value={staffForm.phone}
                  onChange={e => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  type="tel"
                  placeholder="Optional"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Department</label>
              <select
                value={staffForm.department}
                onChange={e => setStaffForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            {staffError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{staffError}</p>
            )}
            <button
              onClick={submitAddStaff}
              disabled={staffSaving}
              className="w-full h-10 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {staffSaving ? 'Creating…' : 'Create Staff Account'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Department modal */}
      {showAddDept && (
        <Modal title="Add Department" onClose={() => setShowAddDept(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Department Name</label>
              <input
                value={deptForm.name}
                onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Cardiology"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Description</label>
              <textarea
                value={deptForm.description}
                onChange={e => setDeptForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>
            {deptError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{deptError}</p>
            )}
            <button
              onClick={submitAddDept}
              disabled={deptSaving}
              className="w-full h-10 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {deptSaving ? 'Creating…' : 'Create Department'}
            </button>
          </div>
        </Modal>
      )}

      {/* New staff temp-password banner */}
      {newStaffCredentials && (
        <Modal title="Staff Account Created" onClose={() => setNewStaffCredentials(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share these one-time credentials with the new staff member. They should change the password after signing in.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-mono text-gray-900">{newStaffCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-gray-900">{newStaffCredentials.password}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(newStaffCredentials.password)}
                    className="text-gray-400 hover:text-blue-700 transition-colors"
                    title="Copy password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setNewStaffCredentials(null)}
              className="w-full h-10 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-all"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
