import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard - Medical Queue System',
  description: 'View queue statistics and key metrics',
}

export default function DashboardPage() {
  return (
    <DashboardLayout role="administrator">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Queue Management System - Real-time Overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Total Patients
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
              128
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ↑ 12% from yesterday
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Patients Waiting
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
              23
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              ↓ 5 from last hour
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Avg Wait Time
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
              12m
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ↓ 3m improvement
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Critical Cases
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
              3
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Requires attention
            </p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Welcome to MediQueue</h2>
          <p className="text-blue-100 mb-4">
            A professional healthcare queue and triage management system. Navigate through the sidebar to access different features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <p className="font-semibold mb-2">Quick Links</p>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Register Patient</li>
                <li>• Manage Queue</li>
                <li>• View Reports</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Key Stats</p>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• System Uptime: 99.9%</li>
                <li>• Active Users: 8</li>
                <li>• Total Patients: 3,247</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Demo Info</p>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Role: Administrator</li>
                <li>• All features enabled</li>
                <li>• Sample data included</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
