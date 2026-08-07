'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function AppointmentsPage() {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedDoctor, setSelectedDoctor] = useState(null)

  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      specialization: 'General Practice',
      rating: 4.8,
      avatar: '👩‍⚕️',
      availability: 'Available Today',
    },
    {
      id: 2,
      name: 'Dr. Michael Johnson',
      specialization: 'Cardiology',
      rating: 4.7,
      avatar: '👨‍⚕️',
      availability: 'Available Tomorrow',
    },
    {
      id: 3,
      name: 'Dr. Lisa Wong',
      specialization: 'Pediatrics',
      rating: 4.9,
      avatar: '👩‍⚕️',
      availability: 'Available Today',
    },
  ]

  const timeSlots = [
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
  ]

  const dates = ['Today', 'Tomorrow', '+2 Days', '+3 Days', '+4 Days']

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Book an Appointment
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Step {step} of 3</p>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
              animate={{ scaleX: s <= step ? 1 : 0.5 }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Step 1: Select Doctor */}
          {step === 1 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select a Doctor</h2>
              <div className="space-y-4">
                {doctors.map((doctor, i) => (
                  <motion.button
                    key={i}
                    onClick={() => {
                      setSelectedDoctor(doctor.id)
                      setStep(2)
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDoctor === doctor.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'
                    }`}
                    variants={itemVariants}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{doctor.avatar}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialization}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {doctor.rating}
                          </span>
                          <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                            {doctor.availability}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Date & Time</h2>

              {/* Date Selection */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Date</h3>
                <div className="grid grid-cols-5 gap-2">
                  {dates.map((date, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        selectedDate === date
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                      }`}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {date}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Time</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {timeSlots.map((time, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        selectedTime === time
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                      }`}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {time}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div
                className="mb-6 flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle className="w-16 h-16 text-emerald-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appointment Confirmed!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your appointment has been successfully booked
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6 border border-blue-200 dark:border-blue-700">
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Doctor</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {doctors.find(d => d.id === selectedDoctor)?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white">Room 101, Main Clinic</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Done
              </button>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => step < 3 && setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedDoctor) ||
                  (step === 2 && (!selectedDate || !selectedTime))
                }
                className="ml-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>

        {/* Sidebar - Summary */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-fit"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Booking Summary</h3>

          <div className="space-y-6">
            {/* Doctor Summary */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Doctor</p>
              {selectedDoctor ? (
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {doctors.find(d => d.id === selectedDoctor)?.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {doctors.find(d => d.id === selectedDoctor)?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {doctors.find(d => d.id === selectedDoctor)?.specialization}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">Not selected</p>
              )}
            </div>

            {/* Date & Time Summary */}
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                Date & Time
              </p>
              {selectedDate && selectedTime ? (
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedDate} at {selectedTime}
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">Not selected</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Please arrive 10 minutes early. You&apos;ll receive an SMS confirmation shortly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
