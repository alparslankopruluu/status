import React, { useState } from 'react';
import { X, Sliders, Bell, Folder, RefreshCw, Volume2, Shield } from 'lucide-react';
import { UserPreferences, ProviderId } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (newPrefs: UserPreferences) => void;
  onSimulateState: (state: 'high' | 'medium' | 'low' | 'exhausted') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onSimulateState,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">StatusOwl Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300">
          {/* Quick Mascot State Simulation */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" /> Test Owl Mascot Animations
            </span>
            <p className="text-[11px] text-slate-400">
              Force test mascot states (Flying, Alert, Tired, Sleeping):
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => onSimulateState('high')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold"
              >
                🟢 Flying (&gt;70%)
              </button>
              <button
                onClick={() => onSimulateState('medium')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
              >
                🟡 Alert (30-70%)
              </button>
              <button
                onClick={() => onSimulateState('low')}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 font-semibold"
              >
                🟠 Tired (&lt;30%)
              </button>
              <button
                onClick={() => onSimulateState('exhausted')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-semibold"
              >
                🔴 Sleeping (0%)
              </button>
            </div>
          </div>

          {/* Polling Interval */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Telemetry Refresh Interval</span>
              <span className="text-[11px] text-slate-400">How often to poll local AI session logs</span>
            </div>
            <select
              value={prefs.refreshIntervalSeconds}
              onChange={(e) =>
                setPrefs({ ...prefs, refreshIntervalSeconds: Number(e.target.value) })
              }
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value={15}>15 sec</option>
              <option value={30}>30 sec</option>
              <option value={60}>1 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> Desktop Notifications on Low Quota
              </span>
              <input
                type="checkbox"
                checked={prefs.desktopNotifications}
                onChange={(e) => setPrefs({ ...prefs, desktopNotifications: e.target.checked })}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Mascot Audio Alerts
              </span>
              <input
                type="checkbox"
                checked={prefs.soundNotifications}
                onChange={(e) => setPrefs({ ...prefs, soundNotifications: e.target.checked })}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
            </label>
          </div>

          {/* Configured Paths */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-amber-400" /> Telemetry Storage Paths
            </span>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-400">
                <span>Claude Code:</span>
                <span className="text-emerald-400">~/.claude/</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-400">
                <span>Antigravity:</span>
                <span className="text-cyan-400">~/.gemini/antigravity-ide/</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-400">
                <span>Grok xAI:</span>
                <span className="text-amber-400">~/.grok/</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-slate-400">
                <span>Codex:</span>
                <span className="text-purple-400">~/.codex/</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
