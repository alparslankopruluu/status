import React from 'react';
import { ShieldCheck, Settings, RefreshCcw, Minus, X, Pin, Sparkles, Move } from 'lucide-react';
import { MascotState } from '../types';

interface HeaderProps {
  healthScore: number;
  mascotState: MascotState;
  onOpenSettings: () => void;
  onRefreshAll: () => void;
  isWidgetMode: boolean;
  onToggleWidgetMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  healthScore,
  mascotState,
  onOpenSettings,
  onRefreshAll,
  isWidgetMode,
  onToggleWidgetMode,
}) => {
  return (
    <header
      data-tauri-drag-region
      className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between select-none cursor-move rounded-t-2xl"
    >
      {/* Title & Drag handle */}
      <div data-tauri-drag-region className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-md text-white font-bold text-sm">
          🦉
        </div>
        <div data-tauri-drag-region>
          <h1
            data-tauri-drag-region
            className="text-xs font-bold tracking-tight text-slate-100 flex items-center gap-1"
          >
            StatusOwl
            <Move className="w-3 h-3 text-slate-500 opacity-60" />
          </h1>
          <p data-tauri-drag-region className="text-[10px] text-slate-400">
            Desktop AI Monitor
          </p>
        </div>
      </div>

      {/* Quick Actions & Controls */}
      <div className="flex items-center gap-1.5 no-drag">
        {/* Health Score Pill */}
        <div className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 flex items-center gap-1 text-[11px] font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
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

        {/* Refresh */}
        <button
          onClick={onRefreshAll}
          className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Floating Desktop Widget Mode */}
        <button
          onClick={onToggleWidgetMode}
          className={`p-1 rounded-md border transition-colors ${
            isWidgetMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700/80'
          }`}
          title={isWidgetMode ? 'Switch to Full View' : 'Switch to Compact Floating Desktop Widget'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
