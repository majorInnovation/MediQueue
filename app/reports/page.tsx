import React from 'react'
import { Calendar, Download, BarChart3, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export const metadata = {
  title: 'Reports & Analytics - Medical Queue System',
  description: 'Queue analytics and performance reports',
}

export default function ReportsPage() {
  const reportTypes = [
    {
      title: 'Daily Report',
      description: 'Today\'s queue statistics and performance metrics',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      metrics: ['127 patients', '8m avg wait', '94% efficiency'],
    },
    {
      title: 'Weekly Report',
      description: 'Last 7 days performance summary',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      metrics: ['834 patients', '9m avg wait', '91% efficiency'],
    },
    {
      title: 'Monthly Report',
      description: 'Full month analytics and trends',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      metrics: ['3,247 patients', '8m avg wait', '93% efficiency'],
    },
  ]

  return (
    <DashboardLayout role="administrator">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View performance metrics and generate reports
          </p>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <div
                key={report.title}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`bg-gradient-to-r ${report.color} h-24 flex items-end justify-start p-6`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {report.metrics.map((metric, i) => (
                      <div
                        key={i}
                        className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                        {metric}
                      </div>
                    ))}
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Total Patients
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              3,247
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ↑ 12% vs last month
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Avg Wait Time
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              8m
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ↓ 2m improvement
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Critical Cases
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              47
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              1.4% of total
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold">
              Efficiency
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              93%
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              ↑ 3% improvement
            </p>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Patient Flow Trends
          </h3>

          <div className="h-64 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-lg flex items-end justify-between p-4 gap-2">
            {[65, 78, 45, 82, 90, 72, 88, 95, 110, 100, 89, 78, 92, 85, 96].map(
              (height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 cursor-pointer shadow-sm"
                  style={{ height: `${(height / 110) * 100}%` }}
                  title={`Day ${i + 1}: ${height} patients`}
                />
              )
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-xs uppercase font-semibold">
                Peak Day
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                110
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Day 9
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-xs uppercase font-semibold">
                Average
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                87
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Per day
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-xs uppercase font-semibold">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                1,302
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                15 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
