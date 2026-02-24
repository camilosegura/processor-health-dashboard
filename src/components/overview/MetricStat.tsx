'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricStatProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  invertTrend?: boolean; // for response time, positive trend = bad
}

export function MetricStat({ label, value, trend, trendLabel, invertTrend }: MetricStatProps) {
  const isPositive = invertTrend ? (trend ?? 0) < 0 : (trend ?? 0) > 0;
  const isNeutral = trend === undefined || Math.abs(trend) < 0.5;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-semibold text-gray-100">{value}</span>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${
          isNeutral ? 'text-gray-500' : isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {isNeutral ? (
            <Minus size={12} />
          ) : isPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            {trendLabel && ` ${trendLabel}`}
          </span>
        </div>
      )}
    </div>
  );
}
