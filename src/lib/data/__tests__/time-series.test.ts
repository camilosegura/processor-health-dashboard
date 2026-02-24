import { aggregateTimeSeries, computeMetricSnapshot } from '../time-series';
import { Transaction } from '@/types/transaction';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-001',
    processorId: 'test',
    timestamp: '2026-02-24T12:00:00.000Z',
    amount: 100,
    currency: 'MXN',
    country: 'MX',
    status: 'approved',
    responseTimeMs: 500,
    cardNetwork: 'Visa',
    ...overrides,
  };
}

describe('aggregateTimeSeries', () => {
  const start = '2026-02-24T12:00:00.000Z';
  const end = '2026-02-24T13:00:00.000Z';

  it('returns empty buckets when no transactions', () => {
    const points = aggregateTimeSeries([], start, end, '1h');
    // 1h range with 5min buckets = 12 buckets
    expect(points.length).toBe(12);
    points.forEach(p => {
      expect(p.transactionVolume).toBe(0);
      expect(p.authorizationRate).toBe(0);
    });
  });

  it('correctly calculates authorization rate', () => {
    const transactions: Transaction[] = [
      makeTx({ id: 'tx-1', status: 'approved', timestamp: '2026-02-24T12:01:00.000Z' }),
      makeTx({ id: 'tx-2', status: 'approved', timestamp: '2026-02-24T12:02:00.000Z' }),
      makeTx({ id: 'tx-3', status: 'declined', timestamp: '2026-02-24T12:03:00.000Z' }),
      makeTx({ id: 'tx-4', status: 'declined', timestamp: '2026-02-24T12:04:00.000Z' }),
    ];
    const points = aggregateTimeSeries(transactions, start, end, '1h');
    // All 4 txs land in the first 5-min bucket
    const firstBucket = points[0];
    expect(firstBucket.transactionVolume).toBe(4);
    expect(firstBucket.approvedCount).toBe(2);
    expect(firstBucket.declinedCount).toBe(2);
    expect(firstBucket.authorizationRate).toBe(50);
  });

  it('distributes transactions into correct buckets', () => {
    const transactions: Transaction[] = [
      makeTx({ id: 'tx-1', timestamp: '2026-02-24T12:02:00.000Z' }), // bucket 0
      makeTx({ id: 'tx-2', timestamp: '2026-02-24T12:07:00.000Z' }), // bucket 1
      makeTx({ id: 'tx-3', timestamp: '2026-02-24T12:12:00.000Z' }), // bucket 2
    ];
    const points = aggregateTimeSeries(transactions, start, end, '1h');
    expect(points[0].transactionVolume).toBe(1);
    expect(points[1].transactionVolume).toBe(1);
    expect(points[2].transactionVolume).toBe(1);
    expect(points[3].transactionVolume).toBe(0);
  });

  it('calculates percentiles correctly', () => {
    const transactions: Transaction[] = Array.from({ length: 100 }, (_, i) =>
      makeTx({
        id: `tx-${i}`,
        timestamp: '2026-02-24T12:01:00.000Z',
        responseTimeMs: (i + 1) * 10, // 10, 20, 30 ... 1000
      })
    );
    const points = aggregateTimeSeries(transactions, start, end, '1h');
    const bucket = points[0];
    expect(bucket.responseTimeP50).toBe(510); // 51st value (index 50)
    expect(bucket.responseTimeP95).toBe(960); // 96th value (index 95)
  });

  it('excludes transactions outside the time range', () => {
    const transactions: Transaction[] = [
      makeTx({ id: 'tx-1', timestamp: '2026-02-24T11:59:00.000Z' }), // before start
      makeTx({ id: 'tx-2', timestamp: '2026-02-24T12:01:00.000Z' }), // in range
      makeTx({ id: 'tx-3', timestamp: '2026-02-24T13:01:00.000Z' }), // after end
    ];
    const points = aggregateTimeSeries(transactions, start, end, '1h');
    const totalVolume = points.reduce((sum, p) => sum + p.transactionVolume, 0);
    expect(totalVolume).toBe(1);
  });
});

describe('computeMetricSnapshot', () => {
  const start = '2026-02-24T12:00:00.000Z';
  const end = '2026-02-24T13:00:00.000Z';

  it('computes correct summary metrics', () => {
    const transactions: Transaction[] = [
      makeTx({ id: 'tx-1', status: 'approved', responseTimeMs: 200, timestamp: '2026-02-24T12:01:00.000Z' }),
      makeTx({ id: 'tx-2', status: 'approved', responseTimeMs: 400, timestamp: '2026-02-24T12:02:00.000Z' }),
      makeTx({ id: 'tx-3', status: 'declined', responseTimeMs: 600, timestamp: '2026-02-24T12:03:00.000Z' }),
    ];
    const snapshot = computeMetricSnapshot('test', transactions, start, end, '1h');

    expect(snapshot.processorId).toBe('test');
    expect(snapshot.summary.totalVolume).toBe(3);
    // 2 approved out of 3 = 66.67%
    expect(snapshot.summary.avgAuthRate).toBeCloseTo(66.67, 1);
    expect(snapshot.series.length).toBeGreaterThan(0);
  });

  it('handles empty transaction set', () => {
    const snapshot = computeMetricSnapshot('test', [], start, end, '1h');
    expect(snapshot.summary.totalVolume).toBe(0);
    expect(snapshot.summary.avgAuthRate).toBe(0);
    expect(snapshot.summary.avgResponseTime).toBe(0);
  });

  it('returns correct processorId', () => {
    const snapshot = computeMetricSnapshot('payfastmx', [], start, end, '24h');
    expect(snapshot.processorId).toBe('payfastmx');
  });
});
