export interface AnomalyPattern {
  processorId: string;
  startHoursAgo: number;
  durationHours: number;
  type: 'auth_rate_drop' | 'latency_spike' | 'both';
  authRateMultiplier?: number; // e.g., 0.75 means auth rate becomes 75% of baseline
  latencyMultiplier?: number; // e.g., 5 means latency becomes 5x baseline
  rampUp?: boolean; // gradual onset
}

// Pre-defined anomaly scenarios matching the challenge description
export const ANOMALIES: AnomalyPattern[] = [
  // PayFastMX: auth rate dropped from 82% to ~61% starting ~18 hours ago (the main crisis)
  {
    processorId: 'payfastmx',
    startHoursAgo: 18,
    durationHours: 18, // ongoing
    type: 'auth_rate_drop',
    authRateMultiplier: 0.74,
    rampUp: true,
  },
  // Andean Gateway: severe latency spike starting ~12 hours ago (customers abandoning)
  {
    processorId: 'andean-gateway',
    startHoursAgo: 12,
    durationHours: 12, // ongoing
    type: 'latency_spike',
    latencyMultiplier: 5,
    rampUp: true,
  },
  // Cloudbank: brief auth rate dip 3 days ago (already recovered - for historical context)
  {
    processorId: 'cloudbank',
    startHoursAgo: 72,
    durationHours: 4,
    type: 'auth_rate_drop',
    authRateMultiplier: 0.85,
  },
  // NovaPago: latency blip 2 days ago (recovered)
  {
    processorId: 'novapago',
    startHoursAgo: 48,
    durationHours: 2,
    type: 'latency_spike',
    latencyMultiplier: 3,
  },
  // LatamPay: minor auth rate wobble yesterday (recovered)
  {
    processorId: 'latampay',
    startHoursAgo: 30,
    durationHours: 3,
    type: 'auth_rate_drop',
    authRateMultiplier: 0.92,
  },
];

export function getAnomalyFactor(
  processorId: string,
  hoursAgo: number,
  metric: 'authRate' | 'latency'
): number {
  for (const anomaly of ANOMALIES) {
    if (anomaly.processorId !== processorId) continue;

    const anomalyEnd = anomaly.startHoursAgo - anomaly.durationHours;
    if (hoursAgo > anomaly.startHoursAgo || hoursAgo < anomalyEnd) continue;

    const progress = (anomaly.startHoursAgo - hoursAgo) / anomaly.durationHours;

    let intensity = 1;
    if (anomaly.rampUp) {
      // Gradual onset: intensity ramps from 0 to 1 over first 30% of duration
      if (progress < 0.3) {
        intensity = progress / 0.3;
      }
    }

    if (metric === 'authRate' && (anomaly.type === 'auth_rate_drop' || anomaly.type === 'both')) {
      const multiplier = anomaly.authRateMultiplier ?? 0.75;
      return 1 - (1 - multiplier) * intensity;
    }

    if (metric === 'latency' && (anomaly.type === 'latency_spike' || anomaly.type === 'both')) {
      const multiplier = anomaly.latencyMultiplier ?? 3;
      return 1 + (multiplier - 1) * intensity;
    }
  }

  return 1; // no anomaly
}
