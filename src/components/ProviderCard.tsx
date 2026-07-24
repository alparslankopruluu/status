import React from 'react';
import { ProviderUsage } from '../types';
import { Bot, Cpu, Sparkles, Terminal, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ProviderCardProps {
  provider: ProviderUsage;
  onRefresh?: (id: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onRefresh }) => {
  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'claude':
        return <Bot className="w-5 h-5 text-amber-400" />;
      case 'antigravity':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'grok':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'codex':
        return <Terminal className="w-5 h-5 text-purple-400" />;
      default:
        return <Bot className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (percent: number) => {
    if (percent > 70) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Healthy
        </span>
      );
    }
    if (percent >= 30) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Normal
        </span>
      );
    }
    if (percent >= 10) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Low
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" /> Exhausted
      </span>
    );
  };

  const getProgressColor = (percent: number) => {
    if (percent > 70) return 'bg-gradient-to-r from-emerald-500 to-cyan-500';
    if (percent >= 30) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    if (percent >= 10) return 'bg-gradient-to-r from-orange-500 to-amber-600';
    return 'bg-gradient-to-r from-red-600 to-purple-600';
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m reset`;
  };

  return (
    <div className="glass-card rounded-xl p-3.5 flex flex-col gap-2.5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
            {getProviderIcon(provider.id)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              {provider.name}
            </h4>
            <p className="text-[11px] text-slate-400">{provider.subtitle}</p>
          </div>
        </div>
        {getStatusBadge(provider.remainingPercent)}
      </div>

      {/* Progress Bar & Percentage */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-slate-400 font-medium">Remaining Quota</span>
          <span className="font-mono font-bold text-slate-100">{provider.remainingPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900/80 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              provider.remainingPercent
            )}`}
            style={{ width: `${Math.max(4, provider.remainingPercent)}%` }}
          />
        </div>
      </div>

      {/* Details Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{formatTimer(provider.resetTimerSeconds)}</span>
        </div>
        <div className="flex items-center gap-2">
          {provider.requestsLimit && (
            <span className="font-mono text-slate-400">{provider.requestsLimit}</span>
          )}
          {onRefresh && (
            <button
              onClick={() => onRefresh(provider.id)}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Refresh provider telemetry"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
