'use client'

import React, { useMemo } from 'react'
import { useId } from 'react'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'

type Priority = 'High' | 'Medium' | 'Low'

interface AdminQueueOverviewProps {
  waitingTotal: number
  byPriority: { High: number; Medium: number; Low: number }
}

const colors: Record<Priority, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E',
}

export function AdminQueueOverview({ waitingTotal, byPriority }: AdminQueueOverviewProps) {
  const id = useId()

  const data = useMemo(
    () =>
      (['High', 'Medium', 'Low'] as Priority[]).map((p) => ({
        name: p,
        value: byPriority[p],
      })),
    [byPriority],
  )

  const total = data.reduce((a, b) => a + b.value, 0) || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">Queue Overview</h3>
          <p className="text-xs text-gray-500">Priority breakdown of current waiting patients</p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-4 items-center">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={98}
                  strokeWidth={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={colors[entry.name as Priority]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="-mt-[240px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-500">Total Waiting</p>
                <p className="text-3xl font-bold text-gray-900 leading-none">{waitingTotal}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((d) => {
              const pct = Math.round((d.value / total) * 100)
              return (
                <div key={d.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: colors[d.name as Priority] }} />
                    <p className="text-sm font-semibold text-gray-700">{d.name} Priority</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{d.value}</p>
                    <p className="text-xs text-gray-500">{pct}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
