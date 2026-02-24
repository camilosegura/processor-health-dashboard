import {
  parseTimeRange,
  getStartDate,
  DEFAULT_THRESHOLDS,
} from '../constants';

describe('parseTimeRange', () => {
  it('returns valid range as-is', () => {
    expect(parseTimeRange('1h')).toBe('1h');
    expect(parseTimeRange('6h')).toBe('6h');
    expect(parseTimeRange('24h')).toBe('24h');
    expect(parseTimeRange('7d')).toBe('7d');
  });

  it('returns 24h for null input', () => {
    expect(parseTimeRange(null)).toBe('24h');
  });

  it('returns 24h for invalid input', () => {
    expect(parseTimeRange('invalid')).toBe('24h');
    expect(parseTimeRange('2h')).toBe('24h');
    expect(parseTimeRange('')).toBe('24h');
  });
});

describe('getStartDate', () => {
  const now = new Date('2026-02-24T12:00:00.000Z');

  it('returns 1 hour before for 1h range', () => {
    const start = getStartDate('1h', now);
    expect(start.toISOString()).toBe('2026-02-24T11:00:00.000Z');
  });

  it('returns 6 hours before for 6h range', () => {
    const start = getStartDate('6h', now);
    expect(start.toISOString()).toBe('2026-02-24T06:00:00.000Z');
  });

  it('returns 24 hours before for 24h range', () => {
    const start = getStartDate('24h', now);
    expect(start.toISOString()).toBe('2026-02-23T12:00:00.000Z');
  });

  it('returns 7 days before for 7d range', () => {
    const start = getStartDate('7d', now);
    expect(start.toISOString()).toBe('2026-02-17T12:00:00.000Z');
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  it('has 4 thresholds', () => {
    expect(DEFAULT_THRESHOLDS).toHaveLength(4);
  });

  it('has auth rate warning and critical', () => {
    const authThresholds = DEFAULT_THRESHOLDS.filter(t => t.metric === 'authorizationRate');
    expect(authThresholds).toHaveLength(2);
    expect(authThresholds.find(t => t.severity === 'warning')?.value).toBe(75);
    expect(authThresholds.find(t => t.severity === 'critical')?.value).toBe(65);
  });

  it('has response time warning and critical', () => {
    const respThresholds = DEFAULT_THRESHOLDS.filter(t => t.metric === 'responseTime');
    expect(respThresholds).toHaveLength(2);
    expect(respThresholds.find(t => t.severity === 'warning')?.value).toBe(3000);
    expect(respThresholds.find(t => t.severity === 'critical')?.value).toBe(5000);
  });

  it('all thresholds are enabled by default', () => {
    DEFAULT_THRESHOLDS.forEach(t => {
      expect(t.enabled).toBe(true);
    });
  });
});
