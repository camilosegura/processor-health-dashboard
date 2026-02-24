'use client';

import { ProcessorWithHealth } from '@/types/processor';
import { HealthIndicator } from './HealthIndicator';
import { MetricStat } from './MetricStat';
import { formatPercent, formatMs, formatNumber } from '@/lib/utils/format';
import { getStatusBorderColor } from '@/lib/utils/health';
import { MapPin, Eye } from 'lucide-react';

interface ProcessorCardProps {
  processor: ProcessorWithHealth;
  onClick?: () => void;
  onDrillDown?: () => void;
  selected?: boolean;
}

export function ProcessorCard({ processor, onClick, onDrillDown, selected }: ProcessorCardProps) {
  const { health } = processor;
  const gradientClass = `card-gradient-${health.status}`;
  const borderColor = getStatusBorderColor(health.status);

  return (
    <div
      className={`
        relative rounded-xl border p-5 transition-all duration-200 cursor-pointer
        ${borderColor} ${gradientClass}
        ${selected ? 'ring-2 ring-blue-500/50 border-blue-500/30' : 'hover:border-gray-600/50'}
        bg-[#111119]
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-100">{processor.name}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
            <MapPin size={11} />
            {processor.region}
          </div>
        </div>
        <HealthIndicator status={health.status} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricStat
          label="Auth Rate"
          value={formatPercent(health.currentAuthRate)}
          trend={health.authRateTrend}
          trendLabel="vs 1h"
        />
        <MetricStat
          label="Resp. Time"
          value={formatMs(health.currentResponseTimeMs)}
          trend={health.responseTimeTrend}
          trendLabel="vs 1h"
          invertTrend
        />
        <MetricStat
          label="Volume"
          value={formatNumber(health.currentVolume)}
          trend={health.volumeTrend}
          trendLabel="vs 1h"
        />
      </div>

      {/* Drill-down button */}
      {onDrillDown && (
        <button
          onClick={(e) => { e.stopPropagation(); onDrillDown(); }}
          className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-700/30"
        >
          <Eye size={11} />
          View Transactions
        </button>
      )}

      {/* Color accent bar at top */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
        style={{ backgroundColor: processor.color, opacity: 0.6 }}
      />
    </div>
  );
}
