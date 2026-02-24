'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TimeSeriesPoint } from '@/types/metrics';
import { CustomTooltip } from './CustomTooltip';
import { formatDateTime, formatPercent } from '@/lib/utils/format';

interface Series {
  name: string;
  data: TimeSeriesPoint[];
  color: string;
}

interface AuthorizationRateChartProps {
  series: Series[];
  thresholds?: { warning?: number; critical?: number };
}

export function AuthorizationRateChart({ series, thresholds }: AuthorizationRateChartProps) {
  // Pre-index each series by timestamp for O(1) lookup
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
      point[s.name] = match ? match.authorizationRate : null;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(val) => formatDateTime(val)}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(val) => `${val}%`}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={50}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => formatPercent(value)}
            />
          }
        />
        {thresholds?.warning && (
          <ReferenceLine
            y={thresholds.warning}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{ value: `Warning: ${thresholds.warning}%`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
        )}
        {thresholds?.critical && (
          <ReferenceLine
            y={thresholds.critical}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{ value: `Critical: ${thresholds.critical}%`, fill: '#ef4444', fontSize: 10, position: 'right' }}
          />
        )}
        {series.map(s => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: s.color }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
