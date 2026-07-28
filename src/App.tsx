import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { OwlMascot } from './components/OwlMascot';
import { ProviderCard } from './components/ProviderCard';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import {
  deriveMascotState,
  hasLiveData,
  isStale,
  PROVIDERS,
  ProviderService,
} from './services/providerService';
import { MascotState, ProviderId, ProviderSnapshot, UserPreferences } from './types';
import { Activity, Sparkles, Link2, PlusCircle } from 'lucide-react';

const DEFAULT_PREFERENCES: UserPreferences = {
  refreshIntervalSeconds: 30,
  soundNotifications: true,
  desktopNotifications: true,
  alwaysOnTop: true,
  theme: 'dark',
};

export default function App() {
  const [snapshots, setSnapshots] = useState<Partial<Record<ProviderId, ProviderSnapshot>>>({});
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'full' | 'widget' | 'flying-pet'>('full');
  const [mascotPreviewOverride, setMascotPreviewOverride] = useState<MascotState | null>(null);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const previewTimeoutRef = useRef<number | null>(null);

  const refreshAll = useCallback(async () => {
    const all = await ProviderService.fetchAll();
    setSnapshots(all);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('statusowl_onboarding_completed')) {
      setIsOnboardingOpen(true);
    }
    refreshAll();
    return () => {
      if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    };
  }, [refreshAll]);

  // Drives live countdowns and staleness without re-querying every provider.
  useEffect(() => {
    const id = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshAll, preferences.refreshIntervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [refreshAll, preferences.refreshIntervalSeconds]);

  const allSnapshots = PROVIDERS.map((p) => snapshots[p.id]).filter(
    (s): s is ProviderSnapshot => Boolean(s)
  );
  const connected = PROVIDERS.filter((p) => {
    const snap = snapshots[p.id];
    return snap && hasLiveData(snap);
  });
  const unavailable = PROVIDERS.filter((p) => {
    const snap = snapshots[p.id];
    return snap && !hasLiveData(snap);
  });

  const { state: derivedState, worstUsedPercent } = deriveMascotState(allSnapshots, nowSeconds);
  const mascotState = mascotPreviewOverride ?? derivedState;

  // Header shows headroom (100 - used) so "higher is better", matching the mascot.
  const headroom = worstUsedPercent === null ? null : Math.round(100 - worstUsedPercent);

  // Soonest reset among live windows, for the mascot's countdown badge.
  const nextResetSeconds = (() => {
    const candidates = allSnapshots
      .filter((s) => hasLiveData(s) && !isStale(s, nowSeconds))
      .flatMap((s) => s.windows)
      .map((w) => w.resets_at)
      .filter((r): r is number => typeof r === 'number' && r > nowSeconds)
      .map((r) => r - nowSeconds);
    return candidates.length ? Math.min(...candidates) : null;
  })();

  const previewMascotState = (state: MascotState) => {
    setMascotPreviewOverride(state);
    if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = window.setTimeout(() => setMascotPreviewOverride(null), 6000);
  };

  if (displayMode === 'flying-pet') {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-screen bg-transparent flex items-center justify-center cursor-pointer select-none overflow-hidden"
        onClick={() => setDisplayMode('full')}
        title="Click Hooty to open the full panel"
      >
        <OwlMascot
          state={mascotState}
          healthScore={headroom}
          nextResetSeconds={nextResetSeconds}
          hideBadge
          hideGlow
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950/95 text-slate-100 flex flex-col antialiased border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
      <Header
        healthScore={headroom}
        mascotState={mascotState}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onRefreshAll={refreshAll}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
      />

      <main className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
        <div className="glass-panel rounded-2xl p-2.5 flex flex-col items-center justify-center relative overflow-visible shadow-xl border border-slate-800/80">
          <OwlMascot
            state={mascotState}
            healthScore={headroom}
            nextResetSeconds={nextResetSeconds}
            onClick={() => {
              const cycle: Record<MascotState, MascotState> = {
                idle: 'flying',
                flying: 'alert',
                alert: 'tired',
                tired: 'sleeping',
                sleeping: 'flying',
              };
              previewMascotState(cycle[mascotState]);
            }}
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Monitored ({connected.length})
          </h3>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> Connect
          </button>
        </div>

        {connected.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {connected.map((meta) => (
              <ProviderCard
                key={meta.id}
                meta={meta}
                snapshot={snapshots[meta.id]!}
                nowSeconds={nowSeconds}
                onRefresh={async (id) => {
                  const snap = await ProviderService.fetchSnapshot(id as ProviderId);
                  setSnapshots((prev) => ({ ...prev, [id]: snap }));
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
            <Sparkles className="w-8 h-8 text-amber-400 opacity-80" />
            <span className="text-xs font-semibold text-slate-200">Nothing connected yet</span>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Connect Claude Code to read your real 5-hour and weekly limits. A provider only
              appears here once it reports actual numbers — nothing is estimated.
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Connect a provider
            </button>
          </div>
        )}

        {unavailable.length > 0 && (
          <div className="px-1">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-400">Not reporting: </span>
              {unavailable.map((p) => p.name).join(', ')}. Open Settings to see why for each.
            </p>
          </div>
        )}
      </main>

      <footer className="px-3.5 py-1.5 border-t border-slate-900 bg-slate-950 text-center text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>macOS &amp; Windows Status Bar</span>
        <span className="text-emerald-400/90 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> StatusOwl Active
        </span>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={setPreferences}
        snapshots={snapshots}
        onRefreshAll={refreshAll}
        onPreviewMascotState={previewMascotState}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onFinish={refreshAll}
      />
    </div>
  );
}
