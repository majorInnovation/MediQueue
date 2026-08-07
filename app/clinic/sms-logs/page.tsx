'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  Users,
  LayoutGrid,
  HeartHandshake,
  BarChart3,
  MessageSquare,
  Settings,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react'

export default function SMSLogsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock SMS logs
  const smsLogs = [
    {
      id: '1',
      recipient: '+260 97 111111',
      patientName: 'Jane Smith',
      messageType: 'Queue Confirmation',
      message: 'Your queue number is A-012. Priority: HIGH. Est. waiting time: 20-30 mins',
      sentTime: '2026-06-25 03:45 AM',
      status: 'Delivered',
      cost: '$0.05',
    },
    {
      id: '2',
      recipient: '+260 97 222222',
      patientName: 'John Doe',
      messageType: 'Almost Your Turn',
      message: 'You are next in line (A-013). Please proceed to waiting area.',
      sentTime: '2026-06-25 03:50 AM',
      status: 'Delivered',
      cost: '$0.05',
    },
    {
      id: '3',
      recipient: '+260 97 333333',
      patientName: 'Maria Garcia',
      messageType: 'Now Serving',
      message: 'Your queue number A-014 is now being served. Please proceed to consultation room.',
      sentTime: '2026-06-25 03:55 AM',
      status: 'Delivered',
      cost: '$0.05',
    },
    {
      id: '4',
      recipient: '+260 97 444444',
      patientName: 'Robert Chen',
      messageType: 'Appointment Reminder',
      message: 'Reminder: You have an appointment today at 2:00 PM with Dr. Johnson.',
      sentTime: '2026-06-25 08:00 AM',
      status: 'Delivered',
      cost: '$0.05',
    },
    {
      id: '5',
      recipient: '+260 97 555555',
      patientName: 'Sarah Wilson',
      messageType: 'Queue Confirmation',
      message: 'Your queue number is A-015. Priority: MEDIUM. Est. waiting time: 15-20 mins',
      sentTime: '2026-06-25 09:30 AM',
      status: 'Failed',
      cost: '$0.05',
    },
    {
      id: '6',
      recipient: '+260 97 666666',
      patientName: 'Alice Wong',
      messageType: 'Feedback Request',
      message: 'Please rate your experience: https://bit.ly/feedback. Thank you!',
      sentTime: '2026-06-25 10:15 AM',
      status: 'Pending',
      cost: '$0.05',
    },
  ]

  const handleLogout = () => {
    router.push('/')
  }

  const filteredLogs = smsLogs.filter((log) => {
    const matchesSearch =
      log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient.includes(searchTerm) ||
      log.messageType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'Failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'Pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold">MediQueue</h1>
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="/clinic/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <LayoutGrid className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/clinic/patients" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <Users className="w-5 h-5" />
            Patients
          </a>
          <a href="/clinic/triage" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <HeartHandshake className="w-5 h-5" />
            Triage
          </a>
          <a href="/clinic/reports" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <BarChart3 className="w-5 h-5" />
            Reports
          </a>
          <a href="/clinic/sms-logs" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
            <MessageSquare className="w-5 h-5" />
            SMS Logs
          </a>
          <a href="/clinic/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SMS Notification Logs</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">View and track all SMS messages sent</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search SMS Logs</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name, phone, or message type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* SMS Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Patient</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Message Type</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Message</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Sent Time</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-900 dark:text-white">{log.patientName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{log.recipient}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{log.messageType}</span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">{log.message}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{log.sentTime}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>{log.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total SMS Sent</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{smsLogs.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Delivery Rate</p>
              <p className="text-2xl font-bold text-emerald-600">83.3%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">$0.30</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
