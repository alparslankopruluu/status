import React, { useState } from 'react';
import { X, Sliders, Bell, Folder, Key, Shield, Volume2 } from 'lucide-react';
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
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
    claude: '',
    antigravity: '',
    grok: '',
    codex: '',
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">StatusOwl Setup &amp; API Keys</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 text-xs text-slate-300">
          {/* API Keys Configuration */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> AI Provider API Keys (Optional)
            </span>
            <p className="text-[11px] text-slate-400">
              Enter custom keys for direct rate-limit header checks:
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-amber-300 font-mono block mb-1">Claude Code (Anthropic API Key):</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKeys.claude}
                  onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-cyan-300 font-mono block mb-1">Antigravity / Gemini Key:</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeys.antigravity}
                  onChange={(e) => setApiKeys({ ...apiKeys, antigravity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-emerald-300 font-mono block mb-1">xAI Grok API Key:</label>
                <input
                  type="password"
                  placeholder="xai-..."
                  value={apiKeys.grok}
                  onChange={(e) => setApiKeys({ ...apiKeys, grok: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-purple-300 font-mono block mb-1">OpenAI Codex Key:</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={apiKeys.codex}
                  onChange={(e) => setApiKeys({ ...apiKeys, codex: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test Mascot Animations */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Mascot State Testing
            </span>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <button
                onClick={() => onSimulateState('high')}
                className="px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold"
              >
                🟢 Flying (&gt;70%)
              </button>
              <button
                onClick={() => onSimulateState('medium')}
                className="px-2 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
              >
                🟡 Alert (30-70%)
              </button>
              <button
                onClick={() => onSimulateState('low')}
                className="px-2 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 font-semibold"
              >
                🟠 Tired (&lt;30%)
              </button>
              <button
                onClick={() => onSimulateState('exhausted')}
                className="px-2 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-semibold"
              >
                🔴 Sleeping (0%)
              </button>
            </div>
          </div>

          {/* Polling Interval */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Telemetry Polling Rate</span>
              <span className="text-[10px] text-slate-400">Background refresh interval</span>
            </div>
            <select
              value={prefs.refreshIntervalSeconds}
              onChange={(e) =>
                setPrefs({ ...prefs, refreshIntervalSeconds: Number(e.target.value) })
              }
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors text-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
