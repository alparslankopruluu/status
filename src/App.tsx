import React, { useState } from 'react';
import { Header } from './components/Header';
import { OwlMascot } from './components/OwlMascot';
import { ProviderCard } from './components/ProviderCard';
import { SettingsModal } from './components/SettingsModal';
import {
  ProviderUsage,
  ProviderId,
  MascotState,
  UserPreferences,
} from './types';
import { Activity, Sparkles, Maximize2, Move, Key } from 'lucide-react';

const INITIAL_PROVIDERS: Record<ProviderId, ProviderUsage> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    subtitle: '5h Rolling Limit & Org Quota',
    iconName: 'bot',
    remainingPercent: 85,
    status: 'healthy',
    resetTimerSeconds: 12400,
    requestsLimit: '1.2M / 1.5M tokens',
    lastUpdated: 'Just now',
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity (Gemini)',
    subtitle: 'IDE Telemetry & Model Limits',
    iconName: 'sparkles',
    remainingPercent: 92,
    status: 'healthy',
    resetTimerSeconds: 28800,
    requestsLimit: 'Daily Pro Tier',
    lastUpdated: 'Just now',
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    subtitle: 'Grok 3 & CLI Window',
    iconName: 'cpu',
    remainingPercent: 78,
    status: 'healthy',
    resetTimerSeconds: 7200,
    requestsLimit: '5h Window Limit',
    lastUpdated: 'Just now',
  },
  codex: {
    id: 'codex',
    name: 'OpenAI Codex',
    subtitle: 'Agent Skills & Token Bucket',
    iconName: 'terminal',
    remainingPercent: 64,
    status: 'healthy',
    resetTimerSeconds: 15600,
    requestsLimit: 'Tier 4 API',
    lastUpdated: 'Just now',
  },
};

const DEFAULT_PREFERENCES: UserPreferences = {
  refreshIntervalSeconds: 30,
  soundNotifications: true,
  desktopNotifications: true,
  alwaysOnTop: true,
  theme: 'dark',
  customPaths: {
    claude: '~/.claude/',
    antigravity: '~/.gemini/antigravity-ide/',
    grok: '~/.grok/',
    codex: '~/.codex/',
  },
};

export default function App() {
  const [providers, setProviders] = useState<Record<ProviderId, ProviderUsage>>(INITIAL_PROVIDERS);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWidgetMode, setIsWidgetMode] = useState(false);

  // Aggregate health calculation
  const providerList = Object.values(providers);
  const totalPercent = providerList.reduce((sum, p) => sum + p.remainingPercent, 0);
  const overallHealthScore = Math.round(totalPercent / providerList.length);

  // Dynamic mascot state calculation
  const getMascotState = (score: number, items: ProviderUsage[]): MascotState => {
    const hasExhausted = items.some((p) => p.remainingPercent < 10);
    if (hasExhausted || score < 15) return 'sleeping';
    if (score < 35) return 'tired';
    if (score <= 75) return 'alert';
    return 'flying';
  };

  const mascotState = getMascotState(overallHealthScore, providerList);

  const lowProviders = providerList.filter((p) => p.remainingPercent < 40);
  const nextResetSeconds = lowProviders.length
    ? Math.min(...lowProviders.map((p) => p.resetTimerSeconds))
    : 6240;

  const handleRefreshAll = () => {
    setProviders((prev) => {
      const next = { ...prev };
      (Object.keys(next) as ProviderId[]).forEach((key) => {
        next[key] = {
          ...next[key],
          lastUpdated: 'Just now',
        };
      });
      return next;
    });
  };

  const handleRefreshSingle = (id: string) => {
    const key = id as ProviderId;
    setProviders((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        lastUpdated: 'Just now',
      },
    }));
  };

  const handleSimulateState = (mode: 'high' | 'medium' | 'low' | 'exhausted') => {
    setProviders((prev) => {
      const next = { ...prev };
      if (mode === 'high') {
        next.claude.remainingPercent = 90;
        next.antigravity.remainingPercent = 95;
        next.grok.remainingPercent = 88;
        next.codex.remainingPercent = 82;
      } else if (mode === 'medium') {
        next.claude.remainingPercent = 55;
        next.antigravity.remainingPercent = 60;
        next.grok.remainingPercent = 48;
        next.codex.remainingPercent = 50;
      } else if (mode === 'low') {
        next.claude.remainingPercent = 22;
        next.antigravity.remainingPercent = 28;
        next.grok.remainingPercent = 18;
        next.codex.remainingPercent = 25;
      } else if (mode === 'exhausted') {
        next.claude.remainingPercent = 5;
        next.antigravity.remainingPercent = 80;
        next.grok.remainingPercent = 0;
        next.codex.remainingPercent = 12;
      }
      return next;
    });
  };

  // Compact Floating Desktop Mascot Widget View
  if (isWidgetMode) {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-screen bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-3 flex flex-col items-center justify-between cursor-move select-none shadow-2xl overflow-hidden group"
      >
        <div data-tauri-drag-region className="w-full flex items-center justify-between px-2 pt-1 text-[10px] text-slate-400">
          <span data-tauri-drag-region className="flex items-center gap-1 font-bold text-slate-300">
            <Move className="w-3 h-3 text-cyan-400" /> Desktop Mascot
          </span>
          <button
            onClick={() => setIsWidgetMode(false)}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Expand Full Panel"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <OwlMascot
          state={mascotState}
          healthScore={overallHealthScore}
          nextResetSeconds={nextResetSeconds}
          onClick={() => setIsWidgetMode(false)}
        />

        <div data-tauri-drag-region className="pb-1 text-[11px] font-mono text-center">
          <span className="text-slate-400">Health: </span>
          <span
            className={`font-bold ${
              overallHealthScore > 70
                ? 'text-emerald-400'
                : overallHealthScore >= 30
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {overallHealthScore}%
          </span>
        </div>
      </div>
    );
  }

  // Full Desktop Popover View
  return (
    <div className="h-screen w-full bg-slate-950/95 text-slate-100 flex flex-col antialiased border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <Header
        healthScore={overallHealthScore}
        mascotState={mascotState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshAll={handleRefreshAll}
        isWidgetMode={isWidgetMode}
        onToggleWidgetMode={() => setIsWidgetMode(true)}
      />

      {/* Main Scrollable Content */}
      <main className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
        {/* Mascot Hero Card (Overflow Visible to avoid cutoff) */}
        <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-visible shadow-xl border border-slate-800/80">
          <OwlMascot
            state={mascotState}
            healthScore={overallHealthScore}
            nextResetSeconds={nextResetSeconds}
            onClick={() => {
              if (mascotState === 'flying') handleSimulateState('medium');
              else if (mascotState === 'alert') handleSimulateState('low');
              else if (mascotState === 'tired') handleSimulateState('exhausted');
              else handleSimulateState('high');
            }}
          />

          <span className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-75 hover:opacity-100 transition-opacity">
            💡 Click owl to test mascot state animations
          </span>
        </div>

        {/* AI Tools Section Title */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Monitored AI Coding Tools
          </h3>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" /> API Keys / Paths
          </button>
        </div>

        {/* Provider Cards List */}
        <div className="grid grid-cols-1 gap-2.5">
          {providerList.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onRefresh={handleRefreshSingle}
            />
          ))}
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="px-3.5 py-1.5 border-t border-slate-900 bg-slate-950 text-center text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>macOS &amp; Windows Native Bar</span>
        <span className="text-emerald-400/90 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> StatusOwl Active
        </span>
      </footer>

      {/* Preferences & API Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={(newPrefs) => setPreferences(newPrefs)}
        onSimulateState={handleSimulateState}
      />
    </div>
  );
}
