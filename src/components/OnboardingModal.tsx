import React, { useState } from 'react';
import { X, Sparkles, Shield, Rocket, Key, ArrowRight, CheckCircle2, Bot, Terminal, Cpu, ExternalLink } from 'lucide-react';
import { ProviderId } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApiKeys: (keys: Record<ProviderId, string>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveApiKeys,
}) => {
  const [step, setStep] = useState<number>(1);
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
    claude: '',
    antigravity: '',
    grok: '',
    codex: '',
  });

  if (!isOpen) return null;

  const handleFinish = () => {
    onSaveApiKeys(apiKeys);
    localStorage.setItem('statusowl_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header / Stepper Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
              🦉
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Welcome to StatusOwl</h2>
              <p className="text-[10px] text-slate-400">Step {step} of 3</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
            <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
            <div className={`w-6 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
          </div>
        </div>

        {/* Step 1: What is StatusOwl? */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-4 text-slate-200">
            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg text-3xl mb-1">
                🦉
              </div>
              <h3 className="text-lg font-bold text-slate-100">Zero-Friction AI Quota Monitor</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                StatusOwl lives natively in your <span className="text-emerald-400 font-semibold">macOS Menu Bar</span> or <span className="text-cyan-400 font-semibold">Windows System Tray</span>. Never run out of AI coding quota mid-session!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> Claude Code
                </span>
                <span className="text-[11px] text-slate-400">Auto-detects 5h rolling limit &amp; org tokens from <code className="text-slate-300">~/.claude/</code>.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Antigravity (Gemini)
                </span>
                <span className="text-[11px] text-slate-400">Monitors Gemini 3.6 Flash/Pro IDE telemetry from <code className="text-slate-300">~/.gemini/</code>.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> xAI Grok
                </span>
                <span className="text-[11px] text-slate-400">Tracks 5h CLI window usage and replenish reset timers.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> OpenAI Codex
                </span>
                <span className="text-[11px] text-slate-400">Reads local Codex config and token rate limit buckets.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mascot & 5s Status Flight Event */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4 text-slate-200">
            <div className="text-center flex flex-col items-center gap-1">
              <h3 className="text-base font-bold text-slate-100">Meet Hooty the Status Owl 🦅</h3>
              <p className="text-xs text-slate-400">
                Hooty reacts dynamically to your quota levels with 4 expressive states:
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <span className="text-xl">🟢</span>
                <div>
                  <span className="font-bold text-emerald-300 block">Flying / Soaring (&gt;70% Quota)</span>
                  <span className="text-[11px] text-slate-400">Cheerful flapping wings, green aura. Full energy!</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <span className="text-xl">🟡</span>
                <div>
                  <span className="font-bold text-amber-300 block">Perched &amp; Alert (30% - 70%)</span>
                  <span className="text-[11px] text-slate-400">Attentive blinking eyes with steam-rising coffee mug.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3">
                <span className="text-xl">🟠</span>
                <div>
                  <span className="font-bold text-orange-300 block">Tired / Low Quota (&lt;30%)</span>
                  <span className="text-[11px] text-slate-400">Drooping wings, sweat drop, shivering warning posture.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <span className="font-bold text-purple-300 block">5-Second Desktop Flight Event</span>
                  <span className="text-[11px] text-slate-400">When status changes, Hooty flies across your desktop for 5 seconds and vanishes into the menu bar corner!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Auth & Direct API Key Generation Links */}
        {step === 3 && (
          <div className="p-6 flex flex-col gap-4 text-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" /> Connect API Keys or Auto-Detect
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                StatusOwl automatically detects local session logs (<code className="text-slate-300">~/.claude/</code>, <code className="text-slate-300">~/.gemini/</code>). You can also generate &amp; paste API keys below:
              </p>
            </div>

            {/* Direct API Key Generation Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 flex items-center justify-between transition-colors font-semibold"
              >
                <span>Get Claude Key 🔑</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 flex items-center justify-between transition-colors font-semibold"
              >
                <span>Get Gemini Key 🔑</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-between transition-colors font-semibold"
              >
                <span>Get Grok Key 🔑</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 flex items-center justify-between transition-colors font-semibold"
              >
                <span>Get Codex Key 🔑</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-amber-300 font-semibold font-mono text-[11px] block mb-1">Claude API Key (Optional):</label>
                <input
                  type="password"
                  placeholder="sk-ant-... (or leave blank to use ~/.claude/ auto-detect)"
                  value={apiKeys.claude}
                  onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-cyan-300 font-semibold font-mono text-[11px] block mb-1">Gemini Key (Optional):</label>
                <input
                  type="password"
                  placeholder="AIzaSy... (or leave blank to use ~/.gemini/ auto-detect)"
                  value={apiKeys.antigravity}
                  onChange={(e) => setApiKeys({ ...apiKeys, antigravity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors text-xs flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 font-bold text-white transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              Get Started <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
