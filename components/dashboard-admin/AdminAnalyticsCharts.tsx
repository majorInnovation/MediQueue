'use client'

import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'

export function AdminSmsAnalyticsCard({ data }: { data: { hour: string; sent: number; delivered: number; failed: number; pending: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">SMS Analytics</h3>
        <p className="text-xs text-gray-500">Sent per hour + delivery outcomes</p>
      </div>
      <div className="p-5">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sent" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { label: 'Sent', key: 'sent', color: 'bg-blue-50 text-blue-700' },
            { label: 'Delivered', key: 'delivered', color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Failed', key: 'failed', color: 'bg-rose-50 text-rose-700' },
            { label: 'Pending', key: 'pending', color: 'bg-amber-50 text-amber-800' },
          ].map((m) => {
            const total = data.reduce((a, b) => a + (b as any)[m.key], 0)
            return (
              <div key={m.key} className={`rounded-xl border border-gray-100 p-4 ${m.color}`}>
                <p className="text-xs font-semibold">{m.label}</p>
                <p className="text-2xl font-bold mt-1">{total}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AdminPatientDistributionCard({ data }: { data: { name: string; value: number }[] }) {
  const colors = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4']
  const total = data.reduce((a, b) => a + b.value, 0) || 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Patients by Department</h3>
        <p className="text-xs text-gray-500">Distribution across clinic services</p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-4 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={98} innerRadius={64}>
                  {data.map((d, i) => (
                    <Cell key={d.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {data.map((d, i) => {
              const pct = Math.round((d.value / total) * 100)
              return (
                <div key={d.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                    <p className="text-sm font-semibold text-gray-700">{d.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{pct}%</p>
                    <p className="text-xs text-gray-500">{d.value} patients</p>
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

export function AdminPeakHoursCard({ data }: { data: { hour: string; count: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Peak Hours Analytics</h3>
        <p className="text-xs text-gray-500">Clinic traffic from 6AM to 6PM</p>
      </div>
      <div className="p-5">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
