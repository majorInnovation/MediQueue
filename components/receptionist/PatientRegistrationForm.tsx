'use client'

import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn, generateQueueNumber, calculateRiskScore, determinePriority } from '@/lib/utils'
import { formatNrcInput, validateNrc } from '@/lib/patient-number'

type RegistrationStep = 'personal' | 'medical' | 'confirm'

interface FormData {
  // Personal Info
  fullName: string
  phone: string
  age: string
  nrc: string
  dob: string
  gender: 'male' | 'female' | 'other'
  address: string

  // Medical Info
  symptoms: string[]
  pregnancyStatus: 'pregnant' | 'not-pregnant' | 'unknown'
  chronicConditions: string[]
  isEmergency: boolean

  // Queue Info
  notes: string
}

const initialFormData: FormData = {
  fullName: '',
  phone: '',
  age: '',
  nrc: '',
  dob: '',
  gender: 'male',
  address: '',
  symptoms: [],
  pregnancyStatus: 'unknown',
  chronicConditions: [],
  isEmergency: false,
  notes: '',
}

export function PatientRegistrationForm() {
  const [step, setStep] = useState<RegistrationStep>('personal')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{
    queueNumber: string
    riskScore: number
    priority: string
  } | null>(null)

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
    setErrors({})
  }

  const validateStep = (currentStep: RegistrationStep): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 'personal') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Name is required'
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
      if (!formData.nrc.trim()) newErrors.nrc = 'NRC/ID is required'
      else if (!validateNrc(formData.nrc)) newErrors.nrc = 'National ID must be in the format 652260/67/1'
      if (!formData.dob) newErrors.dob = 'Date of birth is required'
      if (!formData.address.trim()) newErrors.address = 'Address is required'
    } else if (currentStep === 'medical') {
      if (formData.symptoms.length === 0) newErrors.symptoms = 'Please select at least one symptom'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 'personal') setStep('medical')
      else if (step === 'medical') setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'medical') setStep('personal')
    else if (step === 'confirm') setStep('medical')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Calculate priority
    const age = new Date().getFullYear() - new Date(formData.dob).getFullYear()
    const riskScore = calculateRiskScore(
      age,
      formData.pregnancyStatus === 'pregnant',
      formData.chronicConditions.length > 0,
      formData.isEmergency
    )
    const priority = determinePriority(riskScore)

    // Generate queue number
    const queueNumber = generateQueueNumber(Math.floor(Math.random() * 9999))

    setSuccessData({
      queueNumber,
      riskScore,
      priority: priority.toUpperCase(),
    })

    setIsSubmitting(false)
  }

  const commonSymptoms = [
    'Fever',
    'Cough',
    'Headache',
    'Sore throat',
    'Chest pain',
    'Shortness of breath',
    'Nausea',
    'Body aches',
  ]

  const commonConditions = [
    'Hypertension',
    'Diabetes',
    'Asthma',
    'Heart disease',
    'Arthritis',
  ]

  // Success screen
  if (successData) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Patient Registered Successfully!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Patient has been added to the queue
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
              Queue Number
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
              {successData.queueNumber}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
              Risk Score
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {successData.riskScore}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-2">
              Priority
            </p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {successData.priority}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setSuccessData(null)
              setFormData(initialFormData)
              setStep('personal')
            }}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Register Another Patient
          </button>
          <button className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors">
            Print Queue Slip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      {/* Progress Bar */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-6">
        {(['personal', 'medical', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                s === step
                  ? 'bg-blue-600 text-white'
                  : ['personal', 'medical', 'confirm'].indexOf(s) <
                      ['personal', 'medical', 'confirm'].indexOf(step)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              )}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 rounded-full',
                  ['personal', 'medical', 'confirm'].indexOf(s) <
                    ['personal', 'medical', 'confirm'].indexOf(step)
                    ? 'bg-emerald-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="p-8">
        {/* Step 1: Personal Information */}
        {step === 'personal' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Patient Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    errors.fullName
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => updateFormData({ age: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="34"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateFormData({ dob: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    errors.dob
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {errors.dob && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.dob}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NRC/Patient ID *
                </label>
                <input
                  type="text"
                  value={formData.nrc}
                  onChange={(e) => updateFormData({ nrc: formatNrcInput(e.target.value) })}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    errors.nrc
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="652260/67/1"
                />
                {errors.nrc && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.nrc}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateFormData({ gender: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    errors.phone
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="0976543210"
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData({ address: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all',
                    errors.address
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="123 Main Street"
                />
                {errors.address && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Medical Information */}
        {step === 'medical' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Medical Information
            </h2>

            {/* Emergency Status */}
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <input
                type="checkbox"
                id="emergency"
                checked={formData.isEmergency}
                onChange={(e) =>
                  updateFormData({ isEmergency: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="emergency" className="text-sm font-medium text-red-800 dark:text-red-300">
                Mark as Emergency/Critical Case
              </label>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Symptoms *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonSymptoms.map((symptom) => (
                  <label
                    key={symptom}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={(e) => {
                        const newSymptoms = e.target.checked
                          ? [...formData.symptoms, symptom]
                          : formData.symptoms.filter((s) => s !== symptom)
                        updateFormData({ symptoms: newSymptoms })
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {symptom}
                    </span>
                  </label>
                ))}
              </div>
              {errors.symptoms && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {errors.symptoms}
                </p>
              )}
            </div>

            {/* Pregnancy Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Pregnancy Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['pregnant', 'not-pregnant', 'unknown'] as const).map((status) => (
                  <label
                    key={status}
                    className={cn(
                      'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                      formData.pregnancyStatus === status
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <input
                      type="radio"
                      name="pregnancy"
                      value={status}
                      checked={formData.pregnancyStatus === status}
                      onChange={(e) =>
                        updateFormData({ pregnancyStatus: e.target.value as any })
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {status.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Chronic Conditions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commonConditions.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.chronicConditions.includes(condition)}
                      onChange={(e) => {
                        const newConditions = e.target.checked
                          ? [...formData.chronicConditions, condition]
                          : formData.chronicConditions.filter((c) => c !== condition)
                        updateFormData({ chronicConditions: newConditions })
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {condition}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                rows={3}
                placeholder="Any additional medical notes..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Review and Confirm
            </h2>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Full Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formData.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Phone
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formData.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    NRC/ID
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formData.nrc}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">
                    Symptoms
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formData.symptoms.join(', ')}
                  </p>
                </div>
              </div>

              {formData.isEmergency && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Marked as Emergency Case
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click "Complete Registration" to assign the patient to the queue and generate their queue number.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <button
          onClick={handleBack}
          disabled={step === 'personal'}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {step !== 'confirm' && (
          <button
            onClick={handleNext}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {step === 'confirm' && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="ml-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
          </button>
        )}
      </div>
    </div>
  )
}
