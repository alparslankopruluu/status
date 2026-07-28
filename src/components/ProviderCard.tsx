import React from 'react';
import { Bot, Cpu, Sparkles, Terminal, Clock, RefreshCw, Github, ShieldCheck, ShieldAlert, FlaskConical } from 'lucide-react';
import { ProviderMeta, ProviderSnapshot, SourceKind, UsageWindow } from '../types';
import { isStale, SOURCE_LABELS, secondsUntilReset } from '../services/providerService';

interface ProviderCardProps {
  meta: ProviderMeta;
  snapshot: ProviderSnapshot;
  nowSeconds: number;
  onRefresh?: (id: string) => void;
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  claude: <Bot className="w-5 h-5 text-amber-400" />,
  grok: <Cpu className="w-5 h-5 text-emerald-400" />,
  codex: <Terminal className="w-5 h-5 text-purple-400" />,
  gemini: <Sparkles className="w-5 h-5 text-cyan-400" />,
  antigravity: <Sparkles className="w-5 h-5 text-blue-400" />,
  copilot: <Github className="w-5 h-5 text-slate-300" />,
};

/** Full literal class strings — Tailwind needs complete names at build time. */
const SOURCE_STYLES: Record<SourceKind, { chip: string; icon: React.ReactNode }> = {
  official: {
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  unofficial: {
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    icon: <ShieldAlert className="w-3 h-3" />,
  },
  unverified: {
    chip: 'bg-slate-700/40 text-slate-300 border-slate-600/60',
    icon: <FlaskConical className="w-3 h-3" />,
  },
  unavailable: {
    chip: 'bg-slate-800/60 text-slate-400 border-slate-700/60',
    icon: <ShieldAlert className="w-3 h-3" />,
  },
};

function barColor(usedPercent: number): string {
  if (usedPercent >= 90) return 'bg-gradient-to-r from-red-600 to-purple-600';
  if (usedPercent >= 70) return 'bg-gradient-to-r from-orange-500 to-amber-600';
  if (usedPercent >= 30) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
  return 'bg-gradient-to-r from-emerald-500 to-cyan-500';
}

function formatCountdown(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hrs}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatCapturedAt(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WindowRow: React.FC<{ window: UsageWindow; nowSeconds: number; dimmed: boolean }> = ({
  window,
  nowSeconds,
  dimmed,
}) => {
  const remaining = secondsUntilReset(window, nowSeconds);
  const pct = Math.min(100, Math.max(0, window.used_percent));

  return (
    <div className={dimmed ? 'opacity-60' : ''}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-medium text-slate-400">{window.label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-100 text-xs">{pct.toFixed(0)}% used</span>
          {remaining !== null && (
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatCountdown(remaining)}
            </span>
          )}
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden p-0.5 border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </div>
    </div>
  );
};

export const ProviderCard: React.FC<ProviderCardProps> = ({
  meta,
  snapshot,
  nowSeconds,
  onRefresh,
}) => {
  const stale = isStale(snapshot, nowSeconds);
  const source = SOURCE_STYLES[snapshot.source_kind];
  const hasWindows = snapshot.windows.length > 0;

  return (
    <div className="glass-card rounded-xl p-3 flex flex-col gap-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            {PROVIDER_ICONS[meta.id]}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{meta.name}</h4>
            <p className="text-[10px] text-slate-400">{meta.subtitle}</p>
          </div>
        </div>

        {/* Provenance is always visible so an unofficial reading is never mistaken for an official one. */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${source.chip}`}
          title={snapshot.note ?? undefined}
        >
          {source.icon}
          {SOURCE_LABELS[snapshot.source_kind]}
        </span>
      </div>

      {hasWindows ? (
        <div className="flex flex-col gap-2.5">
          {snapshot.windows.map((w) => (
            <WindowRow key={w.label} window={w} nowSeconds={nowSeconds} dimmed={stale} />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 leading-snug px-0.5">{snapshot.note}</p>
      )}

      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500">
        <span className="font-mono">
          {hasWindows
            ? stale
              ? `as of ${formatCapturedAt(snapshot.captured_at)}`
              : 'current'
            : '—'}
        </span>
        {onRefresh && (
          <button
            onClick={() => onRefresh(meta.id)}
            className="p-1 hover:text-slate-200 transition-colors text-slate-400"
            title="Refresh this provider"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
