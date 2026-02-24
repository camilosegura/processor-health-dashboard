import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsForProcessor } from '@/lib/data/generators';
import { computeMetricSnapshot } from '@/lib/data/time-series';
import { TimeRangeOption } from '@/types/metrics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get('range') || '24h') as TimeRangeOption;
  const now = new Date();

  let start: Date;
  switch (range) {
    case '1h':
      start = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const transactions = getTransactionsForProcessor(id, start.toISOString(), now.toISOString());
  const snapshot = computeMetricSnapshot(id, transactions, start.toISOString(), now.toISOString(), range);

  return NextResponse.json(snapshot);
}
