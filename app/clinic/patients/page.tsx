'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  Users,
  Search,
  Plus,
  Eye,
  MoreVertical,
  Phone,
  Mail,
  Calendar,
  LayoutGrid,
  HeartHandshake,
  BarChart3,
  MessageSquare,
  Settings,
} from 'lucide-react'

export default function PatientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock patient data
  const patients = [
    {
      id: '1',
      name: 'Jane Smith',
      phone: '+260 97 111111',
      email: 'jane@example.com',
      lastVisit: '2026-06-20',
      status: 'Active',
      medicalHistory: ['Hypertension', 'Diabetes'],
      nextAppointment: '2026-06-30',
    },
    {
      id: '2',
      name: 'John Doe',
      phone: '+260 97 222222',
      email: 'john@example.com',
      lastVisit: '2026-06-15',
      status: 'Active',
      medicalHistory: ['Asthma'],
      nextAppointment: '2026-07-05',
    },
    {
      id: '3',
      name: 'Maria Garcia',
      phone: '+260 97 333333',
      email: 'maria@example.com',
      lastVisit: '2026-05-10',
      status: 'Inactive',
      medicalHistory: ['Migraine', 'Anxiety'],
      nextAppointment: null,
    },
    {
      id: '4',
      name: 'Robert Chen',
      phone: '+260 97 444444',
      email: 'robert@example.com',
      lastVisit: '2026-06-22',
      status: 'Active',
      medicalHistory: ['High Cholesterol'],
      nextAppointment: '2026-06-28',
    },
    {
      id: '5',
      name: 'Sarah Wilson',
      phone: '+260 97 555555',
      email: 'sarah@example.com',
      lastVisit: '2026-06-25',
      status: 'Active',
      medicalHistory: ['Back Pain'],
      nextAppointment: '2026-07-10',
    },
  ]

  const handleLogout = () => {
    router.push('/')
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
          <a href="/clinic/patients" className="flex items-center gap-3 px-4 py-3 bg-emerald-600 rounded-lg text-white font-medium transition-all hover:bg-emerald-700">
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patients Management</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">View and manage all registered patients</p>
            </div>
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-all">
              <Plus className="w-5 h-5" />
              Add Patient
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search Patients</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
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
                  <option value="all">All Patients</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Patient Name</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Contact</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Last Visit</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Next Appointment</th>
                    <th className="text-left py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-medium text-slate-900 dark:text-white">{patient.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{patient.medicalHistory.join(', ')}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="w-4 h-4" />
                            {patient.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="w-4 h-4" />
                            {patient.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{patient.lastVisit}</p>
                      </td>
                      <td className="py-4 px-6">
                        {patient.nextAppointment ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {patient.nextAppointment}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-500">No appointment</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            patient.status === 'Active'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-medium">{filteredPatients.length}</span> of <span className="font-medium">{patients.length}</span> patients
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50">
                Previous
              </button>
              <button className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">1</button>
              <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
