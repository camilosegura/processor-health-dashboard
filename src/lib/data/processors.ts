import { ProcessorConfig } from '@/types/processor';

export const PROCESSORS: ProcessorConfig[] = [
  {
    id: 'payfastmx',
    name: 'PayFastMX',
    baselineAuthRate: 0.82,
    baselineResponseTimeMs: 1200,
    baselineVolumePerHour: 180,
    region: 'Mexico',
    color: '#3b82f6', // blue
  },
  {
    id: 'cloudbank',
    name: 'Cloudbank',
    baselineAuthRate: 0.85,
    baselineResponseTimeMs: 800,
    baselineVolumePerHour: 200,
    region: 'Brazil',
    color: '#10b981', // green
  },
  {
    id: 'andean-gateway',
    name: 'Andean Gateway',
    baselineAuthRate: 0.78,
    baselineResponseTimeMs: 1500,
    baselineVolumePerHour: 120,
    region: 'Colombia',
    color: '#f59e0b', // amber
  },
  {
    id: 'latampay',
    name: 'LatamPay',
    baselineAuthRate: 0.80,
    baselineResponseTimeMs: 1000,
    baselineVolumePerHour: 150,
    region: 'Multi-region',
    color: '#8b5cf6', // purple
  },
  {
    id: 'novapago',
    name: 'NovaPago',
    baselineAuthRate: 0.84,
    baselineResponseTimeMs: 900,
    baselineVolumePerHour: 140,
    region: 'Brazil',
    color: '#ef4444', // red
  },
];

export function getProcessor(id: string): ProcessorConfig | undefined {
  return PROCESSORS.find(p => p.id === id);
}
