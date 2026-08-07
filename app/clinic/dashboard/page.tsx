'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  Users,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle,
  Plus,
  Eye,
  X,
  Star,
  Award,
  Settings,
  BarChart3,
  HeartHandshake,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react'
import {
  generateClinicInsights,
  recommendStaffForTask,
  generateTriageRecommendation,
} from '@/lib/smart-features'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'

export default function ClinicDashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
  })

  // Mock Data
  const [staff, setStaff] = useState([
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      role: 'Doctor',
      email: 'sarah@clinic.com',
      phone: '+260 97 111111',
      tasksCompleted: 145,
      avgRating: 4.8,
      specializations: ['General Practice', 'Pediatrics'],
      status: 'on-duty',
    },
    {
      id: '2',
      name: 'Nurse Mary Smith',
      role: 'Nurse',
      email: 'mary@clinic.com',
      phone: '+260 97 222222',
      tasksCompleted: 98,
      avgRating: 4.6,
      specializations: ['Triage', 'Injections'],
      status: 'on-duty',
    },
    {
      id: '3',
      name: 'John Mwanzi',
      role: 'Receptionist',
      email: 'john@clinic.com',
      phone: '+260 97 333333',
      tasksCompleted: 234,
      avgRating: 4.7,
      specializations: ['Patient Registration', 'Scheduling'],
      status: 'on-duty',
    },
  ])

  const clinicStats = {
    totalPatients: 128,
    nowServing: 'A-012',
    waitingPatients: 24,
    avgWaitTime: '28 - 30 mins',
    smsNotifications: 126,
    completedToday: 104,
  }

  // Queue data by priority
  const queueByPriority = {
    High: 8,
    Medium: 10,
    Low: 6,
  }

  // Mock live queue data
  const liveQueue = [
    { id: 'A-012', priority: 'High', status: 'Calling', waitTime: '2 mins' },
    { id: 'A-013', priority: 'Medium', status: 'Waiting', waitTime: '15 mins' },
    { id: 'A-014', priority: 'High', status: 'Waiting', waitTime: '20 mins' },
    { id: 'A-015', priority: 'Low', status: 'Waiting', waitTime: '25 mins' },
    { id: 'A-016', priority: 'Medium', status: 'Waiting', waitTime: '28 mins' },
  ]

  // Mock recent triage
  const recentTriage = [
    { time: '09:20 AM', patient: 'Joan Dota Crus', priority: 'High', reason: 'Fever' },
    { time: '09:10 AM', patient: 'Maria Samoos', priority: 'Medium', reason: 'Cough' },
    { time: '09:00 AM', patient: 'Pedro Rayes', priority: 'Low', reason: 'Check-up' },
  ]

  // Mock SMS notifications
  const smsNotifications = [
    { time: '3:45 AM', type: 'Registration / Queue Confirmation', message: 'City Health Clinic: Your queue number is A-015. Priority: HIGH. Est. waiting time: 20-30 mins' },
    { time: '3:50 AM', type: 'Almost Your Turn', message: 'City Health Clinic: You are next in line (A-015). Please proceed to waiting area.' },
    { time: '9:50 AM', type: 'Now Serving', message: 'City Health Clinic: Your queue number A-015 is now being served. Please proceed to the consultation room.' },
  ]

  // Generate smart insights
  const insights = useMemo(
    () =>
      generateClinicInsights(
        clinicStats.totalPatients,
        clinicStats.waitingPatients,
        parseInt(clinicStats.avgWaitTime),
        staff.length,
      ),
    [clinicStats],
  )

  // Get staff recommendations for triage
  const triageRecommendations = useMemo(
    () => recommendStaffForTask(staff, 'triage'),
    [staff],
  )

  const handleAddStaff = () => {
    if (newStaff.name && newStaff.role) {
      const addedStaff = {
        id: String(staff.length + 1),
        ...newStaff,
        tasksCompleted: 0,
        avgRating: 0,
        specializations: [],
        status: 'on-duty',
      }
      setStaff([...staff, addedStaff])
      setNewStaff({ name: '', role: '', email: '', phone: '' })
      setShowAddStaffModal(false)
    }
  }

  const handleLogout = () => {
    router.push('/')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#EF4444'
      case 'Medium':
        return '#F59E0B'
      case 'Low':
        return '#22C55E'
      default:
        return '#6B7280'
    }
  }

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'Medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'Low':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const chartData = Object.entries(queueByPriority).map(([name, value]) => ({
    name,
    value,
  }))

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
          <a href="/clinic/dashboard" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
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
          <a href="/clinic/sms-logs" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
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
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Central Health Clinic - Queue Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Now Serving</p>
                <p className="text-2xl font-bold text-emerald-600">{clinicStats.nowServing}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {/* Total Patients */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Patients Today</span>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{clinicStats.totalPatients}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">+12% from yesterday</p>
            </div>

            {/* Now Serving */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Now Serving</span>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{clinicStats.nowServing}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">General Consultation</p>
            </div>

            {/* Waiting Patients */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Waiting Patients</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{clinicStats.waitingPatients}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">In queue</p>
            </div>

            {/* Avg Wait Time */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Average Waiting Time</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{clinicStats.avgWaitTime}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Estimated</p>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">SMS Today</span>
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{clinicStats.smsNotifications}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">+2% increase</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Queue Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Queue Overview</h3>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPriorityColor(entry.name)} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getPriorityColor(item.name) }}></div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.name} Priority</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Queue */}
            <div className="col-span-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Live Queue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Queue #</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Priority</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveQueue.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{item.id}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityBgColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{item.status}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{item.waitTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Triage & SMS Notifications */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Triage */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Triage</h3>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</a>
              </div>
              <div className="space-y-3">
                {recentTriage.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                      <p className="font-medium text-slate-900 dark:text-white">{item.patient}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.reason}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityBgColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS Notifications Center */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">SMS Notifications (Today)</h3>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View Logs</a>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {smsNotifications.map((sms, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">{sms.type}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{sms.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{sms.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
