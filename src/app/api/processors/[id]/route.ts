import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsForProcessor } from '@/lib/data/generators';
import { computeMetricSnapshot } from '@/lib/data/time-series';
import { parseTimeRange, getStartDate } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const range = parseTimeRange(searchParams.get('range'));
  const now = new Date();
  const start = getStartDate(range, now);

  const transactions = getTransactionsForProcessor(id, start.toISOString(), now.toISOString());
  const snapshot = computeMetricSnapshot(id, transactions, start.toISOString(), now.toISOString(), range);

  return NextResponse.json(snapshot);
}
