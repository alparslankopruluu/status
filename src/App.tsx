import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OwlMascot } from './components/OwlMascot';
import { ProviderCard } from './components/ProviderCard';
import { SettingsModal } from './components/SettingsModal';
import {
  OverallSystemStatus,
  ProviderUsage,
  ProviderId,
  MascotState,
  UserPreferences,
} from './types';
import { Sparkles, Activity, CheckCircle2, AlertOctagon, Terminal, RefreshCw } from 'lucide-react';

const INITIAL_PROVIDERS: Record<ProviderId, ProviderUsage> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    subtitle: '5h Rolling Limit & Org Quota',
    iconName: 'bot',
    remainingPercent: 85,
    status: 'healthy',
    resetTimerSeconds: 12400, // 3h 26m
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
    resetTimerSeconds: 28800, // 8h 00m
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
    resetTimerSeconds: 7200, // 2h 00m
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
    resetTimerSeconds: 15600, // 4h 20m
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute aggregate health score
  const providerList = Object.values(providers);
  const totalPercent = providerList.reduce((sum, p) => sum + p.remainingPercent, 0);
  const overallHealthScore = Math.round(totalPercent / providerList.length);

  // Determine Mascot state dynamically
  const getMascotState = (score: number, items: ProviderUsage[]): MascotState => {
    const hasExhausted = items.some((p) => p.remainingPercent < 10);
    if (hasExhausted || score < 15) return 'sleeping';
    if (score < 35) return 'tired';
    if (score <= 75) return 'alert';
    return 'flying';
  };

  const mascotState = getMascotState(overallHealthScore, providerList);

  // Find minimum reset seconds among providers that are low/exhausted
  const lowProviders = providerList.filter((p) => p.remainingPercent < 40);
  const nextResetSeconds = lowProviders.length
    ? Math.min(...lowProviders.map((p) => p.resetTimerSeconds))
    : 6240;

  // Refresh Telemetry Handler
  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
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
      setIsRefreshing(false);
    }, 600);
  };

  // Single provider refresh
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

  // Simulate mascot states for testing
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

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header Bar */}
      <Header
        healthScore={overallHealthScore}
        mascotState={mascotState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshAll={handleRefreshAll}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Mascot Hero Card */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-slate-800 shadow-xl">
          <OwlMascot
            state={mascotState}
            healthScore={overallHealthScore}
            nextResetSeconds={nextResetSeconds}
            onClick={() => {
              // Cycle state on click for fun user interaction
              if (mascotState === 'flying') handleSimulateState('medium');
              else if (mascotState === 'alert') handleSimulateState('low');
              else if (mascotState === 'tired') handleSimulateState('exhausted');
              else handleSimulateState('high');
            }}
          />

          {/* Quick Click Hint */}
          <span className="text-[10px] text-slate-500 font-mono mt-1 opacity-70 hover:opacity-100 transition-opacity">
            💡 Click owl to preview mascot state transitions
          </span>
        </div>

        {/* AI Tools Section Title */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Monitored AI Coding Tools
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Auto-refresh: {preferences.refreshIntervalSeconds}s
          </span>
        </div>

        {/* Provider Cards List */}
        <div className="grid grid-cols-1 gap-3">
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
      <footer className="px-4 py-2 border-t border-slate-900 bg-slate-950/90 text-center text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>macOS &amp; Windows Ready</span>
        <span className="text-emerald-400/80 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> StatusOwl Active
        </span>
      </footer>

      {/* Preferences Modal */}
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
