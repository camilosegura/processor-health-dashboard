'use client';

import { MetricSnapshot } from '@/types/metrics';
import { ProcessorConfig } from '@/types/processor';
import { formatPercent, formatMs, formatNumber } from '@/lib/utils/format';

interface ComparisonTableProps {
  processors: ProcessorConfig[];
  metrics: Record<string, MetricSnapshot>;
}

export function ComparisonTable({ processors, metrics }: ComparisonTableProps) {
  // Find best values for highlighting
  const summaries = processors.map(p => ({ ...metrics[p.id]?.summary, id: p.id }));
  const bestAuthRate = Math.max(...summaries.map(s => s.avgAuthRate ?? 0));
  const bestResponseTime = Math.min(...summaries.filter(s => s.avgResponseTime > 0).map(s => s.avgResponseTime));
  const bestVolume = Math.max(...summaries.map(s => s.totalVolume ?? 0));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e1e2e]">
            <th className="text-left text-xs text-gray-500 font-medium uppercase tracking-wider py-3 px-4">
              Metric
            </th>
            {processors.map(p => (
              <th key={p.id} className="text-center py-3 px-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-200 font-medium">{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label="Avg. Authorization Rate"
            values={processors.map(p => ({
              value: formatPercent(metrics[p.id]?.summary.avgAuthRate ?? 0),
              isBest: (metrics[p.id]?.summary.avgAuthRate ?? 0) === bestAuthRate,
              isWorst: (metrics[p.id]?.summary.avgAuthRate ?? 0) ===
                Math.min(...summaries.map(s => s.avgAuthRate ?? 100)),
            }))}
          />
          <MetricRow
            label="Min. Authorization Rate"
            values={processors.map(p => ({
              value: formatPercent(metrics[p.id]?.summary.minAuthRate ?? 0),
              isBest: false,
              isWorst: (metrics[p.id]?.summary.minAuthRate ?? 0) ===
                Math.min(...summaries.map(s => s.minAuthRate ?? 100)),
            }))}
          />
          <MetricRow
            label="Avg. Response Time (P50)"
            values={processors.map(p => ({
              value: formatMs(metrics[p.id]?.summary.avgResponseTime ?? 0),
              isBest: (metrics[p.id]?.summary.avgResponseTime ?? 0) === bestResponseTime,
              isWorst: (metrics[p.id]?.summary.avgResponseTime ?? 0) ===
                Math.max(...summaries.map(s => s.avgResponseTime ?? 0)),
            }))}
          />
          <MetricRow
            label="Peak Response Time (P95)"
            values={processors.map(p => ({
              value: formatMs(metrics[p.id]?.summary.peakResponseTime ?? 0),
              isBest: false,
              isWorst: (metrics[p.id]?.summary.peakResponseTime ?? 0) ===
                Math.max(...summaries.map(s => s.peakResponseTime ?? 0)),
            }))}
          />
          <MetricRow
            label="Total Volume"
            values={processors.map(p => ({
              value: formatNumber(metrics[p.id]?.summary.totalVolume ?? 0),
              isBest: (metrics[p.id]?.summary.totalVolume ?? 0) === bestVolume,
              isWorst: false,
            }))}
          />
        </tbody>
      </table>
    </div>
  );
}

function MetricRow({ label, values }: {
  label: string;
  values: { value: string; isBest: boolean; isWorst: boolean }[];
}) {
  return (
    <tr className="border-b border-[#1e1e2e]/50 hover:bg-gray-800/20">
      <td className="text-gray-400 py-3 px-4 text-xs">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="text-center py-3 px-4">
          <span className={`font-medium ${
            v.isWorst ? 'text-red-400' : v.isBest ? 'text-emerald-400' : 'text-gray-200'
          }`}>
            {v.value}
          </span>
          {v.isBest && <span className="ml-1 text-[10px] text-emerald-500">BEST</span>}
          {v.isWorst && <span className="ml-1 text-[10px] text-red-500">WORST</span>}
        </td>
      ))}
    </tr>
  );
}
