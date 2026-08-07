'use client'

import React from 'react'
import Link from 'next/link'
import {
  Calendar,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  role: 'administrator' | 'receptionist' | 'nurse' | 'doctor' | 'patient'
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const getDashboardHref = (role: SidebarProps['role']) => {
  switch (role) {
    case 'administrator':
      return '/admin/dashboard'
    case 'receptionist':
      return '/receptionist/dashboard'
    case 'nurse':
      return '/nurse/dashboard'
    case 'doctor':
      return '/doctor/dashboard'
    case 'patient':
      return '/patient/dashboard'
    default:
      return '/dashboard'
  }
}

export function Sidebar({ isOpen, role, onClose }: SidebarProps) {
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: getDashboardHref(role),
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['administrator', 'receptionist', 'nurse', 'doctor', 'patient'],
    },
    {
      label: 'Appointments',
      href: '/appointments',
      icon: <Calendar className="w-5 h-5" />,
      roles: ['patient'],
    },
    {
      label: 'Queue Status',
      href: '/queue',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['patient'],
    },
    {
      label: 'Register Patient',
      href: '/admin/queue',
      icon: <UserPlus className="w-5 h-5" />,
      roles: ['receptionist', 'nurse'],
    },
    {
      label: 'Queue Management',
      href: '/queue',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['receptionist', 'nurse'],
    },
    {
      label: 'Triage Assessment',
      href: '/triage',
      icon: <Users className="w-5 h-5" />,
      roles: ['nurse'],
    },
    {
      label: 'Staff Management',
      href: '/staff',
      icon: <Users className="w-5 h-5" />,
      roles: ['administrator'],
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['administrator'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['administrator'],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col w-72 bg-[#0F172A] border-r border-[#1E293B] transition-all duration-300',
          !isOpen && 'w-20'
        )}
      >


        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-[#1E293B]">

          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white flex items-center justify-center text-lg font-bold">
            ✚
          </div>
          {isOpen && (
            <div className="leading-tight">
              <span className="block text-xl font-bold text-white">MediQueue Admin</span>
              <span className="block text-xs text-blue-100/80">Smart Clinic Queue System</span>
            </div>
          )}
        </div>


        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200/90 hover:bg-white/5 hover:text-white transition-colors"
              title={!isOpen ? item.label : undefined}

            >
              {item.icon}
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#1E293B] space-y-2">
          <div
            className="flex items-center gap-3 px-4 py-3"

            title={!isOpen ? 'Admin profile' : undefined}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center font-bold">
              AD
            </div>

            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin • Dr. Sarah</p>
                <p className="text-xs text-slate-300/80 capitalize">{role}</p>

              </div>
            )}
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-200/90 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            {isOpen && 'Logout'}
          </button>

        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-screen w-64 bg-[#0F172A] border-r border-[#1E293B] transform transition-transform duration-300 z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
      <div className="p-6 flex items-center justify-between border-b border-[#1E293B]">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white flex items-center justify-center text-lg">
              ⚕️
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              MediQueue
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        <nav className="p-4 space-y-2">

          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-200/90 hover:bg-white/5 hover:text-white transition-colors"

            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-200/90 hover:bg-red-500/10 hover:text-red-200 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
