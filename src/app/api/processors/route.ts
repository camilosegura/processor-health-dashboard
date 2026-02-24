import { NextResponse } from 'next/server';
import { ProcessorWithHealth, ProcessorHealth, ProcessorConfig } from '@/types/processor';
import { Transaction } from '@/types/transaction';
import { PROCESSORS } from '@/lib/data/processors';
import { getDataset } from '@/lib/data/generators';
import { calculateHealthStatus } from '@/lib/utils/health';
import { HOUR_MS } from '@/lib/constants';

function computeWindowMetrics(txs: Transaction[]) {
  const approved = txs.filter(tx => tx.status === 'approved').length;
  const authRate = txs.length > 0 ? (approved / txs.length) * 100 : 0;
  const avgResponse = txs.length > 0
    ? txs.reduce((sum, tx) => sum + tx.responseTimeMs, 0) / txs.length
    : 0;
  return { authRate, avgResponse, volume: txs.length };
}

function buildProcessorHealth(
  processor: ProcessorConfig,
  transactions: Transaction[],
  nowIso: string,
  oneHourAgo: string,
  twoHoursAgo: string
): ProcessorWithHealth {
  const currentTxs = transactions.filter(
    tx => tx.processorId === processor.id && tx.timestamp >= oneHourAgo && tx.timestamp <= nowIso
  );
  const prevTxs = transactions.filter(
    tx => tx.processorId === processor.id && tx.timestamp >= twoHoursAgo && tx.timestamp < oneHourAgo
  );

  const current = computeWindowMetrics(currentTxs);
  const prev = computeWindowMetrics(prevTxs);

  const health: ProcessorHealth = {
    processorId: processor.id,
    status: calculateHealthStatus(current.authRate, current.avgResponse),
    currentAuthRate: Math.round(current.authRate * 100) / 100,
    currentResponseTimeMs: Math.round(current.avgResponse),
    currentVolume: current.volume,
    authRateTrend: Math.round((current.authRate - prev.authRate) * 100) / 100,
    responseTimeTrend: prev.avgResponse > 0
      ? Math.round(((current.avgResponse - prev.avgResponse) / prev.avgResponse) * 10000) / 100
      : 0,
    volumeTrend: prev.volume > 0
      ? Math.round(((current.volume - prev.volume) / prev.volume) * 10000) / 100
      : 0,
    lastUpdated: nowIso,
  };

  return { ...processor, health };
}

export async function GET() {
  const { transactions } = getDataset();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const oneHourAgo = new Date(now - HOUR_MS).toISOString();
  const twoHoursAgo = new Date(now - 2 * HOUR_MS).toISOString();

  const results: ProcessorWithHealth[] = PROCESSORS.map(processor =>
    buildProcessorHealth(processor, transactions, nowIso, oneHourAgo, twoHoursAgo)
  );

  return NextResponse.json(results);
}
