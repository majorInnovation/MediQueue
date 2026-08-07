'use client';

import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface PriorityItem {
  level: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const priorityData: PriorityItem[] = [
  {
    level: 'Critical',
    count: 2,
    percentage: 9,
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-critical-red',
    bgColor: 'bg-critical-red/10',
  },
  {
    level: 'High',
    count: 8,
    percentage: 35,
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-warning-orange',
    bgColor: 'bg-warning-orange/10',
  },
  {
    level: 'Medium',
    count: 10,
    percentage: 43,
    icon: <Info className="w-5 h-5" />,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    level: 'Low',
    count: 3,
    percentage: 13,
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-emerald-success',
    bgColor: 'bg-emerald-success/10',
  },
];

export default function PriorityOverview() {
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground">Priority Distribution</h2>
        <p className="text-sm text-muted-foreground mt-1">Patient priority levels</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {priorityData.map((item) => (
          <div key={item.level}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <div className={item.color}>{item.icon}</div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.level}</p>
                  <p className="text-xs text-muted-foreground">{item.count} patients</p>
                </div>
              </div>
              <span className="font-semibold text-foreground text-sm">{item.percentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${item.color.replace('text-', 'bg-')} transition-all`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-4 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total in Queue</p>
            <p className="text-2xl font-bold text-foreground mt-1">23</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Avg Priority</p>
            <p className="text-2xl font-bold text-foreground mt-1">Medium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
