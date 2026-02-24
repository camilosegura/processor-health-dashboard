'use client';

import { useState } from 'react';
import { AlertThreshold } from '@/types/alerts';
import { DEFAULT_THRESHOLDS } from '@/lib/constants';
import { Settings, X } from 'lucide-react';

interface AlertConfigProps {
  thresholds: AlertThreshold[];
  onChange: (thresholds: AlertThreshold[]) => void;
}

export function AlertConfig({ thresholds, onChange }: AlertConfigProps) {
  const [open, setOpen] = useState(false);

  const activeThresholds = thresholds.length > 0 ? thresholds : DEFAULT_THRESHOLDS;

  const updateThreshold = (id: string, updates: Partial<AlertThreshold>) => {
    onChange(activeThresholds.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 bg-[#111119] border border-[#1e1e2e] hover:border-gray-600/50 transition-all"
      >
        <Settings size={13} />
        Alert Thresholds
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111119] border border-[#1e1e2e] rounded-xl w-full max-w-lg m-4 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-100">Alert Thresholds</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Configure when processors should be flagged as degraded or critical. These thresholds affect processor card status and appear as reference lines on charts.
            </p>

            <div className="space-y-3">
              {activeThresholds.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-lg border border-[#1e1e2e]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => updateThreshold(t.id, { enabled: e.target.checked })}
                      className="rounded border-gray-600"
                    />
                  </label>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-300">
                        {t.metric === 'authorizationRate' ? 'Auth Rate' : 'Response Time'}
                        {' '}{t.operator === 'lt' ? '<' : '>'}{' '}
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={t.value}
                    onChange={(e) => updateThreshold(t.id, { value: parseFloat(e.target.value) })}
                    className="w-20 bg-[#111119] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 text-right"
                    disabled={!t.enabled}
                  />
                  <span className="text-[11px] text-gray-500">
                    {t.metric === 'authorizationRate' ? '%' : 'ms'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
            >
              Apply Thresholds
            </button>
          </div>
        </div>
      )}
    </>
  );
}
