'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  Users,
  LayoutGrid,
  HeartHandshake,
  BarChart3,
  MessageSquare,
  Settings as SettingsIcon,
  Save,
  Bell,
  Lock,
  Globe,
  Database,
  Smartphone,
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    clinicName: 'Central Health Clinic',
    clinicPhone: '+260 97 1234567',
    clinicEmail: 'info@clinic.com',
    clinicAddress: 'City Center, Lusaka',
    operatingHours: '08:00 - 17:00',
    timezone: 'UTC+2',
    darkMode: true,
    notifications: true,
    smsApiKey: '••••••••••••••••',
    smsProvider: 'Africa\'s Talking',
  })

  const handleLogout = () => {
    router.push('/')
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold">MediQueue</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="/clinic/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <LayoutGrid className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/clinic/patients" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <Users className="w-5 h-5" />
            Patients
          </a>
          <a href="/clinic/triage" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <HeartHandshake className="w-5 h-5" />
            Triage
          </a>
          <a href="/clinic/reports" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <BarChart3 className="w-5 h-5" />
            Reports
          </a>
          <a href="/clinic/sms-logs" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <MessageSquare className="w-5 h-5" />
            SMS Logs
          </a>
          <a href="/clinic/settings" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings & Configuration</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage clinic settings and system preferences</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'general', label: 'General', icon: Globe },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'sms', label: 'SMS Configuration', icon: Smartphone },
              { id: 'security', label: 'Security', icon: Lock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                  activeTab === id
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-2xl">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">General Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Clinic Name</label>
                  <input
                    type="text"
                    value={settings.clinicName}
                    onChange={(e) => handleSettingChange('clinicName', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                    <input
                      type="text"
                      value={settings.clinicPhone}
                      onChange={(e) => handleSettingChange('clinicPhone', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.clinicEmail}
                      onChange={(e) => handleSettingChange('clinicEmail', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
                  <textarea
                    value={settings.clinicAddress}
                    onChange={(e) => handleSettingChange('clinicAddress', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Operating Hours</label>
                    <input
                      type="text"
                      value={settings.operatingHours}
                      onChange={(e) => handleSettingChange('operatingHours', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>UTC+0</option>
                      <option>UTC+1</option>
                      <option>UTC+2</option>
                      <option>UTC+3</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-2xl">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Enable Notifications</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Receive alerts for important events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Use dark theme throughout the app</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMS Configuration */}
          {activeTab === 'sms' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-2xl">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">SMS Configuration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SMS Provider</label>
                  <select
                    value={settings.smsProvider}
                    onChange={(e) => handleSettingChange('smsProvider', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option>Africa&apos;s Talking</option>
                    <option>AWS SNS</option>
                    <option>Nexmo</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                  <input
                    type="password"
                    value={settings.smsApiKey}
                    onChange={(e) => handleSettingChange('smsApiKey', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-semibold">Note:</span> Make sure your SMS API credentials are correct before saving. Invalid credentials will prevent SMS notifications from being sent.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-2xl">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Change Password</label>
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Last Login:</span> 2026-06-25 at 08:30 AM
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all">
                    Logout All Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex gap-4">
            <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all">
              <Save className="w-5 h-5" />
              Save Changes
            </button>
            <button className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Cancel
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
