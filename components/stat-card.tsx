'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend: string;
  trendUp: boolean;
}

export default function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-1 mt-3">
            {trendUp ? (
              <TrendingUp className="w-4 h-4 text-emerald-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-success" />
            )}
            <span className={`text-sm font-medium ${trendUp ? 'text-emerald-success' : 'text-emerald-success'}`}>
              {trend}
            </span>
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg text-primary">{icon}</div>
      </div>
    </div>
  );
}
