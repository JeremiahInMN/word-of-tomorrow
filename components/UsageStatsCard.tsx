import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, Download, Trash2 } from 'lucide-react';
import { UsageStats, exportUsageLogs, clearUsageLogs } from '../services/usage-tracking';

interface UsageStatsCardProps {
  stats: UsageStats;
  onRefresh: () => void;
}

export const UsageStatsCard: React.FC<UsageStatsCardProps> = ({ stats, onRefresh }) => {
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all usage logs? This cannot be undone.')) {
      clearUsageLogs();
      onRefresh();
    }
  };

  const handleExport = () => {
    exportUsageLogs();
  };

  return (
    <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40 flex items-center gap-2">
          <DollarSign size={14} /> API Usage & Costs
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="text-xs text-ink/60 hover:text-ink flex items-center gap-1 px-2 py-1 rounded hover:bg-ink/5"
            title="Export usage logs"
          >
            <Download size={12} /> Export
          </button>
          <button
            onClick={handleClearLogs}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Clear all logs"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-paper rounded p-3 border border-ink/5">
          <div className="text-xs text-ink/40 mb-1">Today</div>
          <div className="text-2xl font-bold text-ink">
            ${stats.todayCost.toFixed(4)}
          </div>
        </div>
        <div className="bg-paper rounded p-3 border border-ink/5">
          <div className="text-xs text-ink/40 mb-1">This Month</div>
          <div className="text-2xl font-bold text-ink">
            ${stats.monthCost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Call Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm py-1 border-b border-ink/5">
          <span className="text-ink/60">Text Generations</span>
          <span className="font-mono text-ink">{stats.textCalls}</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-ink/5">
          <span className="text-ink/60">Image Generations</span>
          <span className="font-mono text-ink">{stats.imageCalls}</span>
        </div>
        <div className="flex justify-between text-sm py-1 border-b border-ink/5">
          <span className="text-ink/60">Audio Generations</span>
          <span className="font-mono text-ink">{stats.audioCalls}</span>
        </div>
        <div className="flex justify-between text-sm py-1 font-bold">
          <span className="text-ink">Total API Calls</span>
          <span className="font-mono text-ink">{stats.totalCalls}</span>
        </div>
      </div>

      {/* Success Rate */}
      <div className="flex items-center justify-between text-sm p-2 bg-paper rounded border border-ink/5">
        <span className="text-ink/60">Success Rate</span>
        <span className="font-mono text-ink">
          {stats.totalCalls > 0 
            ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1) 
            : 0}%
        </span>
      </div>

      {/* Total Estimated Cost */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <TrendingUp size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
              Total Estimated Cost
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${stats.totalEstimatedCost.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Warning if costs are high */}
      {stats.monthCost > 5 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-xs text-yellow-900 dark:text-yellow-100">
              You've spent over $5 this month. Consider setting a budget alert in Google Cloud Console.
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-ink/40 text-center">
        Costs are estimates based on typical Gemini API pricing
      </div>
    </div>
  );
};
