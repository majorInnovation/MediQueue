'use client'

import React from 'react'
import Link from 'next/link'
import { Phone, BarChart2, Users, ClipboardList, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminQuickActions({ onCallNext, callDisabled }: { onCallNext?: () => void; callDisabled?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-bold text-gray-900">Quick Actions</p>
          <p className="text-xs text-gray-500">Jump straight to the most common tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Link href="/admin/register">
          <Button type="button" className="w-full rounded-xl h-11 justify-start gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="text-sm font-semibold">Register Patient</span>
          </Button>
        </Link>

        <Button
          type="button"
          onClick={onCallNext}
          disabled={callDisabled}
          variant="outline"
          className="w-full rounded-xl h-11 justify-start gap-2"
        >
          <Phone className="w-4 h-4" />
          <span className="text-sm font-semibold">Call Next Patient</span>
        </Button>

        <Link href="/admin/queue">
          <Button type="button" variant="outline" className="w-full rounded-xl h-11 justify-start gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-semibold">View Queue</span>
          </Button>
        </Link>

        <Link href="/admin/reports">
          <Button type="button" variant="outline" className="w-full rounded-xl h-11 justify-start gap-2">
            <BarChart2 className="w-4 h-4" />
            <span className="text-sm font-semibold">View Reports</span>
          </Button>
        </Link>

        <Link href="/admin/settings">
          <Button type="button" variant="outline" className="w-full rounded-xl h-11 justify-start gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Manage Staff</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
