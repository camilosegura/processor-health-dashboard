'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TimeSeriesPoint } from '@/types/metrics';
import { CustomTooltip } from './CustomTooltip';
import { formatDateTime, formatNumber } from '@/lib/utils/format';

interface Series {
  name: string;
  data: TimeSeriesPoint[];
  color: string;
}

interface VolumeChartProps {
  series: Series[];
}

export function VolumeChart({ series }: VolumeChartProps) {
  const allTimestamps = new Set<string>();
  series.forEach(s => s.data.forEach(p => allTimestamps.add(p.timestamp)));
  const sortedTimestamps = Array.from(allTimestamps).sort();

  const chartData = sortedTimestamps.map(ts => {
    const point: Record<string, unknown> = { timestamp: ts };
    series.forEach(s => {
      const match = s.data.find(p => p.timestamp === ts);
      point[s.name] = match ? match.transactionVolume : 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(val) => formatDateTime(val)}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis
          tickFormatter={(val) => formatNumber(val)}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={50}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(value) => formatNumber(value)}
            />
          }
        />
        {series.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
          />
        )}
        {series.map(s => (
          <Bar
            key={s.name}
            dataKey={s.name}
            fill={s.color}
            fillOpacity={0.7}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
