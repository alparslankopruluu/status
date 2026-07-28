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
import { Activity, Sparkles, Maximize2, Move, Rocket, Key, PlusCircle, ShieldAlert } from 'lucide-react';

// No seeded percentages, reset timers or quota strings live here on purpose: every
// number the user sees must come from a real provider response. Anything unknown
// stays `undefined` so the UI can honestly render "no data" instead of a placeholder.
const INITIAL_PROVIDERS: Record<ProviderId, ProviderUsage> = {
  claude: {
    id: 'claude',
    name: 'Claude Code',
    subtitle: 'Anthropic API quota (not your subscription)',
    iconName: 'bot',
    lastUpdated: 'Not connected',
    isAuthenticated: false,
    hasQuotaData: false,
  },
  antigravity: {
    id: 'antigravity',
    name: 'Antigravity (Gemini)',
    subtitle: 'Google Gemini API quota',
    iconName: 'sparkles',
    lastUpdated: 'Not connected',
    isAuthenticated: false,
    hasQuotaData: false,
  },
  grok: {
    id: 'grok',
    name: 'xAI Grok',
    subtitle: 'xAI API quota',
    iconName: 'cpu',
    lastUpdated: 'Not connected',
    isAuthenticated: false,
    hasQuotaData: false,
  },
  codex: {
    id: 'codex',
    name: 'OpenAI Codex',
    subtitle: 'OpenAI API quota',
    iconName: 'terminal',
    lastUpdated: 'Not connected',
    isAuthenticated: false,
    hasQuotaData: false,
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
  const [mascotPreviewOverride, setMascotPreviewOverride] = useState<MascotState | null>(null);
  const previewTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem('statusowl_onboarding_completed');
    if (!completed) {
      setIsOnboardingOpen(true);
    }
    // Detect real local sessions / configured keys as soon as the app opens.
    handleRefreshAll();
    return () => {
      if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Only list providers whose API key was actually verified live with the provider.
  // Merely finding a local session folder proves the tool is installed, not that we
  // can read any quota from it — so those are deliberately kept out of the list.
  const providerList = Object.values(providers);
  const authenticatedProviders = providerList.filter(
    (p) => p.isAuthenticated && p.authMethod === 'api-key'
  );
  const installedButUnreadable = providerList.filter((p) => p.authMethod === 'local-session');

  // Health score comes ONLY from providers that returned a real rate-limit header.
  // With no real numbers at all the score is null — the UI renders "—" rather than
  // inventing a reassuring 100.
  const scorableProviders = authenticatedProviders.filter(
    (p) => p.hasQuotaData && typeof p.remainingPercent === 'number'
  );
  const overallHealthScore: number | null = scorableProviders.length
    ? Math.round(
        scorableProviders.reduce((sum, p) => sum + (p.remainingPercent ?? 0), 0) /
          scorableProviders.length
      )
    : null;

  const getMascotState = (score: number | null, items: ProviderUsage[]): MascotState => {
    if (score === null) return 'idle';
    const hasExhausted = items.some((p) => (p.remainingPercent ?? 100) < 10);
    if (hasExhausted || score < 15) return 'sleeping';
    if (score < 35) return 'tired';
    if (score <= 75) return 'alert';
    return 'flying';
  };

  // A manual "Preview Mascot States (Demo)" click always wins over real telemetry,
  // and reverts on its own — it must never leave fabricated numbers sitting in
  // real provider data (that was the old bug).
  const mascotState = mascotPreviewOverride ?? getMascotState(overallHealthScore, scorableProviders);

  const lowProviders = scorableProviders.filter((p) => (p.remainingPercent ?? 100) < 40);
  const resetCandidates = lowProviders
    .map((p) => p.resetTimerSeconds)
    .filter((s): s is number => typeof s === 'number');
  const nextResetSeconds: number | null = resetCandidates.length
    ? Math.min(...resetCandidates)
    : null;

  // Accepts an explicit key set so callers that just called setApiKeys() (an async
  // state update) can refresh against the NEW keys instead of a stale closure value.
  const handleRefreshAll = async (keysOverride?: Record<ProviderId, string>) => {
    const activeKeys = keysOverride ?? apiKeys;
    const updated = { ...providers };
    for (const key of Object.keys(updated) as ProviderId[]) {
      updated[key] = await ProviderTelemetryService.fetchProviderMetrics(
        key,
        { apiKeys: activeKeys, customPaths: preferences.customPaths },
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

  // Pure UI preview of a mascot state — never touches real provider telemetry,
  // and deliberately does NOT trigger the desktop flying-pet takeover (that's a
  // separate, explicit action via the Rocket buttons). Auto-reverts after a few seconds.
  const handlePreviewMascotState = (state: MascotState) => {
    setMascotPreviewOverride(state);
    if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = window.setTimeout(() => setMascotPreviewOverride(null), 6000);
  };

  // 🦅 5-SECOND FLYING MASCOT NOTIFICATION
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
            hideGlow={true}
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
              overallHealthScore === null
                ? 'text-slate-500'
                : overallHealthScore > 70
                ? 'text-emerald-400'
                : overallHealthScore >= 30
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {overallHealthScore === null ? '—' : `${overallHealthScore}%`}
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
              const cycle: Record<MascotState, MascotState> = {
                idle: 'flying',
                flying: 'alert',
                alert: 'tired',
                tired: 'sleeping',
                sleeping: 'flying',
              };
              handlePreviewMascotState(cycle[mascotState]);
            }}
          />

          <span className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-75 hover:opacity-100 transition-opacity">
            🚀 Click owl to test 5s status change flight event!
          </span>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Monitored AI Coding Tools ({authenticatedProviders.length})
          </h3>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Key className="w-3 h-3" /> Connect Tools
          </button>
        </div>

        {/* Filtered Active Provider Cards List */}
        {authenticatedProviders.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {authenticatedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onRefresh={handleRefreshSingle}
              />
            ))}
          </div>
        ) : (
          /* Empty State when no API key has been verified yet */
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <ShieldAlert className="w-8 h-8 text-amber-400 opacity-80" />
            <span className="text-xs font-semibold text-slate-200">No Verified AI Tools Yet</span>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Add an API key to monitor a provider's live quota. A tool only appears here once
              its key has been verified with the provider — nothing is estimated.
            </p>
            {installedButUnreadable.length > 0 && (
              <p className="text-[10px] text-slate-500 max-w-xs">
                Detected on this machine but exposing no readable quota:{' '}
                {installedButUnreadable.map((p) => p.name).join(', ')}.
              </p>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Connect AI Tools
            </button>
          </div>
        )}
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
        apiKeys={apiKeys}
        onSaveApiKeys={(keys) => {
          setApiKeys(keys);
          handleRefreshAll(keys);
        }}
        onPreviewMascotState={handlePreviewMascotState}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSaveApiKeys={(keys) => {
          setApiKeys(keys);
          handleRefreshAll(keys);
        }}
      />
    </div>
  );
}
