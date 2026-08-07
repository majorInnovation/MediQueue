'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, Zap } from 'lucide-react'
import { QueueNumberDisplay } from '@/components/queue/QueueNumberDisplay'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { calculateRiskScore, determinePriority } from '@/lib/utils'
import type { Priority, Patient } from '@/lib/types'
import { cn } from '@/lib/utils'

// Sample patients waiting for triage
const waitingPatients: Patient[] = [
  {
    id: 'P001',
    fullName: 'Jane Doe',
    nrc: 'NRC123456',
    phone: '0976543210',
    age: 28,
    gender: 'female',
    dob: new Date('1995-03-15'),
    symptoms: ['Headache', 'Fever'],
    chronicConditions: [],
    address: '123 Main Street',
    registrationDate: new Date(),
  },
  {
    id: 'P002',
    fullName: 'Robert Brown',
    nrc: 'NRC345678',
    phone: '0975678901',
    age: 42,
    gender: 'male',
    dob: new Date('1981-09-12'),
    symptoms: ['Cough'],
    chronicConditions: ['Asthma'],
    address: '321 Elm Street',
    registrationDate: new Date(),
  },
  {
    id: 'P003',
    fullName: 'Mary Johnson',
    nrc: 'NRC789012',
    phone: '0968901234',
    age: 35,
    gender: 'female',
    dob: new Date('1988-11-05'),
    pregnancyStatus: 'pregnant',
    symptoms: ['Nausea', 'Back pain'],
    chronicConditions: [],
    address: '789 Pine Road',
    registrationDate: new Date(),
  },
]

interface TriageData {
  riskScore: number
  priority: Priority
  notes: string
}

export function TriageWorkspace() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    waitingPatients[0]
  )
  const [triageData, setTriageData] = useState<TriageData>({
    riskScore: 35,
    priority: 'low',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])

  const handleAssignPriority = async () => {
    if (!selectedPatient) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    setCompleted([...completed, selectedPatient.id])
    setIsSubmitting(false)

    // Move to next patient
    const nextPatient = waitingPatients.find(
      (p) => !completed.includes(p.id) && p.id !== selectedPatient.id
    )
    if (nextPatient) {
      setSelectedPatient(nextPatient)
      setTriageData({ riskScore: 35, priority: 'low', notes: '' })
    } else {
      setSelectedPatient(null)
    }
  }

  const handleCalculateRisk = () => {
    if (!selectedPatient) return

    const riskScore = calculateRiskScore(
      selectedPatient.age,
      selectedPatient.pregnancyStatus === 'pregnant',
      selectedPatient.chronicConditions.length > 0,
      false
    )
    const priority = determinePriority(riskScore)

    setTriageData({ riskScore, priority, notes: triageData.notes })
  }

  const remaining = waitingPatients.length - completed.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Patient List */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Pending Triage
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {remaining} patients waiting
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {waitingPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                disabled={completed.includes(patient.id)}
                className={cn(
                  'w-full text-left p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedPatient?.id === patient.id
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {patient.fullName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Age {patient.age}
                    </p>
                  </div>
                  {completed.includes(patient.id) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Triage Form */}
      <div className="lg:col-span-3 space-y-6">
        {selectedPatient ? (
          <>
            {/* Patient Info Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white rounded-xl p-6 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wider">
                    Name
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {selectedPatient.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wider">
                    Age
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {selectedPatient.age} years
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wider">
                    Gender
                  </p>
                  <p className="text-xl font-bold mt-1 capitalize">
                    {selectedPatient.gender}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-xs uppercase tracking-wider">
                    Phone
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {selectedPatient.phone}
                  </p>
                </div>
              </div>

              {selectedPatient.pregnancyStatus === 'pregnant' && (
                <div className="mt-4 p-3 bg-yellow-400/20 border border-yellow-300 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">
                    Patient is pregnant - consider in assessment
                  </span>
                </div>
              )}
            </div>

            {/* Symptoms and Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Reported Symptoms
                </h3>
                <div className="space-y-2">
                  {selectedPatient.symptoms.map((symptom) => (
                    <div
                      key={symptom}
                      className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {symptom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Medical History
                </h3>
                {selectedPatient.chronicConditions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPatient.chronicConditions.map((condition) => (
                      <div
                        key={condition}
                        className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-orange-600" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {condition}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No chronic conditions reported
                  </p>
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Risk Assessment
                </h3>
                <button
                  onClick={handleCalculateRisk}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Auto-Calculate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-xs uppercase mb-2">
                    Risk Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {triageData.riskScore}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/100</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-xs uppercase mb-2">
                    Priority Level
                  </p>
                  <div className="mt-2">
                    <PriorityBadge priority={triageData.priority} />
                  </div>
                </div>
              </div>

              {/* Risk Score Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adjust Risk Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={triageData.riskScore}
                  onChange={(e) => {
                    const newScore = parseInt(e.target.value)
                    setTriageData({
                      ...triageData,
                      riskScore: newScore,
                      priority: determinePriority(newScore),
                    })
                  }}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Assessment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Notes
                </label>
                <textarea
                  value={triageData.notes}
                  onChange={(e) =>
                    setTriageData({ ...triageData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  rows={3}
                  placeholder="Clinical notes and observations..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAssignPriority}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Save Assessment
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              All Patients Triaged
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Great work! All waiting patients have been assessed and assigned a priority level.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
