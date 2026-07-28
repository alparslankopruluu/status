import React, { useEffect, useState } from 'react';
import { X, Link2, Sparkles, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { MascotState, ProviderId, ProviderSnapshot, StatuslineStatus, UserPreferences } from '../types';
import { PROVIDERS, ProviderService, SOURCE_LABELS } from '../services/providerService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  snapshots: Partial<Record<ProviderId, ProviderSnapshot>>;
  onRefreshAll: () => void;
  onPreviewMascotState: (state: MascotState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  snapshots,
  onRefreshAll,
  onPreviewMascotState,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences);
  const [statusline, setStatusline] = useState<StatuslineStatus | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPrefs(preferences);
    setError(null);
    setConfirming(false);
    ProviderService.statuslineStatus().then(setStatusline);
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const runInstall = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatusline(await ProviderService.installStatusline());
      setConfirming(false);
      onRefreshAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const runUninstall = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatusline(await ProviderService.uninstallStatusline());
      onRefreshAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">StatusOwl Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-4 text-xs text-slate-300">
          {/* Claude Code — the one official source */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Claude Code connection
              </span>
              {statusline?.installed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                  Connected
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Reads your real 5-hour and weekly subscription limits straight from Claude Code's
              official status line. Numbers appear for Claude.ai Pro/Max plans, after the first
              response in a session.
            </p>

            {statusline?.overridden_by && (
              <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1.5 leading-snug flex gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>
                  A project-level settings file (<code>{statusline.overridden_by}</code>) also
                  defines a status line and takes precedence over the user-level one. Remove it
                  there, or StatusOwl won't receive data while you work in that project.
                </span>
              </p>
            )}

            {!statusline?.installed && !confirming && (
              <button
                onClick={() => setConfirming(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Connect Claude Code
              </button>
            )}

            {/* Nothing is written until this is explicitly confirmed. */}
            {confirming && (
              <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2.5 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-200">
                  This will edit {statusline?.settings_path}
                </span>
                <pre className="text-[10px] font-mono text-cyan-300 bg-slate-950 rounded p-2 overflow-x-auto whitespace-pre">
{`"statusLine": {
  "type": "command",
  "command": ${JSON.stringify(statusline?.proposed_command ?? '')}
}`}
                </pre>
                <ul className="text-[10px] text-slate-400 list-disc pl-4 space-y-0.5">
                  <li>A backup is written next to it first.</li>
                  <li>Every other setting is left untouched.</li>
                  {statusline?.current_command && (
                    <li>
                      Your existing status line is wrapped, not replaced — it keeps rendering.
                    </li>
                  )}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={runInstall}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    {busy && <Loader2 className="w-3 h-3 animate-spin" />} Write it
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {statusline?.installed && (
              <button
                onClick={runUninstall}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50 text-xs w-fit"
              >
                Disconnect
              </button>
            )}

            {error && <p className="text-[10px] text-red-300">{error}</p>}
          </div>

          {/* Per-provider status, so "why is this empty" is always answerable */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200">Providers</span>
            <div className="flex flex-col gap-1.5">
              {PROVIDERS.map((p) => {
                const snap = snapshots[p.id];
                return (
                  <div key={p.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">{p.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {snap ? SOURCE_LABELS[snap.source_kind] : '…'}
                      </span>
                    </div>
                    {snap?.note && (
                      <span className="text-[10px] text-slate-500 leading-snug">{snap.note}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug border-t border-slate-800 pt-2">
              Cursor is not supported: its usage is only reachable through browser session
              cookies, which StatusOwl deliberately never reads.
            </p>
          </div>

          {/* Cosmetic only — never touches real data */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Preview Mascot States (Demo)
            </span>
            <p className="text-[10px] text-slate-500 -mt-1">
              Cosmetic preview only — does not change real quota data.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <button
                onClick={() => onPreviewMascotState('flying')}
                className="px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold"
              >
                🟢 Flying
              </button>
              <button
                onClick={() => onPreviewMascotState('alert')}
                className="px-2 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold"
              >
                🟡 Alert
              </button>
              <button
                onClick={() => onPreviewMascotState('tired')}
                className="px-2 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 font-semibold"
              >
                🟠 Tired
              </button>
              <button
                onClick={() => onPreviewMascotState('sleeping')}
                className="px-2 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 font-semibold"
              >
                🔴 Sleeping
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Refresh interval</span>
              <span className="text-[10px] text-slate-400">How often providers are re-read</span>
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

        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSavePreferences(prefs);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors text-xs"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
