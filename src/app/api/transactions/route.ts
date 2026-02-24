import { NextRequest, NextResponse } from 'next/server';
import { getDataset } from '@/lib/data/generators';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const processorId = searchParams.get('processorId');
  const status = searchParams.get('status');
  const startTime = searchParams.get('start');
  const endTime = searchParams.get('end');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
  const country = searchParams.get('country');

  const { transactions } = getDataset();

  let filtered = transactions;
  if (processorId) filtered = filtered.filter(tx => tx.processorId === processorId);
  if (status) filtered = filtered.filter(tx => tx.status === status);
  if (startTime) filtered = filtered.filter(tx => tx.timestamp >= startTime);
  if (endTime) filtered = filtered.filter(tx => tx.timestamp <= endTime);
  if (country) filtered = filtered.filter(tx => tx.country === country);

  // Dataset is already sorted ascending by timestamp; reverse for most-recent-first
  filtered = [...filtered].reverse();

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    transactions: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
