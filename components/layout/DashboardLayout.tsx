'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNavBar } from './TopNavBar'
import { SmartStatusStrip } from './SmartStatusStrip'
import { MiniQueueTicker } from './MiniQueueTicker'
import { NotificationHub } from './NotificationHub'
import { BreadcrumbTrail } from './BreadcrumbTrail'
import { AIChatDrawer } from './AIChatDrawer'
import { fetchLiveStatus, type QueueLiveStatus } from '@/lib/api/patient'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'administrator' | 'receptionist' | 'nurse' | 'doctor' | 'patient'
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [liveStatus, setLiveStatus] = useState<QueueLiveStatus | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('mq-theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = storedTheme ?? (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadLiveStatus() {
      const status = await fetchLiveStatus()
      if (mounted) {
        setLiveStatus(status)
      }
    }

    loadLiveStatus()
    const interval = setInterval(loadLiveStatus, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    window.localStorage.setItem('mq-theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  const containerClasses = useMemo(
    () =>
      `min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(14,124,184,0.15),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_var(--background)_0%,_rgba(14,124,184,0.03)_45%,_var(--background)_100%)] ${
        theme === 'dark' ? 'dark' : ''
      }`,
    [theme],
  )

  return (
    <div className={containerClasses}>
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} role={role} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavBar
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            theme={theme}
            onThemeToggle={toggleTheme}
            onNotificationsClick={() => setNotificationsOpen(true)}
            onChatClick={() => setChatOpen(true)}
            liveStatus={liveStatus}
          />
          <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="glass-panel p-6 lg:p-8 min-h-[calc(100vh-4rem)] space-y-6">
              <SmartStatusStrip status={liveStatus} />
              <BreadcrumbTrail status={liveStatus} />
              <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <div>{children}</div>
                <MiniQueueTicker status={liveStatus} />
              </div>
            </div>
          </main>
        </div>
      </div>

      <NotificationHub open={notificationsOpen} onClose={() => setNotificationsOpen(false)} notifications={null} />
      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
