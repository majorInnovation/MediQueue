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
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Filter,
} from 'lucide-react'

export default function TriagePage() {
  const router = useRouter()
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Mock triage data
  const triageRecords = [
    {
      id: '1',
      patientName: 'Joan Dota Crus',
      triageTime: '09:20 AM',
      priority: 'High',
      symptoms: ['Fever', 'Chest Pain'],
      vitals: { BP: '140/90', HR: 95, Temp: 39.2 },
      nurseName: 'Nurse Mary',
      status: 'Completed',
      recommendation: 'Immediate consultation required',
    },
    {
      id: '2',
      patientName: 'Maria Samoos',
      triageTime: '09:10 AM',
      priority: 'Medium',
      symptoms: ['Cough', 'Sore Throat'],
      vitals: { BP: '120/80', HR: 78, Temp: 37.8 },
      nurseName: 'Nurse Sarah',
      status: 'Completed',
      recommendation: 'Standard care pathway',
    },
    {
      id: '3',
      patientName: 'Pedro Rayes',
      triageTime: '09:00 AM',
      priority: 'Low',
      symptoms: ['Routine Check-up'],
      vitals: { BP: '118/76', HR: 72, Temp: 37.0 },
      nurseName: 'Nurse John',
      status: 'Completed',
      recommendation: 'Regular monitoring',
    },
    {
      id: '4',
      patientName: 'Alice Wong',
      triageTime: '08:45 AM',
      priority: 'High',
      symptoms: ['Severe Headache', 'Dizziness'],
      vitals: { BP: '160/100', HR: 105, Temp: 36.8 },
      nurseName: 'Nurse Mary',
      status: 'Pending',
      recommendation: 'Urgent evaluation',
    },
    {
      id: '5',
      patientName: 'David Martinez',
      triageTime: '08:30 AM',
      priority: 'Medium',
      symptoms: ['Back Pain'],
      vitals: { BP: '130/85', HR: 88, Temp: 37.1 },
      nurseName: 'Nurse Sarah',
      status: 'In Progress',
      recommendation: 'Specialist referral',
    },
  ]

  const handleLogout = () => {
    router.push('/')
  }

  const filteredRecords = triageRecords.filter((record) => {
    const matchesPriority = selectedPriority === 'all' || record.priority === selectedPriority
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus
    return matchesPriority && matchesStatus
  })

  const getPriorityColor = (priority: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-amber-600" />
      default:
        return null
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
          <a href="/clinic/triage" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
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
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Triage Management</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Monitor and manage patient triage records</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Triage Records */}
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="grid grid-cols-12 gap-6">
                  {/* Left Column - Patient Info */}
                  <div className="col-span-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{record.patientName}</h3>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <p>
                        <span className="font-medium">Time:</span> {record.triageTime}
                      </p>
                      <p>
                        <span className="font-medium">Nurse:</span> {record.nurseName}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column - Vitals */}
                  <div className="col-span-3">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Vital Signs</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400">BP</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{record.vitals.BP}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400">HR</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{record.vitals.HR}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Temp</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{record.vitals.Temp}°C</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Status & Priority */}
                  <div className="col-span-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Symptoms</h4>
                        <div className="flex flex-wrap gap-2">
                          {record.symptoms.map((symptom, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>{record.priority} Priority</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className="text-sm text-slate-600 dark:text-slate-400">{record.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="font-medium">Recommendation:</span> {record.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
