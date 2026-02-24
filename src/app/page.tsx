'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProcessorWithHealth } from '@/types/processor';
import { MetricSnapshot, TimeRangeOption } from '@/types/metrics';
import { AlertThreshold } from '@/types/alerts';
import { PROCESSORS } from '@/lib/data/processors';
import { DEFAULT_THRESHOLDS, TIME_RANGE_MS, MAX_SELECTED_PROCESSORS } from '@/lib/constants';
import { calculateHealthStatus } from '@/lib/utils/health';
import { ProcessorGrid } from '@/components/overview/ProcessorGrid';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { AuthorizationRateChart } from '@/components/charts/AuthorizationRateChart';
import { ResponseTimeChart } from '@/components/charts/ResponseTimeChart';
import { VolumeChart } from '@/components/charts/VolumeChart';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { AlertConfig } from '@/components/alerts/AlertConfig';
import { TransactionDrillDown } from '@/components/alerts/TransactionDrillDown';
import {
  Activity,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
} from 'lucide-react';

export default function Dashboard() {
  const [processors, setProcessors] = useState<ProcessorWithHealth[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricSnapshot>>({});
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('24h');
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [drillDownProcessor, setDrillDownProcessor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>(DEFAULT_THRESHOLDS);
  const [activeTab, setActiveTab] = useState<'overview' | 'compare'>('overview');

  const fetchProcessors = useCallback(async () => {
    try {
      const res = await fetch('/api/processors');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProcessors(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch processors:', err);
      setError('Failed to load processor data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const ids = selectedProcessors.length > 0
        ? selectedProcessors
        : PROCESSORS.map(p => p.id);
      const res = await fetch(`/api/metrics?ids=${ids.join(',')}&range=${timeRange}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, [timeRange, selectedProcessors]);

  useEffect(() => { fetchProcessors(); }, [fetchProcessors]);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchProcessors, 30000);
    return () => clearInterval(interval);
  }, [fetchProcessors]);

  const toggleProcessor = (id: string) => {
    setSelectedProcessors(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= MAX_SELECTED_PROCESSORS) return prev;
      return [...prev, id];
    });
  };

  // Recalculate health status client-side when thresholds change
  const processorsWithThresholds = useMemo(() => {
    return processors.map(p => ({
      ...p,
      health: {
        ...p.health,
        status: calculateHealthStatus(
          p.health.currentAuthRate,
          p.health.currentResponseTimeMs,
          thresholds
        ),
      },
    }));
  }, [processors, thresholds]);

  // Count alerts from threshold-aware health
  const criticalCount = processorsWithThresholds.filter(p => p.health.status === 'critical').length;
  const degradedCount = processorsWithThresholds.filter(p => p.health.status === 'degraded').length;

  // Compute revenue impact from actual data
  const revenueImpact = useMemo(() => {
    const degradedProcessors = processorsWithThresholds.filter(p => p.health.status !== 'healthy');
    if (degradedProcessors.length === 0) return null;
    const totalVolume = processorsWithThresholds.reduce((sum, p) => sum + p.health.currentVolume, 0);
    if (totalVolume === 0) return null;
    const avgDeclineIncrease = degradedProcessors.reduce((sum, p) => {
      const baselineAuth = PROCESSORS.find(pr => pr.id === p.id)?.baselineAuthRate ?? 0.8;
      const currentAuth = p.health.currentAuthRate / 100;
      return sum + (baselineAuth - currentAuth) * p.health.currentVolume;
    }, 0);
    const impactPercent = (avgDeclineIncrease / totalVolume) * 100;
    return impactPercent > 0.1 ? impactPercent : null;
  }, [processorsWithThresholds]);

  // Get series for charts
  const chartProcessors = selectedProcessors.length > 0
    ? PROCESSORS.filter(p => selectedProcessors.includes(p.id))
    : PROCESSORS;

  const chartSeries = chartProcessors
    .filter(p => metrics[p.id])
    .map(p => ({
      name: p.name,
      data: metrics[p.id].series,
      color: p.color,
    }));

  // Alert thresholds for charts
  const enabledAuthThresholds = thresholds.filter(t => t.enabled && t.metric === 'authorizationRate');
  const enabledRespThresholds = thresholds.filter(t => t.enabled && t.metric === 'responseTime');
  const authThresholdsConfig = {
    warning: enabledAuthThresholds.find(t => t.severity === 'warning')?.value,
    critical: enabledAuthThresholds.find(t => t.severity === 'critical')?.value,
  };
  const respThresholdsConfig = {
    warning: enabledRespThresholds.find(t => t.severity === 'warning')?.value,
    critical: enabledRespThresholds.find(t => t.severity === 'critical')?.value,
  };

  // Time range for drill-down
  const now = new Date();
  const drillDownRange = {
    start: new Date(now.getTime() - TIME_RANGE_MS[timeRange]).toISOString(),
    end: now.toISOString(),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Alert Banner */}
      {(criticalCount > 0 || degradedCount > 0) && (
        <div className={`px-4 py-2.5 flex items-center justify-center gap-2 text-sm ${
          criticalCount > 0 ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-amber-500/10 border-b border-amber-500/20'
        }`}>
          <AlertTriangle size={15} className={criticalCount > 0 ? 'text-red-400' : 'text-amber-400'} />
          <span className={criticalCount > 0 ? 'text-red-300' : 'text-amber-300'}>
            {criticalCount > 0 && `${criticalCount} processor${criticalCount > 1 ? 's' : ''} in critical state`}
            {criticalCount > 0 && degradedCount > 0 && ' | '}
            {degradedCount > 0 && `${degradedCount} processor${degradedCount > 1 ? 's' : ''} degraded`}
          </span>
          {revenueImpact !== null && (
            <>
              <ArrowRight size={14} className={criticalCount > 0 ? 'text-red-400' : 'text-amber-400'} />
              <span className="text-gray-400 text-xs">
                Estimated revenue impact: -{revenueImpact.toFixed(1)}%
              </span>
            </>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2.5 flex items-center justify-center gap-2 text-sm bg-red-500/10 border-b border-red-500/20">
          <span className="text-red-300">{error}</span>
          <button
            onClick={() => { setError(null); fetchProcessors(); }}
            className="text-xs text-red-400 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#1e1e2e] px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Activity size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-100">Processor Health Dashboard</h1>
              <p className="text-xs text-gray-500">Mirage Retail - Real-time payment monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertConfig thresholds={thresholds} onChange={setThresholds} />
            {lastUpdated && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={11} />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => { fetchProcessors(); fetchMetrics(); }}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Processor Health Overview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-gray-500" />
              <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                Processor Health Overview
              </h2>
            </div>
            {selectedProcessors.length > 0 && (
              <button
                onClick={() => setSelectedProcessors([])}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear selection ({selectedProcessors.length})
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-40 bg-[#111119] border border-[#1e1e2e] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <ProcessorGrid
                processors={processorsWithThresholds}
                selectedIds={selectedProcessors}
                onProcessorClick={toggleProcessor}
                onDrillDown={setDrillDownProcessor}
              />
              <p className="text-[11px] text-gray-600 mt-2">
                Click processors to select for comparison (max {MAX_SELECTED_PROCESSORS}). Use &quot;View Transactions&quot; to drill into individual transactions.
              </p>
            </>
          )}
        </section>

        {/* Tab Navigation & Time Range */}
        <div className="flex items-center justify-between border-b border-[#1e1e2e] pb-0">
          <div className="flex items-center gap-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <LineChartIcon size={15} />
              Time Analysis
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'compare'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <BarChart3 size={15} />
              Compare
              {selectedProcessors.length >= 2 && (
                <span className="ml-1 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                  {selectedProcessors.length}
                </span>
              )}
            </button>
          </div>
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Authorization Rate Chart */}
            <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-200">Authorization Rate</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Percentage of approved transactions over time
                  </p>
                </div>
                {selectedProcessors.length === 0 && (
                  <span className="text-[11px] text-gray-600">Showing all processors</span>
                )}
              </div>
              {metricsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <RefreshCw size={20} className="text-gray-600 animate-spin" />
                </div>
              ) : (
                <AuthorizationRateChart series={chartSeries} thresholds={authThresholdsConfig} />
              )}
            </section>

            {/* Response Time Chart */}
            <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-200">Response Time</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    P50 (solid) and P95 (dashed) latency in milliseconds
                  </p>
                </div>
              </div>
              {metricsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <RefreshCw size={20} className="text-gray-600 animate-spin" />
                </div>
              ) : (
                <ResponseTimeChart series={chartSeries} thresholds={respThresholdsConfig} />
              )}
            </section>

            {/* Volume Chart */}
            <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-200">Transaction Volume</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Number of transactions per time bucket
                  </p>
                </div>
              </div>
              {metricsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <RefreshCw size={20} className="text-gray-600 animate-spin" />
                </div>
              ) : (
                <VolumeChart series={chartSeries} />
              )}
            </section>
          </div>
        ) : (
          /* Compare Tab */
          <div className="space-y-6">
            {selectedProcessors.length < 2 ? (
              <div className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-12 text-center">
                <Layers size={40} className="text-gray-700 mx-auto mb-3" />
                <h3 className="text-gray-300 font-medium">Select Processors to Compare</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Click on 2-{MAX_SELECTED_PROCESSORS} processor cards above to compare their performance side-by-side
                </p>
              </div>
            ) : (
              <>
                {/* Comparison Table */}
                <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-200">Side-by-Side Comparison</h3>
                    <div className="flex gap-2">
                      {selectedProcessors.map(id => {
                        const proc = PROCESSORS.find(p => p.id === id);
                        return proc ? (
                          <button
                            key={id}
                            onClick={() => setDrillDownProcessor(id)}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 bg-gray-800/50 px-2 py-1 rounded transition-colors"
                          >
                            <Eye size={11} />
                            {proc.name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <ComparisonTable
                    processors={PROCESSORS.filter(p => selectedProcessors.includes(p.id))}
                    metrics={metrics}
                  />
                </section>

                {/* Comparison Charts */}
                <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">Authorization Rate Comparison</h3>
                  {metricsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw size={20} className="text-gray-600 animate-spin" />
                    </div>
                  ) : (
                    <AuthorizationRateChart series={chartSeries} thresholds={authThresholdsConfig} />
                  )}
                </section>

                <section className="bg-[#111119] border border-[#1e1e2e] rounded-xl p-5">
                  <h3 className="text-sm font-medium text-gray-200 mb-4">Response Time Comparison</h3>
                  {metricsLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <RefreshCw size={20} className="text-gray-600 animate-spin" />
                    </div>
                  ) : (
                    <ResponseTimeChart series={chartSeries} showP95={false} thresholds={respThresholdsConfig} />
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 pb-6">
          {chartProcessors.map(p => (
            <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-3 h-[2px] rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </div>
          ))}
        </div>
      </main>

      {/* Transaction Drill-Down Modal */}
      {drillDownProcessor && (
        <TransactionDrillDown
          processorId={drillDownProcessor}
          processorName={PROCESSORS.find(p => p.id === drillDownProcessor)?.name || ''}
          timeRange={drillDownRange}
          onClose={() => setDrillDownProcessor(null)}
        />
      )}
    </div>
  );
}
