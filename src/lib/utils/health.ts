import { HealthStatus } from '@/types/processor';

export function calculateHealthStatus(
  authRate: number,
  responseTimeMs: number
): HealthStatus {
  // Critical: auth rate < 65% OR response time > 5000ms
  if (authRate < 65 || responseTimeMs > 5000) return 'critical';
  // Degraded: auth rate < 75% OR response time > 3000ms
  if (authRate < 75 || responseTimeMs > 3000) return 'degraded';
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
