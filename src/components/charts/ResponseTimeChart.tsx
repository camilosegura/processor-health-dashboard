'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from '@/types/metrics';
import { CustomTooltip } from './CustomTooltip';
import { formatDateTime, formatMs } from '@/lib/utils/format';

interface Series {
  name: string;
  data: TimeSeriesPoint[];
  color: string;
}

interface ResponseTimeChartProps {
  series: Series[];
  showP95?: boolean;
  thresholds?: { warning?: number; critical?: number };
}

export function ResponseTimeChart({ series, showP95 = true, thresholds }: ResponseTimeChartProps) {
  const seriesMaps = series.map(s => ({
    ...s,
    dataMap: new Map(s.data.map(p => [p.timestamp, p])),
  }));

  const allTimestamps = new Set<string>();
  series.forEach(s => s.data.forEach(p => allTimestamps.add(p.timestamp)));
  const sortedTimestamps = Array.from(allTimestamps).sort();

  const chartData = sortedTimestamps.map(ts => {
    const point: Record<string, unknown> = { timestamp: ts };
    seriesMaps.forEach(s => {
      const match = s.dataMap.get(ts);
      point[`${s.name} P50`] = match ? match.responseTimeP50 : null;
      if (showP95) {
        point[`${s.name} P95`] = match ? match.responseTimeP95 : null;
      }
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(val) => formatDateTime(val)}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis
          tickFormatter={(val) => formatMs(val)}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={55}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => formatMs(value)}
            />
          }
        />
        {thresholds?.warning && (
          <ReferenceLine
            y={thresholds.warning}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
        )}
        {thresholds?.critical && (
          <ReferenceLine
            y={thresholds.critical}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
        )}
        {series.map(s => (
          <Area
            key={`${s.name}-p50`}
            type="monotone"
            dataKey={`${s.name} P50`}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
        {showP95 && series.map(s => (
          <Area
            key={`${s.name}-p95`}
            type="monotone"
            dataKey={`${s.name} P95`}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.05}
            strokeWidth={1}
            strokeDasharray="4 2"
            dot={false}
            connectNulls
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
