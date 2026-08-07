'use client'

import React, { useState } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { cn } from '@/lib/utils'

type SettingsTab = 'clinic' | 'sms' | 'voice' | 'general'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('clinic')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'clinic' as const, label: 'Clinic Settings', icon: '🏥' },
    { id: 'sms' as const, label: 'SMS Configuration', icon: '💬' },
    { id: 'voice' as const, label: 'Voice Settings', icon: '🔊' },
    { id: 'general' as const, label: 'General Settings', icon: '⚙️' },
  ]

  return (
    <DashboardLayout role="administrator">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure clinic and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8">
          {/* Clinic Settings */}
          {activeTab === 'clinic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clinic Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    defaultValue="City Medical Center"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="0211234567"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Clinic Address
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Healthcare Avenue, Medical District"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    defaultValue="17:00"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>Africa/Lusaka</option>
                    <option>Africa/Johannesburg</option>
                    <option>Africa/Cairo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SMS Settings */}
          {activeTab === 'sms' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                SMS Configuration
              </h2>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Configure your SMS provider credentials to enable patient notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMS Provider
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>Africa&apos;s Talking</option>
                    <option>AWS SNS</option>
                    <option>African Mobile Networks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sender ID
                  </label>
                  <input
                    type="text"
                    defaultValue="MediQueue"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account SID
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  SMS service is active and operational
                </span>
              </div>
            </div>
          )}

          {/* Voice Settings */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Voice & Announcement Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Announcement Language
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>English</option>
                    <option>French</option>
                    <option>Bemba</option>
                    <option>Nyanja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice Type
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>Female - Natural</option>
                    <option>Male - Natural</option>
                    <option>Female - Standard</option>
                    <option>Male - Standard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Volume Level
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repeat Count
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option>1 time</option>
                    <option>2 times</option>
                    <option>3 times</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Announcement Template
                </label>
                <textarea
                  defaultValue="Patient {QUEUE_NUMBER} please proceed to room {ROOM_NUMBER}"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  rows={3}
                />
              </div>

              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Test Voice
              </button>
            </div>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                General Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Dark Mode
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable dark mode for the interface
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive email alerts for critical events
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Queue Display Auto-Refresh
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically refresh queue display every 30 seconds
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
