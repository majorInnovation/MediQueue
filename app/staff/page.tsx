import React from 'react'
import { Plus, Edit, Trash2, CheckCircle, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import type { User } from '@/lib/types'

// Sample staff data
const staffList: User[] = [
  {
    id: '1',
    name: 'Dr. Sarah Smith',
    email: 'sarah@clinic.com',
    phone: '0961234567',
    role: 'administrator',
    lastLogin: new Date(Date.now() - 30 * 60000),
    status: 'active',
  },
  {
    id: '2',
    name: 'Mary Johnson',
    email: 'mary@clinic.com',
    phone: '0971234567',
    role: 'receptionist',
    lastLogin: new Date(Date.now() - 5 * 60000),
    status: 'active',
  },
  {
    id: '3',
    name: 'James Brown',
    email: 'james@clinic.com',
    phone: '0975678901',
    role: 'nurse',
    lastLogin: new Date(Date.now() - 2 * 60000),
    status: 'active',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@clinic.com',
    phone: '0968901234',
    role: 'nurse',
    lastLogin: new Date(Date.now() - 24 * 60 * 60000),
    status: 'inactive',
  },
]

export const metadata = {
  title: 'Staff Management - Medical Queue System',
  description: 'Manage clinic staff and roles',
}

export default function StaffPage() {
  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const formatLastLogin = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <DashboardLayout role="administrator">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
              Staff Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage clinic staff, roles, and permissions
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg">
            <Plus className="w-5 h-5" />
            Add Staff Member
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active Staff
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {staffList.length} staff members total
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {staff.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {staff.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {staff.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                          staff.status
                        )}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        {staff.status === 'active' ? (
                          <Clock className="w-4 h-4" />
                        ) : null}
                        {formatLastLogin(staff.lastLogin)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Administrator
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <li>✓ Full system access</li>
              <li>✓ Staff management</li>
              <li>✓ Reports & analytics</li>
              <li>✓ Settings</li>
            </ul>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-3">
              Receptionist
            </h3>
            <ul className="text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
              <li>✓ Patient registration</li>
              <li>✓ Queue management</li>
              <li>✓ Search patients</li>
              <li>✓ Print queue slips</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Nurse/Triage
            </h3>
            <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-2">
              <li>✓ Triage assessment</li>
              <li>✓ Priority assignment</li>
              <li>✓ Patient queue</li>
              <li>✓ Medical notes</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
