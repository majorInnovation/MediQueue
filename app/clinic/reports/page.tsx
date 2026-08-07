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
  Download,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function ReportsPage() {
  const router = useRouter()
  const [reportType, setReportType] = useState('daily')
  const [dateRange, setDateRange] = useState('week')

  // Mock data for charts
  const dailyData = [
    { date: 'Mon', patients: 32, completed: 28, waiting: 4 },
    { date: 'Tue', patients: 45, completed: 42, waiting: 3 },
    { date: 'Wed', patients: 38, completed: 35, waiting: 3 },
    { date: 'Thu', patients: 52, completed: 48, waiting: 4 },
    { date: 'Fri', patients: 41, completed: 39, waiting: 2 },
    { date: 'Sat', patients: 28, completed: 26, waiting: 2 },
    { date: 'Sun', patients: 15, completed: 15, waiting: 0 },
  ]

  const priorityData = [
    { name: 'High Priority', value: 35, color: '#EF4444' },
    { name: 'Medium Priority', value: 48, color: '#F59E0B' },
    { name: 'Low Priority', value: 17, color: '#22C55E' },
  ]

  const handleLogout = () => {
    router.push('/')
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
          <a href="/clinic/reports" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Performance metrics and statistics</p>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all">
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Consultations</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">251</p>
              <p className="text-xs text-emerald-600 mt-2">↑ 12% from last week</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Avg. Wait Time</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">24 min</p>
              <p className="text-xs text-red-600 mt-2">↓ Decreased</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Patient Satisfaction</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">4.6/5</p>
              <p className="text-xs text-emerald-600 mt-2">↑ Improved</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">No-Shows</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">8%</p>
              <p className="text-xs text-amber-600 mt-2">↑ Slightly higher</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Patient Volume Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Patient Volume (Weekly)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="completed" fill="#22c55e" />
                  <Bar dataKey="waiting" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Patient Trend (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#0ea5e9" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  )
}
