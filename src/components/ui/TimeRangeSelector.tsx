'use client';

import { TimeRangeOption, TIME_RANGE_OPTIONS } from '@/types/metrics';
import { Clock } from 'lucide-react';

interface TimeRangeSelectorProps {
  selected: TimeRangeOption;
  onChange: (option: TimeRangeOption) => void;
}

const LABELS: Record<TimeRangeOption, string> = {
  '1h': '1H',
  '6h': '6H',
  '24h': '24H',
  '7d': '7D',
};

export function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-[#111119] border border-[#1e1e2e] rounded-lg p-1">
      <Clock size={14} className="text-gray-500 ml-2 mr-1" />
      {TIME_RANGE_OPTIONS.map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${selected === option
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
            }
          `}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
