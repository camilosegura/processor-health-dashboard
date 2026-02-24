import { calculateHealthStatus, getStatusColor, getStatusBorderColor } from '../health';
import { AlertThreshold } from '@/types/alerts';

describe('calculateHealthStatus', () => {
  describe('with default thresholds', () => {
    it('returns healthy for good metrics', () => {
      expect(calculateHealthStatus(85, 1000)).toBe('healthy');
    });

    it('returns degraded for low auth rate', () => {
      expect(calculateHealthStatus(70, 1000)).toBe('degraded');
    });

    it('returns degraded for high response time', () => {
      expect(calculateHealthStatus(85, 4000)).toBe('degraded');
    });

    it('returns critical for very low auth rate', () => {
      expect(calculateHealthStatus(60, 1000)).toBe('critical');
    });

    it('returns critical for very high response time', () => {
      expect(calculateHealthStatus(85, 6000)).toBe('critical');
    });

    it('returns critical when both metrics are bad', () => {
      expect(calculateHealthStatus(50, 8000)).toBe('critical');
    });

    it('returns healthy at exact boundary (75% auth)', () => {
      expect(calculateHealthStatus(75, 1000)).toBe('healthy');
    });

    it('returns degraded just below boundary (74.9% auth)', () => {
      expect(calculateHealthStatus(74.9, 1000)).toBe('degraded');
    });

    it('returns healthy at exact response time boundary (3000ms)', () => {
      expect(calculateHealthStatus(85, 3000)).toBe('healthy');
    });

    it('returns degraded just above response time boundary (3001ms)', () => {
      expect(calculateHealthStatus(85, 3001)).toBe('degraded');
    });
  });

  describe('with custom thresholds', () => {
    const customThresholds: AlertThreshold[] = [
      { id: 'auth-warning', metric: 'authorizationRate', operator: 'lt', value: 90, severity: 'warning', enabled: true },
      { id: 'auth-critical', metric: 'authorizationRate', operator: 'lt', value: 80, severity: 'critical', enabled: true },
      { id: 'resp-warning', metric: 'responseTime', operator: 'gt', value: 2000, severity: 'warning', enabled: true },
      { id: 'resp-critical', metric: 'responseTime', operator: 'gt', value: 4000, severity: 'critical', enabled: true },
    ];

    it('uses custom warning threshold', () => {
      // 85% would be healthy with defaults, but degraded with custom (< 90%)
      expect(calculateHealthStatus(85, 1000, customThresholds)).toBe('degraded');
    });

    it('uses custom critical threshold', () => {
      // 75% would be degraded with defaults, but critical with custom (< 80%)
      expect(calculateHealthStatus(75, 1000, customThresholds)).toBe('critical');
    });

    it('uses custom response time threshold', () => {
      expect(calculateHealthStatus(95, 3000, customThresholds)).toBe('degraded');
      expect(calculateHealthStatus(95, 5000, customThresholds)).toBe('critical');
    });
  });

  describe('with disabled thresholds', () => {
    const partialThresholds: AlertThreshold[] = [
      { id: 'auth-warning', metric: 'authorizationRate', operator: 'lt', value: 90, severity: 'warning', enabled: false },
      { id: 'auth-critical', metric: 'authorizationRate', operator: 'lt', value: 80, severity: 'critical', enabled: false },
      { id: 'resp-warning', metric: 'responseTime', operator: 'gt', value: 2000, severity: 'warning', enabled: true },
      { id: 'resp-critical', metric: 'responseTime', operator: 'gt', value: 4000, severity: 'critical', enabled: true },
    ];

    it('falls back to default for disabled auth thresholds', () => {
      // Auth thresholds disabled, so 70% uses default (75) -> degraded
      expect(calculateHealthStatus(70, 1000, partialThresholds)).toBe('degraded');
    });

    it('still applies enabled response time thresholds', () => {
      expect(calculateHealthStatus(95, 3000, partialThresholds)).toBe('degraded');
    });
  });
});

describe('getStatusColor', () => {
  it('returns green for healthy', () => {
    expect(getStatusColor('healthy')).toBe('#10b981');
  });

  it('returns amber for degraded', () => {
    expect(getStatusColor('degraded')).toBe('#f59e0b');
  });

  it('returns red for critical', () => {
    expect(getStatusColor('critical')).toBe('#ef4444');
  });
});

describe('getStatusBorderColor', () => {
  it('returns correct class for each status', () => {
    expect(getStatusBorderColor('healthy')).toContain('emerald');
    expect(getStatusBorderColor('degraded')).toContain('amber');
    expect(getStatusBorderColor('critical')).toContain('red');
  });
});
