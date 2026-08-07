'use client'

import React, { useState } from 'react'
import { Menu, Bell, Settings, Sun, Moon, ChevronDown, MessageSquareText } from 'lucide-react'

interface TopNavBarProps {
  onMenuClick: () => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onNotificationsClick: () => void
  onChatClick: () => void
  liveStatus: {
    unreadAlerts: number
  } | null
}

export function TopNavBar({ onMenuClick, theme, onThemeToggle, onNotificationsClick, onChatClick, liveStatus }: TopNavBarProps) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-800 dark:text-white" />
        </button>
        <div className="hidden md:flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 shadow-sm">
          <input
            type="text"
            placeholder="Search patients, appointments, queue..."
            className="bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-slate-800" />
          ) : (
            <Sun className="w-5 h-5 text-slate-100" />
          )}
        </button>

        <button
          onClick={onNotificationsClick}
          className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="w-5 h-5 text-slate-800 dark:text-white" />
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {liveStatus?.unreadAlerts ?? 0}
          </span>
        </button>

        <button
          onClick={onChatClick}
          className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          aria-label="Open AI assistant"
        >
          <MessageSquareText className="w-5 h-5" />
        </button>

        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors">
          <Settings className="w-5 h-5 text-slate-800 dark:text-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center font-bold">
              SA
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Dr. Sarah</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Clinic Lead</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl shadow-slate-900/10 z-50 py-2">
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm text-slate-700 dark:text-slate-200">
                Profile
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm text-slate-700 dark:text-slate-200">
                Notifications
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm text-slate-700 dark:text-slate-200">
                Help Center
              </button>
              <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
              <button className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-sm font-semibold text-rose-600">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
