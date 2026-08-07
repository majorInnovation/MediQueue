'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Heart,
  Zap,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function NurseDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const patients = [
    {
      id: 1,
      name: 'James Michael',
      queueNumber: 'Q-0147',
      status: 'vitals-pending',
      temp: 37.2,
      bp: '120/80',
      hr: 72,
      priority: 'low',
      symptoms: ['Cough', 'Fever'],
      room: '101',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      queueNumber: 'Q-0148',
      status: 'triage-complete',
      temp: 38.5,
      bp: '125/82',
      hr: 88,
      priority: 'high',
      symptoms: ['High fever', 'Body ache'],
      room: '102',
    },
    {
      id: 3,
      name: 'David Brown',
      queueNumber: 'Q-0149',
      status: 'vitals-pending',
      temp: 37.0,
      bp: '118/78',
      hr: 70,
      priority: 'medium',
      symptoms: ['Headache', 'Nausea'],
      room: '103',
    },
    {
      id: 4,
      name: 'Emma Davis',
      queueNumber: 'Q-0150',
      status: 'vitals-pending',
      temp: 36.8,
      bp: '122/80',
      hr: 75,
      priority: 'critical',
      symptoms: ['Chest pain', 'Shortness of breath'],
      room: '104',
    },
  ]

  const triageStats = [
    { label: 'Patients Today', value: '42', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Pending Vitals', value: '3', icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: 'Completed Triage', value: '39', icon: CheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Critical Cases', value: '2', icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
      case 'high':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
      default:
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    if (status === 'vitals-pending') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    if (status === 'triage-complete') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Triage Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })} - Patient Assessment & Vitals Management
          </p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          New Patient
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {triageStats.map((stat, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Patients Queue */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Patients</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {patients.map((patient, i) => (
            <motion.div
              key={i}
              className={`p-4 rounded-lg border-2 ${getPriorityColor(patient.priority)} cursor-pointer hover:shadow-md transition-all`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ x: 5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Patient Info */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">{patient.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded font-semibold border ${getStatusBadgeColor(patient.status)}`}>
                      {patient.status === 'vitals-pending' ? 'Vitals Pending' : 'Triage Done'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{patient.queueNumber} • Room {patient.room}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {patient.symptoms.map((symptom, j) => (
                      <span key={j} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vitals */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Temp
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{patient.temp}°C</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      BP
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{patient.bp}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      HR
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{patient.hr}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center justify-end">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Complete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
