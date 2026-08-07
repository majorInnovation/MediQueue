'use client'

import React, { useState, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  change?: number
  icon: LucideIcon
  color?: 'blue' | 'emerald' | 'orange' | 'purple' | 'red'
  subtitle?: string
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  subtitle,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Animate number counter
  useEffect(() => {
    let current = 0
    const increment = Math.ceil(value / 50)
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, 30)
    return () => clearInterval(timer)
  }, [value])

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }

  const borderColor = {
    blue: 'border-blue-200 dark:border-blue-800',
    emerald: 'border-emerald-200 dark:border-emerald-800',
    orange: 'border-orange-200 dark:border-orange-800',
    purple: 'border-purple-200 dark:border-purple-800',
    red: 'border-red-200 dark:border-red-800',
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300',
        borderColor[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {displayValue.toLocaleString()}
            </span>
            {change !== undefined && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  change >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg',
            colorClasses[color]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
