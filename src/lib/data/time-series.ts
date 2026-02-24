import { Transaction } from '@/types/transaction';
import { TimeSeriesPoint, MetricSnapshot, TimeRangeOption } from '@/types/metrics';

// Bucket size in minutes based on time range
function getBucketMinutes(option: TimeRangeOption): number {
  switch (option) {
    case '1h': return 5;
    case '6h': return 15;
    case '24h': return 30;
    case '7d': return 120;
    default: return 30;
  }
}

export function aggregateTimeSeries(
  transactions: Transaction[],
  startTime: string,
  endTime: string,
  rangeOption: TimeRangeOption
): TimeSeriesPoint[] {
  const bucketMs = getBucketMinutes(rangeOption) * 60 * 1000;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  const buckets = new Map<number, Transaction[]>();

  // Initialize empty buckets
  for (let t = start; t < end; t += bucketMs) {
    buckets.set(t, []);
  }

  // Distribute transactions into buckets
  for (const tx of transactions) {
    const txTime = new Date(tx.timestamp).getTime();
    if (txTime < start || txTime >= end) continue;
    const bucketKey = Math.floor((txTime - start) / bucketMs) * bucketMs + start;
    const bucket = buckets.get(bucketKey);
    if (bucket) bucket.push(tx);
  }

  const points: TimeSeriesPoint[] = [];

  for (const [bucketStart, txs] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
    if (txs.length === 0) {
      points.push({
        timestamp: new Date(bucketStart).toISOString(),
        authorizationRate: 0,
        responseTimeP50: 0,
        responseTimeP95: 0,
        transactionVolume: 0,
        approvedCount: 0,
        declinedCount: 0,
      });
      continue;
    }

    const approved = txs.filter(tx => tx.status === 'approved').length;
    const declined = txs.filter(tx => tx.status === 'declined').length;
    const authRate = txs.length > 0 ? (approved / txs.length) * 100 : 0;

    const responseTimes = txs.map(tx => tx.responseTimeMs).sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;

    points.push({
      timestamp: new Date(bucketStart).toISOString(),
      authorizationRate: Math.round(authRate * 100) / 100,
      responseTimeP50: Math.round(p50),
      responseTimeP95: Math.round(p95),
      transactionVolume: txs.length,
      approvedCount: approved,
      declinedCount: declined,
    });
  }

  return points;
}

export function computeMetricSnapshot(
  processorId: string,
  transactions: Transaction[],
  startTime: string,
  endTime: string,
  rangeOption: TimeRangeOption
): MetricSnapshot {
  const series = aggregateTimeSeries(transactions, startTime, endTime, rangeOption);

  const nonEmpty = series.filter(p => p.transactionVolume > 0);
  const totalVolume = nonEmpty.reduce((sum, p) => sum + p.transactionVolume, 0);
  const totalApproved = nonEmpty.reduce((sum, p) => sum + p.approvedCount, 0);
  const avgAuthRate = totalVolume > 0 ? (totalApproved / totalVolume) * 100 : 0;
  const avgResponseTime =
    nonEmpty.length > 0
      ? nonEmpty.reduce((sum, p) => sum + p.responseTimeP50, 0) / nonEmpty.length
      : 0;
  const peakResponseTime = Math.max(0, ...nonEmpty.map(p => p.responseTimeP95));
  const minAuthRate = nonEmpty.length > 0 ? Math.min(...nonEmpty.map(p => p.authorizationRate)) : 0;

  return {
    processorId,
    series,
    summary: {
      avgAuthRate: Math.round(avgAuthRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      totalVolume,
      peakResponseTime: Math.round(peakResponseTime),
      minAuthRate: Math.round(minAuthRate * 100) / 100,
    },
  };
}
