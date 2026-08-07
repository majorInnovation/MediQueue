import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json([
    {
      id: '1',
      type: 'queue_update',
      title: 'Queue Position Updated',
      message: 'You are now at position 3 in the queue',
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      icon: 'TrendingDown',
      severity: 'info',
    },
    {
      id: '2',
      type: 'doctor_ready',
      title: 'Doctor Available',
      message: 'Dr. Sarah Johnson is ready to see you soon',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      icon: 'AlertCircle',
      severity: 'warning',
    },
    {
      id: '3',
      type: 'wait_estimate',
      title: 'Wait Time Estimate',
      message: 'Estimated wait time is 15 minutes',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      icon: 'Clock',
      severity: 'info',
    },
  ])
}
