import React from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TriageWorkspace } from '@/components/triage/TriageWorkspace'

export const metadata = {
  title: 'Triage Assessment - Medical Queue System',
  description: 'Patient triage and priority assessment',
}

export default function TriagePage() {
  return (
    <DashboardLayout role="nurse">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-balance">
            Triage Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Assess patient symptoms and assign priority level
          </p>
        </div>

        <TriageWorkspace />
      </div>
    </DashboardLayout>
  )
}
