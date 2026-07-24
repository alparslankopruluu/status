import React from 'react';
import { ProviderUsage } from '../types';
import { Bot, Cpu, Sparkles, Terminal, Clock, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, Key } from 'lucide-react';

interface ProviderCardProps {
  provider: ProviderUsage;
  onRefresh?: (id: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onRefresh }) => {
  // Direct target Auth & API Key generation URLs
  const getProviderAuthUrl = (id: string) => {
    switch (id) {
      case 'claude':
        return 'https://console.anthropic.com/settings/keys';
      case 'antigravity':
        return 'https://aistudio.google.com/app/apikey'; // Direct API key creation screen!
      case 'grok':
        return 'https://console.x.ai';
      case 'codex':
        return 'https://platform.openai.com/api-keys';
      default:
        return 'https://github.com';
    }
  };

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
    <div className="glass-card rounded-xl p-3 flex flex-col gap-2 transition-all">
      {/* Top Title & Health Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            {getProviderIcon(provider.id)}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              {provider.name}
            </h4>
            <p className="text-[10px] text-slate-400">{provider.subtitle}</p>
          </div>
        </div>
        {getStatusBadge(provider.remainingPercent)}
      </div>

      {/* Authentication Status Connection Pill — honest, no fabricated "Live" claim */}
      <div
        className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px]"
        title={provider.notes}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-3.5 h-3.5 ${provider.isAuthenticated ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className={`font-semibold ${provider.isAuthenticated ? 'text-emerald-300' : 'text-amber-300'}`}>
            {provider.isAuthenticated ? '🟢 Session Verified' : '🟡 Not Connected'}
          </span>
        </div>
        <span className="font-mono text-slate-400 text-[9px]">{provider.lastUpdated}</span>
      </div>

      {/* Progress Bar & Percentage */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-slate-400 font-medium text-[11px]">
            Remaining Quota {provider.isSimulated && <span className="text-slate-500">(estimated)</span>}
          </span>
          <span className="font-mono font-bold text-slate-100">{provider.remainingPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
              provider.remainingPercent
            )}`}
            style={{ width: `${Math.max(4, provider.remainingPercent)}%` }}
          />
        </div>
      </div>

      {/* Details & Direct Auth Button Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
        <div className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{formatTimer(provider.resetTimerSeconds)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Auth / API Key Web Link */}
          <a
            href={getProviderAuthUrl(provider.id)}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[10px] text-cyan-300 hover:text-cyan-100 transition-colors flex items-center gap-1 font-semibold"
            title={`Open direct API key / Auth page for ${provider.name}`}
          >
            <Key className="w-2.5 h-2.5" />
            <span>Get API Key</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          {onRefresh && (
            <button
              onClick={() => onRefresh(provider.id)}
              className="p-1 hover:text-slate-200 transition-colors text-slate-400"
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
