'use client'

import React from 'react'

interface QueueNumberDisplayProps {
  number: string
  large?: boolean
}

export function QueueNumberDisplay({ number, large = false }: QueueNumberDisplayProps) {
  return (
    <div
      className={`font-mono font-bold text-white rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center ${
        large
          ? 'text-6xl w-48 h-48 shadow-2xl'
          : 'text-4xl w-24 h-24 shadow-lg'
      }`}
    >
      {number}
    </div>
  )
}
