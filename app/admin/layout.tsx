'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  UserPlus,
  Activity,
  Calendar,
  BarChart2,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react'

const sidebarNav = [
  { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/admin/register', icon: UserPlus, label: 'Register Patient' },
  { href: '/admin/patients', icon: Users, label: 'Patient Management' },
  { href: '/admin/queue', icon: Users, label: 'Queue Management' },
  { href: '/admin/triage', icon: Activity, label: 'Triage' },
  { href: '/admin/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
  { href: '/admin/sms-logs', icon: MessageSquare, label: 'SMS Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

const bottomNav = [
  { href: '/admin/dashboard', icon: Home, label: 'Home' },
  { href: '/admin/queue', icon: Users, label: 'Queue' },
  { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    window.location.href = '/api/auth/logout'
  }

  // On mobile default to closed; on desktop default to open
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  // Close drawer when navigating on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col w-64 bg-blue-900 min-h-screen fixed left-0 top-0 bottom-0 z-40 shadow-xl
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo + close button */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="9" y="2" width="4" height="18" rx="2" fill="#1e3a8a" />
                <rect x="2" y="9" width="18" height="4" rx="2" fill="#1e3a8a" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">MediQueue</p>
              <p className="text-blue-300 text-xs">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-300 hover:bg-blue-800 hover:text-white transition-all flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {sidebarNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-blue-800' : 'text-blue-300 group-hover:text-white'}`} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* System status */}
        <div className="px-4 py-3 border-t border-blue-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-800/60">
            <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">Admin Mode</p>
              <p className="text-xs text-blue-300">Full access enabled</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="px-3 pb-5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5 text-blue-300" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Floating hamburger (shown when sidebar is closed) ──────────────── */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-50 w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* ── Content wrapper ────────────────────────────────────────────────── */}
      <div
        className={`flex-1 min-h-screen flex flex-col pb-16 lg:pb-0 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}
      >
        {children}
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {/* Hamburger as first item on mobile */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1.5"
          >
            <div className={`p-1.5 rounded-xl transition-colors ${sidebarOpen ? 'bg-blue-100' : ''}`}>
              <Menu className={`w-5 h-5 ${sidebarOpen ? 'text-blue-800' : 'text-gray-400'}`} />
            </div>
            <span className={`text-[10px] font-semibold ${sidebarOpen ? 'text-blue-800' : 'text-gray-400'}`}>
              Menu
            </span>
          </button>

          {bottomNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 flex-1 py-1.5"
              >
                <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-blue-100' : ''}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-800' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-blue-800' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
