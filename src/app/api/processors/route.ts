import { NextResponse } from 'next/server';
import { ProcessorWithHealth, ProcessorHealth } from '@/types/processor';
import { PROCESSORS } from '@/lib/data/processors';
import { getDataset } from '@/lib/data/generators';
import { calculateHealthStatus } from '@/lib/utils/health';

export async function GET() {
  const { transactions } = getDataset();
  const now = Date.now();

  // Current window: last 1 hour
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  // Previous window: 1-2 hours ago (for trend)
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date(now).toISOString();

  const results: ProcessorWithHealth[] = PROCESSORS.map(processor => {
    const currentTxs = transactions.filter(
      tx => tx.processorId === processor.id && tx.timestamp >= oneHourAgo && tx.timestamp <= nowIso
    );
    const prevTxs = transactions.filter(
      tx => tx.processorId === processor.id && tx.timestamp >= twoHoursAgo && tx.timestamp < oneHourAgo
    );

    const currentApproved = currentTxs.filter(tx => tx.status === 'approved').length;
    const currentAuthRate = currentTxs.length > 0 ? (currentApproved / currentTxs.length) * 100 : 0;
    const currentAvgResponse = currentTxs.length > 0
      ? currentTxs.reduce((sum, tx) => sum + tx.responseTimeMs, 0) / currentTxs.length
      : 0;

    const prevApproved = prevTxs.filter(tx => tx.status === 'approved').length;
    const prevAuthRate = prevTxs.length > 0 ? (prevApproved / prevTxs.length) * 100 : 0;
    const prevAvgResponse = prevTxs.length > 0
      ? prevTxs.reduce((sum, tx) => sum + tx.responseTimeMs, 0) / prevTxs.length
      : 0;

    const health: ProcessorHealth = {
      processorId: processor.id,
      status: calculateHealthStatus(currentAuthRate, currentAvgResponse),
      currentAuthRate: Math.round(currentAuthRate * 100) / 100,
      currentResponseTimeMs: Math.round(currentAvgResponse),
      currentVolume: currentTxs.length,
      authRateTrend: Math.round((currentAuthRate - prevAuthRate) * 100) / 100,
      responseTimeTrend: prevAvgResponse > 0
        ? Math.round(((currentAvgResponse - prevAvgResponse) / prevAvgResponse) * 10000) / 100
        : 0,
      volumeTrend: prevTxs.length > 0
        ? Math.round(((currentTxs.length - prevTxs.length) / prevTxs.length) * 10000) / 100
        : 0,
      lastUpdated: nowIso,
    };

    return { ...processor, health };
  });

  return NextResponse.json(results);
}
