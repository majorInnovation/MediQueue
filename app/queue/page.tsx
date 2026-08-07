import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { QueueList } from '@/components/queue/QueueList'

export const metadata = {
  title: 'Queue Management - Medical Queue System',
  description: 'Real-time patient queue display and management',
}

export default function QueuePage() {
  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
            Queue Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time queue status and patient management
          </p>
        </div>

        <QueueList />
      </div>
    </DashboardLayout>
  )
}
