import React from 'react';
import { ShieldCheck, Settings, RefreshCcw, Monitor, Sparkles } from 'lucide-react';
import { MascotState } from '../types';

interface HeaderProps {
  healthScore: number;
  mascotState: MascotState;
  onOpenSettings: () => void;
  onRefreshAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  healthScore,
  mascotState,
  onOpenSettings,
  onRefreshAll,
}) => {
  return (
    <header className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between select-none">
      {/* Title & Mascot Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
          🦉
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            StatusOwl
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-slate-400">Mac & Windows AI Quota Monitor</p>
        </div>
      </div>

      {/* Aggregate Health & Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Health Score Pill */}
        <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Health:</span>
          <span
            className={`font-bold ${
              healthScore > 70
                ? 'text-emerald-400'
                : healthScore >= 30
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {healthScore}%
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefreshAll}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Refresh All Telemetry"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
