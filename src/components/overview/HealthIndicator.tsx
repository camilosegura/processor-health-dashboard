'use client';

import { HealthStatus } from '@/types/processor';
import { getStatusColor } from '@/lib/utils/health';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface HealthIndicatorProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthIndicator({ status, size = 'md' }: HealthIndicatorProps) {
  const color = getStatusColor(status);
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 16 : 20;
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  const Icon = status === 'critical' ? XCircle : status === 'degraded' ? AlertTriangle : CheckCircle2;

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="relative">
        <div
          className={`${dotSize} rounded-full ${status === 'critical' ? 'animate-pulse-critical' : ''}`}
          style={{ backgroundColor: color }}
        />
        {status === 'critical' && (
          <div
            className={`absolute inset-0 ${dotSize} rounded-full animate-ping`}
            style={{ backgroundColor: color, opacity: 0.4 }}
          />
        )}
      </div>
      <Icon size={iconSize} style={{ color }} />
      <span
        className="font-medium capitalize"
        style={{ color }}
      >
        {status}
      </span>
    </div>
  );
}
