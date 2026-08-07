'use client'

import React from 'react'
import {
  UserCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface Activity {
  id: string
  type: 'registration' | 'call' | 'completed' | 'alert' | 'sms' | 'queue'
  title: string
  description: string
  time: Date
  user?: string
}

export function ActivityFeed() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'registration',
      title: 'Patient Registered',
      description: 'Jane Doe (Q0127) registered for general consultation',
      time: new Date(Date.now() - 2 * 60000),
      user: 'Receptionist - Mary',
    },
    {
      id: '2',
      type: 'alert',
      title: 'Critical Case Alert',
      description: 'Patient Q0125 flagged as critical - High fever & respiratory issues',
      time: new Date(Date.now() - 5 * 60000),
      user: 'Nurse Triage',
    },
    {
      id: '3',
      type: 'completed',
      title: 'Consultation Completed',
      description: 'Patient Q0118 consultation completed by Dr. John',
      time: new Date(Date.now() - 10 * 60000),
      user: 'Dr. John',
    },
    {
      id: '4',
      type: 'call',
      title: 'Patient Called',
      description: 'Patient Q0124 called for consultation',
      time: new Date(Date.now() - 15 * 60000),
      user: 'System',
    },
    {
      id: '5',
      type: 'sms',
      title: 'SMS Notification Sent',
      description: '45 appointment reminders sent to registered patients',
      time: new Date(Date.now() - 20 * 60000),
    },
  ]

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'registration':
        return <UserCheck className="w-5 h-5 text-blue-600" />
      case 'call':
        return <Phone className="w-5 h-5 text-orange-600" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-purple-600" />
      case 'queue':
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatTime(activity.time)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {activity.description}
                </p>
                {activity.user && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    By: {activity.user}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 text-center">
        <a
          href="/activity"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          View all activity
        </a>
      </div>
    </div>
  )
}
