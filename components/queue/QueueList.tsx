'use client'

import React from 'react'
import { Clock, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import type { Priority } from '@/lib/types'

interface QueueItem {
  queueNumber: string
  patientName: string
  phone: string
  status: 'waiting' | 'called' | 'consulting' | 'completed' | 'missed'
  priority: Priority
  registeredTime: Date
  estimatedWait: number
}

const queueItems: QueueItem[] = [
  {
    queueNumber: 'QU-001',
    patientName: 'Jane Doe',
    phone: '0976543210',
    status: 'consulting',
    priority: 'medium',
    registeredTime: new Date(Date.now() - 15 * 60000),
    estimatedWait: 2,
  },
  {
    queueNumber: 'QU-002',
    patientName: 'Robert Brown',
    phone: '0975678901',
    status: 'waiting',
    priority: 'low',
    registeredTime: new Date(Date.now() - 8 * 60000),
    estimatedWait: 10,
  },
  {
    queueNumber: 'QU-003',
    patientName: 'Mary Johnson',
    phone: '0968901234',
    status: 'waiting',
    priority: 'high',
    registeredTime: new Date(Date.now() - 5 * 60000),
    estimatedWait: 12,
  },
  {
    queueNumber: 'QU-004',
    patientName: 'David Wilson',
    phone: '0973456789',
    status: 'called',
    priority: 'low',
    registeredTime: new Date(Date.now() - 2 * 60000),
    estimatedWait: 15,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'consulting':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'called':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    case 'waiting':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'missed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100'
  }
}

export function QueueList() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
            Waiting
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {queueItems.filter((q) => q.status === 'waiting').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
            Called
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {queueItems.filter((q) => q.status === 'called').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
            Consulting
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {queueItems.filter((q) => q.status === 'consulting').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
            Avg Wait
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            10m
          </p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Queue #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Est. Wait
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {queueItems.map((item) => (
                <tr
                  key={item.queueNumber}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {item.queueNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.patientName}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm">
                      <Phone className="w-4 h-4" />
                      {item.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={item.priority} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-sm">
                      <Clock className="w-4 h-4" />
                      {item.estimatedWait}m
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Mark Completed">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Skip Patient">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
