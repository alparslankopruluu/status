import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OwlMascot } from './components/OwlMascot';
import { ProviderCard } from './components/ProviderCard';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProviderTelemetryService } from './services/providerService';
import {
  ProviderUsage,
  ProviderId,
  MascotState,
  UserPreferences,
} from './types';
import { Activity, Sparkles, Maximize2, Move, Rocket, Key } from 'lucide-react';

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
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
    claude: '',
    antigravity: '',
    grok: '',
    codex: '',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'full' | 'widget' | 'flying-pet'>('full');
  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right');

  // Check first-time onboarding
  useEffect(() => {
    const completed = localStorage.getItem('statusowl_onboarding_completed');
    if (!completed) {
      setIsOnboardingOpen(true);
    }
  }, []);

  const setMode = (mode: 'full' | 'widget' | 'flying-pet') => {
    setDisplayMode(mode);
    try {
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('set-window-size', mode);
      }
    } catch (e) {}
  };

  const trigger5sFlightEvent = () => {
    try {
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('trigger-5s-flight', mascotState);
      } else {
        setMode('flying-pet');
      }
    } catch (e) {
      setMode('flying-pet');
    }
  };

  useEffect(() => {
    try {
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.on('set-mode', (_: any, mode: 'full' | 'widget' | 'flying-pet') => {
          setDisplayMode(mode);
        });
        ipcRenderer.on('flight-facing', (_: any, direction: 'left' | 'right') => {
          setFacingDirection(direction);
        });
      }
    } catch (e) {}
  }, []);

  // Aggregate health score calculation
  const providerList = Object.values(providers);
  const totalPercent = providerList.reduce((sum, p) => sum + p.remainingPercent, 0);
  const overallHealthScore = Math.round(totalPercent / providerList.length);

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

  const handleRefreshAll = async () => {
    const updated = { ...providers };
    for (const key of Object.keys(updated) as ProviderId[]) {
      updated[key] = await ProviderTelemetryService.fetchProviderMetrics(
        key,
        { apiKeys, customPaths: preferences.customPaths },
        updated[key]
      );
    }
    setProviders(updated);
  };

  const handleRefreshSingle = async (id: string) => {
    const key = id as ProviderId;
    const refreshed = await ProviderTelemetryService.fetchProviderMetrics(
      key,
      { apiKeys, customPaths: preferences.customPaths },
      providers[key]
    );
    setProviders((prev) => ({
      ...prev,
      [key]: refreshed,
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

    trigger5sFlightEvent();
  };

  // 🦅 PURE 5-SECOND FLYING MASCOT NOTIFICATION
  if (displayMode === 'flying-pet') {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-screen bg-transparent flex items-center justify-center cursor-pointer select-none overflow-hidden"
        onClick={() => setMode('full')}
        title="Click Hooty to open full Status Panel!"
      >
        <div
          className={`transition-transform duration-300 ${
            facingDirection === 'left' ? '-scale-x-100' : 'scale-x-100'
          }`}
        >
          <OwlMascot
            state={mascotState}
            healthScore={overallHealthScore}
            nextResetSeconds={nextResetSeconds}
            hideBadge={true}
          />
        </div>
      </div>
    );
  }

  // 📌 Compact Widget Mode
  if (displayMode === 'widget') {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-screen bg-slate-950/95 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-3 flex flex-col items-center justify-between cursor-move select-none shadow-2xl overflow-hidden group"
      >
        <div data-tauri-drag-region className="w-full flex items-center justify-between px-2 pt-1 text-[10px] text-slate-400">
          <span data-tauri-drag-region className="flex items-center gap-1 font-bold text-slate-300">
            <Move className="w-3 h-3 text-cyan-400" /> Desktop Mascot
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={trigger5sFlightEvent}
              className="p-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              title="Trigger 5s Status Flight Event"
            >
              <Rocket className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('full')}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Expand Full Panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <OwlMascot
          state={mascotState}
          healthScore={overallHealthScore}
          nextResetSeconds={nextResetSeconds}
          onClick={() => setMode('full')}
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

  // 🖥️ Full Desktop Popover View
  return (
    <div className="h-screen w-full bg-slate-950/95 text-slate-100 flex flex-col antialiased border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      <Header
        healthScore={overallHealthScore}
        mascotState={mascotState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onRefreshAll={handleRefreshAll}
        displayMode={displayMode}
        onChangeDisplayMode={(mode) => {
          if (mode === 'flying-pet') trigger5sFlightEvent();
          else setMode(mode);
        }}
      />

      <main className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
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
            🚀 Click owl to test 5s status change flight event!
          </span>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Monitored AI Coding Tools
          </h3>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" /> API Keys &amp; Paths
          </button>
        </div>

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

      <footer className="px-3.5 py-1.5 border-t border-slate-900 bg-slate-950 text-center text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>macOS &amp; Windows Status Bar</span>
        <span className="text-emerald-400/90 flex items-center gap-1">
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

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSaveApiKeys={(keys) => {
          setApiKeys(keys);
          handleRefreshAll();
        }}
      />
    </div>
  );
}
