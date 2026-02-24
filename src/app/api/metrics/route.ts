import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsForProcessor } from '@/lib/data/generators';
import { computeMetricSnapshot } from '@/lib/data/time-series';
import { PROCESSORS } from '@/lib/data/processors';
import { TimeRangeOption } from '@/types/metrics';

// Compare multiple processors
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids')?.split(',') || PROCESSORS.map(p => p.id);
  const range = (searchParams.get('range') || '24h') as TimeRangeOption;
  const now = new Date();

  let start: Date;
  switch (range) {
    case '1h': start = new Date(now.getTime() - 60 * 60 * 1000); break;
    case '6h': start = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
    case '24h': start = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    default: start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const metrics: Record<string, ReturnType<typeof computeMetricSnapshot>> = {};

  for (const id of ids) {
    const txs = getTransactionsForProcessor(id, start.toISOString(), now.toISOString());
    metrics[id] = computeMetricSnapshot(id, txs, start.toISOString(), now.toISOString(), range);
  }

  return NextResponse.json({ metrics, range, start: start.toISOString(), end: now.toISOString() });
}
