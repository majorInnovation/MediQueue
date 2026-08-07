'use client'

import React from 'react'

export function QueueChart() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Patient Queue Trend
      </h3>
      
      {/* Simple placeholder chart */}
      <div className="h-64 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-lg flex items-end justify-between p-4 gap-2">
        {[65, 78, 45, 82, 90, 72, 88, 95, 110, 100, 89, 78].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 cursor-pointer shadow-sm"
            style={{ height: `${(height / 110) * 100}%` }}
            title={`${height} patients`}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Peak</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">110</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">84</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Current</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">78</p>
        </div>
      </div>
    </div>
  )
}
