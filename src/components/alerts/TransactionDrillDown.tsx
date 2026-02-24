'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatMs, formatDateTime } from '@/lib/utils/format';
import { X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface TransactionDrillDownProps {
  processorId: string;
  processorName: string;
  timeRange: { start: string; end: string };
  onClose: () => void;
}

export function TransactionDrillDown({
  processorId,
  processorName,
  timeRange,
  onClose,
}: TransactionDrillDownProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      processorId,
      start: timeRange.start,
      end: timeRange.end,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (statusFilter) params.set('status', statusFilter);
    if (countryFilter) params.set('country', countryFilter);

    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions);
    setTotal(data.total);
    setLoading(false);
  }, [processorId, timeRange, page, statusFilter, countryFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalPages = Math.ceil(total / pageSize);

  const statusColors: Record<string, string> = {
    approved: 'text-emerald-400 bg-emerald-500/10',
    declined: 'text-red-400 bg-red-500/10',
    timeout: 'text-amber-400 bg-amber-500/10',
    error: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111119] border border-[#1e1e2e] rounded-xl w-full max-w-5xl max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e1e2e]">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              Transaction Details - {processorName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{total.toLocaleString()} transactions found</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2e]">
          <Filter size={14} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-md px-2 py-1 text-xs text-gray-300"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="timeout">Timeout</option>
            <option value="error">Error</option>
          </select>
          <select
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
            className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-md px-2 py-1 text-xs text-gray-300"
          >
            <option value="">All Countries</option>
            <option value="MX">Mexico (MX)</option>
            <option value="CO">Colombia (CO)</option>
            <option value="BR">Brazil (BR)</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#111119]">
              <tr className="border-b border-[#1e1e2e]">
                <th className="text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">ID</th>
                <th className="text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Time</th>
                <th className="text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Status</th>
                <th className="text-right text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Amount</th>
                <th className="text-center text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Country</th>
                <th className="text-center text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Network</th>
                <th className="text-right text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Response</th>
                <th className="text-left text-[11px] text-gray-500 font-medium uppercase tracking-wider py-2 px-4">Decline Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1e1e2e]/30">
                    <td colSpan={8} className="py-3 px-4">
                      <div className="h-4 bg-gray-800/50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-[#1e1e2e]/30 hover:bg-gray-800/20">
                    <td className="py-2 px-4 text-xs text-gray-500 font-mono">{tx.id}</td>
                    <td className="py-2 px-4 text-xs text-gray-300">{formatDateTime(tx.timestamp)}</td>
                    <td className="py-2 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[tx.status] || ''}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-xs text-gray-200 text-right font-mono">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-2 px-4 text-xs text-gray-300 text-center">{tx.country}</td>
                    <td className="py-2 px-4 text-xs text-gray-300 text-center">{tx.cardNetwork}</td>
                    <td className={`py-2 px-4 text-xs text-right font-mono ${
                      tx.responseTimeMs > 5000 ? 'text-red-400' :
                      tx.responseTimeMs > 3000 ? 'text-amber-400' : 'text-gray-300'
                    }`}>
                      {formatMs(tx.responseTimeMs)}
                    </td>
                    <td className="py-2 px-4 text-xs text-gray-500">
                      {tx.declineReason?.replace(/_/g, ' ') || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e1e2e]">
          <span className="text-xs text-gray-500">
            Showing {Math.min((page - 1) * pageSize + 1, total)}-{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 hover:bg-gray-800 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
