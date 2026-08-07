'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Pill,
  Stethoscope,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showNotifications, setShowNotifications] = useState(false)

  const appointments = [
    {
      id: 1,
      patient: 'James Michael',
      time: '10:30 AM',
      type: 'Consultation',
      status: 'confirmed',
      notes: 'Flu-like symptoms',
    },
    {
      id: 2,
      patient: 'Sarah Johnson',
      time: '11:00 AM',
      type: 'Follow-up',
      status: 'pending',
      notes: 'Post-surgery review',
    },
    {
      id: 3,
      patient: 'Robert Smith',
      time: '2:00 PM',
      type: 'Consultation',
      status: 'confirmed',
      notes: 'Back pain assessment',
    },
  ]

  const patients = [
    { id: 1, name: 'James Michael', status: 'In Waiting', priority: 'high', room: '101' },
    { id: 2, name: 'Sarah Johnson', status: 'Ready for Review', priority: 'medium', room: '102' },
    { id: 3, name: 'David Brown', status: 'In Waiting', priority: 'low', room: '103' },
  ]

  const stats = [
    { label: 'Today\'s Appointments', value: '8', icon: Calendar, color: 'bg-blue-100 dark:bg-blue-900' },
    { label: 'Pending Reviews', value: '3', icon: AlertCircle, color: 'bg-amber-100 dark:bg-amber-900' },
    { label: 'Completed Today', value: '5', icon: CheckCircle, color: 'bg-emerald-100 dark:bg-emerald-900' },
    { label: 'Avg. Consultation', value: '22m', icon: Clock, color: 'bg-purple-100 dark:bg-purple-900' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Doctor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, Dr. Sarah Chen</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
            SC
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Appointments
            </h2>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-semibold flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((apt, i) => (
              <motion.div
                key={i}
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all cursor-pointer"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{apt.patient}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{apt.notes}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    apt.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {apt.time}
                  </span>
                  <span>{apt.type}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Patients Waiting */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-600" />
            Patients Waiting
          </h2>

          <div className="space-y-3">
            {patients.map((patient, i) => (
              <motion.div
                key={i}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{patient.name}</h3>
                  <span className={`w-2 h-2 rounded-full ${
                    patient.priority === 'high' ? 'bg-red-500' : patient.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{patient.status}</p>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Room {patient.room}</span>
                  <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold">
                    Call
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Patient Records */}
      <motion.div
        className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Pill, label: 'Prescribe', color: 'blue' },
            { icon: MessageSquare, label: 'Message Patient', color: 'purple' },
            { icon: TrendingUp, label: 'View History', color: 'emerald' },
            { icon: Settings, label: 'Settings', color: 'gray' },
          ].map((action, i) => (
            <motion.button
              key={i}
              className={`p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center gap-2`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
