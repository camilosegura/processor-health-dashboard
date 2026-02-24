import { AlertThreshold } from '@/types/alerts';
import { TimeRangeOption } from '@/types/metrics';

export const HOUR_MS = 3_600_000;

export const TIME_RANGE_MS: Record<TimeRangeOption, number> = {
  '1h': HOUR_MS,
  '6h': 6 * HOUR_MS,
  '24h': 24 * HOUR_MS,
  '7d': 7 * 24 * HOUR_MS,
};

export const VALID_RANGES = new Set<TimeRangeOption>(['1h', '6h', '24h', '7d']);

export const MAX_SELECTED_PROCESSORS = 4;

export const MAX_PROCESSOR_IDS_PER_REQUEST = 10;

export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { id: 'auth-warning', metric: 'authorizationRate', operator: 'lt', value: 75, severity: 'warning', enabled: true },
  { id: 'auth-critical', metric: 'authorizationRate', operator: 'lt', value: 65, severity: 'critical', enabled: true },
  { id: 'resp-warning', metric: 'responseTime', operator: 'gt', value: 3000, severity: 'warning', enabled: true },
  { id: 'resp-critical', metric: 'responseTime', operator: 'gt', value: 5000, severity: 'critical', enabled: true },
];

export function parseTimeRange(raw: string | null): TimeRangeOption {
  const value = raw ?? '24h';
  return VALID_RANGES.has(value as TimeRangeOption) ? (value as TimeRangeOption) : '24h';
}

export function getStartDate(range: TimeRangeOption, now: Date): Date {
  return new Date(now.getTime() - TIME_RANGE_MS[range]);
}
