export const TIME_RANGE_OPTIONS = ['1h', '6h', '24h', '7d'] as const;
export type TimeRangeOption = (typeof TIME_RANGE_OPTIONS)[number];

export interface TimeRange {
  option: TimeRangeOption;
  start: string;
  end: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  authorizationRate: number;
  responseTimeP50: number;
  responseTimeP95: number;
  transactionVolume: number;
  approvedCount: number;
  declinedCount: number;
}

export interface MetricSnapshot {
  processorId: string;
  series: TimeSeriesPoint[];
  summary: {
    avgAuthRate: number;
    avgResponseTime: number;
    totalVolume: number;
    peakResponseTime: number;
    minAuthRate: number;
  };
}
