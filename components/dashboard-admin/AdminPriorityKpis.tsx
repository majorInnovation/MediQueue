'use client'

export function priorityCountsToWaiting(byPriority: { high: number; medium: number; low: number; critical?: number }) {
  const high = byPriority.high + (byPriority.critical ?? 0)
  return {
    high,
    medium: byPriority.medium,
    low: byPriority.low,
    total: high + byPriority.medium + byPriority.low,
  }
}

