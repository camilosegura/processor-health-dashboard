import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsForProcessor } from '@/lib/data/generators';
import { computeMetricSnapshot } from '@/lib/data/time-series';
import { PROCESSORS } from '@/lib/data/processors';
import { parseTimeRange, getStartDate, MAX_PROCESSOR_IDS_PER_REQUEST } from '@/lib/constants';

// Compare multiple processors
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = parseTimeRange(searchParams.get('range'));
  const now = new Date();
  const start = getStartDate(range, now);

  const idsParam = searchParams.get('ids');
  const validProcessorIds = new Set(PROCESSORS.map(p => p.id));
  const ids = idsParam
    ? idsParam.split(',').filter(id => validProcessorIds.has(id)).slice(0, MAX_PROCESSOR_IDS_PER_REQUEST)
    : PROCESSORS.map(p => p.id);

  const metrics: Record<string, ReturnType<typeof computeMetricSnapshot>> = {};

  for (const id of ids) {
    const txs = getTransactionsForProcessor(id, start.toISOString(), now.toISOString());
    metrics[id] = computeMetricSnapshot(id, txs, start.toISOString(), now.toISOString(), range);
  }

  return NextResponse.json({ metrics, range, start: start.toISOString(), end: now.toISOString() });
}
