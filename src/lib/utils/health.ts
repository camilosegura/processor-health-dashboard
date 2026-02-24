import { HealthStatus } from '@/types/processor';
import { AlertThreshold } from '@/types/alerts';

export function calculateHealthStatus(
  authRate: number,
  responseTimeMs: number,
  thresholds?: AlertThreshold[]
): HealthStatus {
  const authCritical = thresholds?.find(t => t.metric === 'authorizationRate' && t.severity === 'critical' && t.enabled)?.value ?? 65;
  const respCritical = thresholds?.find(t => t.metric === 'responseTime' && t.severity === 'critical' && t.enabled)?.value ?? 5000;
  if (authRate < authCritical || responseTimeMs > respCritical) return 'critical';

  const authWarning = thresholds?.find(t => t.metric === 'authorizationRate' && t.severity === 'warning' && t.enabled)?.value ?? 75;
  const respWarning = thresholds?.find(t => t.metric === 'responseTime' && t.severity === 'warning' && t.enabled)?.value ?? 3000;
  if (authRate < authWarning || responseTimeMs > respWarning) return 'degraded';

  return 'healthy';
}

export function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return '#10b981';
    case 'degraded': return '#f59e0b';
    case 'critical': return '#ef4444';
  }
}

export function getStatusBgColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'bg-emerald-500/10';
    case 'degraded': return 'bg-amber-500/10';
    case 'critical': return 'bg-red-500/10';
  }
}

export function getStatusTextColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'text-emerald-500';
    case 'degraded': return 'text-amber-500';
    case 'critical': return 'text-red-500';
  }
}

export function getStatusBorderColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'border-emerald-500/20';
    case 'degraded': return 'border-amber-500/30';
    case 'critical': return 'border-red-500/30';
  }
}
