import { getAnomalyFactor } from '../anomalies';

describe('getAnomalyFactor', () => {
  describe('PayFastMX auth rate drop (18h ago, 18h duration, rampUp)', () => {
    it('returns 1 (no anomaly) before the anomaly window', () => {
      // 20 hours ago - before the anomaly started at 18h ago
      expect(getAnomalyFactor('payfastmx', 20, 'authRate')).toBe(1);
    });

    it('returns reduced factor during anomaly', () => {
      // 9 hours ago - well into the anomaly (past ramp-up)
      const factor = getAnomalyFactor('payfastmx', 9, 'authRate');
      expect(factor).toBeLessThan(1);
      expect(factor).toBeGreaterThan(0.5);
    });

    it('ramps up gradually at the start', () => {
      // Very beginning of anomaly (17.5h ago) should have less impact than middle
      const earlyFactor = getAnomalyFactor('payfastmx', 17.5, 'authRate');
      const lateFactor = getAnomalyFactor('payfastmx', 9, 'authRate');
      expect(earlyFactor).toBeGreaterThan(lateFactor);
    });

    it('does not affect latency metric', () => {
      expect(getAnomalyFactor('payfastmx', 9, 'latency')).toBe(1);
    });
  });

  describe('Andean Gateway latency spike (12h ago, 12h duration, rampUp)', () => {
    it('returns 1 before the anomaly', () => {
      expect(getAnomalyFactor('andean-gateway', 15, 'latency')).toBe(1);
    });

    it('returns elevated factor during anomaly', () => {
      const factor = getAnomalyFactor('andean-gateway', 3, 'latency');
      expect(factor).toBeGreaterThan(1);
      expect(factor).toBeLessThanOrEqual(5);
    });

    it('does not affect auth rate metric', () => {
      expect(getAnomalyFactor('andean-gateway', 3, 'authRate')).toBe(1);
    });
  });

  describe('Cloudbank recovered anomaly (72h ago, 4h duration)', () => {
    it('returns reduced factor during anomaly window', () => {
      // 70h ago = within the 72-68 window
      const factor = getAnomalyFactor('cloudbank', 70, 'authRate');
      expect(factor).toBeLessThan(1);
    });

    it('returns 1 after recovery', () => {
      // 60h ago = well after the 68h recovery point
      expect(getAnomalyFactor('cloudbank', 60, 'authRate')).toBe(1);
    });

    it('returns 1 for current time (recovered)', () => {
      expect(getAnomalyFactor('cloudbank', 0, 'authRate')).toBe(1);
    });
  });

  describe('unknown processor', () => {
    it('returns 1 for non-existent processor', () => {
      expect(getAnomalyFactor('nonexistent', 5, 'authRate')).toBe(1);
      expect(getAnomalyFactor('nonexistent', 5, 'latency')).toBe(1);
    });
  });
});
