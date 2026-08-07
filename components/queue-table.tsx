'use client';

import { Clock, Phone, CheckCircle, AlertCircle } from 'lucide-react';

interface QueueItem {
  id: string;
  queueNumber: string;
  patientName: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  arrivalTime: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Called';
  waitTime: string;
  room?: string;
}

const queueData: QueueItem[] = [
  {
    id: '1',
    queueNumber: 'QU-128',
    patientName: 'James Wilson',
    priority: 'High',
    arrivalTime: '10:15 AM',
    status: 'In Consultation',
    waitTime: '8 min',
    room: 'Room 2',
  },
  {
    id: '2',
    queueNumber: 'QU-127',
    patientName: 'Emma Davis',
    priority: 'Medium',
    arrivalTime: '10:20 AM',
    status: 'Called',
    waitTime: '3 min',
    room: 'Room 1',
  },
  {
    id: '3',
    queueNumber: 'QU-126',
    patientName: 'Michael Brown',
    priority: 'Low',
    arrivalTime: '10:25 AM',
    status: 'Waiting',
    waitTime: '2 min',
  },
  {
    id: '4',
    queueNumber: 'QU-125',
    patientName: 'Sarah Johnson',
    priority: 'Critical',
    arrivalTime: '10:28 AM',
    status: 'Waiting',
    waitTime: '< 1 min',
  },
  {
    id: '5',
    queueNumber: 'QU-124',
    patientName: 'Robert Taylor',
    priority: 'Medium',
    arrivalTime: '10:30 AM',
    status: 'Waiting',
    waitTime: '< 1 min',
  },
];

const priorityColors = {
  Critical: 'bg-critical-red/10 text-critical-red border-critical-red/20',
  High: 'bg-warning-orange/10 text-warning-orange border-warning-orange/20',
  Medium: 'bg-info/10 text-info border-info/20',
  Low: 'bg-emerald-success/10 text-emerald-success border-emerald-success/20',
};

const statusColors = {
  'In Consultation': 'bg-primary/10 text-primary',
  Completed: 'bg-emerald-success/10 text-emerald-success',
  Called: 'bg-info/10 text-info',
  Waiting: 'bg-warning-orange/10 text-warning-orange',
};

const statusIcons = {
  'In Consultation': <Phone className="w-4 h-4" />,
  Completed: <CheckCircle className="w-4 h-4" />,
  Called: <AlertCircle className="w-4 h-4" />,
  Waiting: <Clock className="w-4 h-4" />,
};

export default function QueueTable() {
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground">Active Queue</h2>
        <p className="text-sm text-muted-foreground mt-1">Current patients in queue system</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Queue #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Wait Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Location
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {queueData.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded font-semibold text-sm">
                    {item.queueNumber}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{item.patientName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Arrived {item.arrivalTime}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                      priorityColors[item.priority]
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${statusColors[item.status]}`}>
                    {statusIcons[item.status]}
                    {item.status}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{item.waitTime}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground">{item.room || '—'}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 5 of 23 patients</p>
        <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
          View All
        </button>
      </div>
    </div>
  );
}
