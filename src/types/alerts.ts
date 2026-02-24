export interface AlertThreshold {
  id: string;
  metric: 'authorizationRate' | 'responseTime';
  operator: 'lt' | 'gt';
  value: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
}

export interface Annotation {
  id: string;
  processorId?: string;
  timestamp: string;
  label: string;
  description?: string;
}
