'use client'

import React, { useState } from 'react'
import {
  Phone,
  Users,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  MapPin,
  Mail,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ReceptionistDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)

  const todayStats = [
    { label: 'Check-ins', value: '34', icon: Phone, color: 'from-blue-500 to-blue-600' },
    { label: 'Registrations', value: '12', icon: Plus, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Appointments', value: '28', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { label: 'Waiting', value: '8', icon: Clock, color: 'from-amber-500 to-amber-600' },
  ]

  const recentCheckIns = [
    {
      id: 1,
      name: 'James Michael',
      time: '09:45 AM',
      type: 'Check-in',
      status: 'in-queue',
      insurance: 'BlueCross',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      time: '10:12 AM',
      type: 'Registration',
      status: 'registered',
      insurance: 'Aetna',
    },
    {
      id: 3,
      name: 'David Brown',
      time: '10:35 AM',
      type: 'Check-in',
      status: 'in-queue',
      insurance: 'United',
    },
    {
      id: 4,
      name: 'Emma Davis',
      time: '11:02 AM',
      type: 'Registration',
      status: 'registered',
      insurance: 'Humana',
    },
  ]

  const appointments = [
    {
      id: 1,
      patient: 'John Smith',
      time: '2:00 PM',
      doctor: 'Dr. Sarah Chen',
      status: 'confirmed',
      type: 'Consultation',
    },
    {
      id: 2,
      patient: 'Lisa Anderson',
      time: '2:30 PM',
      doctor: 'Dr. Michael Johnson',
      status: 'pending',
      type: 'Follow-up',
    },
    {
      id: 3,
      patient: 'Tom Wilson',
      time: '3:00 PM',
      doctor: 'Dr. Sarah Chen',
      status: 'confirmed',
      type: 'Consultation',
    },
  ]

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
            Reception Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Patient Check-in & Appointment Management</p>
        </div>
        <button
          onClick={() => setShowNewPatientModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          New Check-in
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {todayStats.map((stat, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Check-ins */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Check-ins</h2>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold text-sm">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentCheckIns.map((checkIn, i) => (
              <motion.div
                key={i}
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition-all"
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{checkIn.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {checkIn.time}
                      </span>
                      <span>{checkIn.type}</span>
                      <span>{checkIn.insurance}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    checkIn.status === 'in-queue'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {checkIn.status === 'in-queue' ? 'In Queue' : 'Registered'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Search */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold mb-2 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Mark Appointment Done
          </button>

          <button className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold mb-2 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Phone className="w-5 h-5 inline mr-2" />
            Call Patient
          </button>

          <button className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            Reschedule
          </button>
        </motion.div>
      </div>

      {/* Upcoming Appointments */}
      <motion.div
        className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Appointments</h2>

        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <motion.div
              key={i}
              className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all"
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{apt.patient}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {apt.time}
                    </span>
                    <span>{apt.type}</span>
                    <span>{apt.doctor}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  apt.status === 'confirmed'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {apt.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
