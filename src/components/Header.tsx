import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldCheck, Settings, RefreshCcw, Minus, Rocket, HelpCircle, Move } from 'lucide-react';
import { MascotState } from '../types';

interface HeaderProps {
  healthScore: number;
  mascotState: MascotState;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onRefreshAll: () => void;
  displayMode: 'full' | 'widget' | 'flying-pet';
  onChangeDisplayMode: (mode: 'full' | 'widget' | 'flying-pet') => void;
}

export const Header: React.FC<HeaderProps> = ({
  healthScore,
  mascotState,
  onOpenSettings,
  onOpenOnboarding,
  onRefreshAll,
  displayMode,
  onChangeDisplayMode,
}) => {
  return (
    <header
      data-tauri-drag-region
      className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between select-none cursor-move rounded-t-2xl"
    >
      {/* Title & Drag handle */}
      <div data-tauri-drag-region className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-owl-emerald to-owl-cyan flex items-center justify-center shadow-md text-white font-bold text-sm">
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

        {/* Minimize to menu bar / tray */}
        <button
          onClick={() => invoke('hide_window').catch(() => {})}
          className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Minimize to Menu Bar"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Fly Mascot on Desktop */}
        <button
          onClick={() => onChangeDisplayMode('flying-pet')}
          className={`p-1 rounded-md border transition-all ${
            displayMode === 'flying-pet'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 glow-purple'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700/80 hover:text-purple-300'
          }`}
          title="🚀 Fly Owl Mascot on Desktop Screen!"
        >
          <Rocket className="w-3.5 h-3.5" />
        </button>

        {/* Onboarding / Setup Help Guide */}
        <button
          onClick={onOpenOnboarding}
          className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="View Setup & Onboarding Guide"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors"
          title="Settings & API Keys"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
