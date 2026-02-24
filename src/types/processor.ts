export const HEALTH_STATUSES = ['healthy', 'degraded', 'critical'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export interface ProcessorConfig {
  id: string;
  name: string;
  baselineAuthRate: number;
  baselineResponseTimeMs: number;
  baselineVolumePerHour: number;
  region: string;
  color: string;
}

export interface ProcessorHealth {
  processorId: string;
  status: HealthStatus;
  currentAuthRate: number;
  currentResponseTimeMs: number;
  currentVolume: number;
  authRateTrend: number;
  responseTimeTrend: number;
  volumeTrend: number;
  lastUpdated: string;
}

export interface ProcessorWithHealth extends ProcessorConfig {
  health: ProcessorHealth;
}
