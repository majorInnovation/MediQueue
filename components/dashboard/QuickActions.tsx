'use client'

import React from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Stethoscope,
  ListCheck,
  Speaker,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickActions() {
  const actions = [
    {
      label: 'Register Patient',
      icon: Plus,
      href: '/admin/queue',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Search Patient',
      icon: Search,
      href: '/patients',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Start Triage',
      icon: Stethoscope,
      href: '/triage',
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'View Queue',
      icon: ListCheck,
      href: '/queue',
      color: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Call Next',
      icon: Speaker,
      href: '/queue?action=call',
      color: 'from-red-500 to-red-600',
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:shadow-lg hover:scale-105',
                `bg-gradient-to-r ${action.color}`
              )}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
