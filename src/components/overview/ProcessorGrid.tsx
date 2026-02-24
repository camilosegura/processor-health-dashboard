'use client';

import { ProcessorWithHealth } from '@/types/processor';
import { ProcessorCard } from './ProcessorCard';

interface ProcessorGridProps {
  processors: ProcessorWithHealth[];
  selectedIds?: string[];
  onProcessorClick?: (id: string) => void;
  onDrillDown?: (id: string) => void;
}

export function ProcessorGrid({ processors, selectedIds = [], onProcessorClick, onDrillDown }: ProcessorGridProps) {
  // Sort: critical first, then degraded, then healthy
  const statusOrder = { critical: 0, degraded: 1, healthy: 2 };
  const sorted = [...processors].sort(
    (a, b) => statusOrder[a.health.status] - statusOrder[b.health.status]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {sorted.map(processor => (
        <ProcessorCard
          key={processor.id}
          processor={processor}
          selected={selectedIds.includes(processor.id)}
          onClick={() => onProcessorClick?.(processor.id)}
          onDrillDown={onDrillDown ? () => onDrillDown(processor.id) : undefined}
        />
      ))}
    </div>
  );
}
