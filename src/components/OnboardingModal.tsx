import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, Key, ArrowRight, ArrowLeft, CheckCircle2, Bot, Terminal, Cpu, ExternalLink } from 'lucide-react';
import { ProviderId, MascotState } from '../types';
import { ProviderTelemetryService } from '../services/providerService';
import { OwlMascot } from './OwlMascot';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApiKeys: (keys: Record<ProviderId, string>) => void;
}

// Full literal Tailwind class strings per provider — Tailwind's compiler needs
// complete class names at build time, so these are never built via string interpolation.
const PROVIDER_META: Record<
  ProviderId,
  { label: string; placeholder: string; url: string; text: string; link: string; icon: React.ReactNode }
> = {
  claude: {
    label: 'Claude Code',
    placeholder: 'sk-ant-...',
    url: 'https://console.anthropic.com/settings/keys',
    text: 'text-amber-300',
    link: 'text-amber-300',
    icon: <Bot className="w-3.5 h-3.5" />,
  },
  antigravity: {
    label: 'Antigravity (Gemini)',
    placeholder: 'AIzaSy...',
    url: 'https://aistudio.google.com/app/apikey',
    text: 'text-cyan-300',
    link: 'text-cyan-300',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  grok: {
    label: 'xAI Grok',
    placeholder: 'xai-...',
    url: 'https://console.x.ai',
    text: 'text-emerald-300',
    link: 'text-emerald-300',
    icon: <Cpu className="w-3.5 h-3.5" />,
  },
  codex: {
    label: 'OpenAI Codex',
    placeholder: 'sk-proj-...',
    url: 'https://platform.openai.com/api-keys',
    text: 'text-purple-300',
    link: 'text-purple-300',
    icon: <Terminal className="w-3.5 h-3.5" />,
  },
};

const PREVIEW_CYCLE: MascotState[] = ['flying', 'alert', 'tired', 'sleeping'];

const PREVIEW_STYLES: Record<MascotState, { title: string; chipActive: string; chipInactive: string }> = {
  // `idle` isn't part of the onboarding tour (it's the "no data yet" resting state),
  // but the map must stay exhaustive over MascotState.
  idle: {
    title: 'text-slate-300',
    chipActive: 'bg-slate-700/40 border-slate-600/60',
    chipInactive: 'bg-slate-900/50 border-slate-800 hover:border-slate-700',
  },
  flying: {
    title: 'text-emerald-300',
    chipActive: 'bg-emerald-500/15 border-emerald-500/40',
    chipInactive: 'bg-slate-900/50 border-slate-800 hover:border-slate-700',
  },
  alert: {
    title: 'text-amber-300',
    chipActive: 'bg-amber-500/15 border-amber-500/40',
    chipInactive: 'bg-slate-900/50 border-slate-800 hover:border-slate-700',
  },
  tired: {
    title: 'text-orange-300',
    chipActive: 'bg-orange-500/15 border-orange-500/40',
    chipInactive: 'bg-slate-900/50 border-slate-800 hover:border-slate-700',
  },
  sleeping: {
    title: 'text-purple-300',
    chipActive: 'bg-purple-500/15 border-purple-500/40',
    chipInactive: 'bg-slate-900/50 border-slate-800 hover:border-slate-700',
  },
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveApiKeys,
}) => {
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [previewState, setPreviewState] = useState<MascotState>('flying');
  const [apiKeys, setApiKeys] = useState<Record<ProviderId, string>>({
    claude: '',
    antigravity: '',
    grok: '',
    codex: '',
  });

  // Cycle the live mascot preview only while step 2 is on screen.
  useEffect(() => {
    if (step !== 2 || !isOpen) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = (i + 1) % PREVIEW_CYCLE.length;
      setPreviewState(PREVIEW_CYCLE[i]);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [step, isOpen]);

  if (!isOpen) return null;

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = (keys: Record<ProviderId, string>) => {
    onSaveApiKeys(keys);
    localStorage.setItem('statusowl_onboarding_completed', 'true');
    onClose();
  };

  const handleSkip = () => finish({ claude: '', antigravity: '', grok: '', codex: '' });
  const handleFinish = () => finish(apiKeys);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-owl-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header / Stepper Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-owl-emerald/20 border border-owl-emerald/40 text-emerald-300 flex items-center justify-center font-bold text-sm">
              🦉
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Welcome to StatusOwl</h2>
              <p className="text-[10px] text-slate-400">Step {step} of 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-6 h-1.5 rounded-full transition-all ${step >= s ? 'bg-owl-emerald' : 'bg-slate-800'}`} />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Skip onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Step 1: What is StatusOwl? */}
              {step === 1 && (
                <div className="p-6 flex flex-col gap-4 text-slate-200">
                  <div className="text-center flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-owl-emerald to-owl-cyan flex items-center justify-center shadow-lg text-3xl mb-1">
                      🦉
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Zero-Friction AI Quota Monitor</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      StatusOwl lives natively in your <span className="text-emerald-400 font-semibold">macOS Menu Bar</span> or{' '}
                      <span className="text-cyan-400 font-semibold">Windows System Tray</span>. Never run out of AI coding quota mid-session!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-2">
                    {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => (
                      <div key={id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1">
                        <span className={`text-xs font-semibold flex items-center gap-1 ${PROVIDER_META[id].text}`}>
                          {PROVIDER_META[id].icon} {PROVIDER_META[id].label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {id === 'claude' && <>Detects a local session in <code className="text-slate-300">~/.claude/</code>.</>}
                          {id === 'antigravity' && <>Detects IDE telemetry in <code className="text-slate-300">~/.gemini/</code>.</>}
                          {id === 'grok' && <>Tracks the 5h CLI rolling window.</>}
                          {id === 'codex' && <>Reads local Codex config &amp; token buckets.</>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Mascot preview */}
              {step === 2 && (
                <div className="p-6 flex flex-col gap-3 text-slate-200">
                  <div className="text-center flex flex-col items-center gap-1">
                    <h3 className="text-base font-bold text-slate-100">Meet Hooty the Status Owl</h3>
                    <p className="text-xs text-slate-400">Hooty reacts live to your quota levels — watch the 4 states below:</p>
                  </div>

                  <div className="flex items-center justify-center py-1 scale-90">
                    <OwlMascot state={previewState} healthScore={50} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {(
                      [
                        ['flying', 'Flying (>70%)', 'Cheerful, glowing wings'],
                        ['alert', 'Alert (30-70%)', 'Attentive, coffee in hand'],
                        ['tired', 'Tired (<30%)', 'Drooping, shivering'],
                        ['sleeping', 'Sleeping (<10%)', 'Snoring, reset countdown'],
                      ] as [MascotState, string, string][]
                    ).map(([state, title, desc]) => (
                      <button
                        key={state}
                        onClick={() => setPreviewState(state)}
                        className={`text-left p-2 rounded-lg border transition-colors ${
                          previewState === state ? PREVIEW_STYLES[state].chipActive : PREVIEW_STYLES[state].chipInactive
                        }`}
                      >
                        <span className={`font-bold block ${PREVIEW_STYLES[state].title}`}>{title}</span>
                        <span className="text-slate-400">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Connect all 4 providers */}
              {step === 3 && (
                <div className="p-6 flex flex-col gap-3 text-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-emerald-400" /> Connect API Keys or Auto-Detect
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Paste a key below. A tool only shows up in your dashboard once its key has
                      been verified with a live request to the provider — nothing is faked or
                      estimated.
                    </p>
                    <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1.5 leading-snug mt-2">
                      These measure the provider's <strong>API</strong> quota — not your Claude Code
                      / Antigravity <strong>subscription</strong> limits. Those are separate
                      systems, and subscription usage isn't exposed to any API.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
                    {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => {
                      const meta = PROVIDER_META[id];
                      const value = apiKeys[id];
                      const isValid = value.trim().length > 0 && ProviderTelemetryService.isValidApiKeyFormat(id, value);
                      return (
                        <div key={id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={`font-semibold font-mono text-[11px] flex items-center gap-1.5 ${meta.text}`}>
                              {meta.icon} {meta.label}
                            </label>
                            <a
                              href={meta.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-[10px] flex items-center gap-1 hover:underline ${meta.link}`}
                            >
                              Get Key <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <input
                            type="password"
                            placeholder={`${meta.placeholder} (or leave blank to auto-detect)`}
                            value={value}
                            onChange={(e) => setApiKeys({ ...apiKeys, [id]: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                          />
                          {value.trim().length > 0 && (
                            <span className={`text-[10px] mt-1 block ${isValid ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {isValid ? '✓ valid key format' : '· unrecognized format for this provider'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => goToStep(step - 1)}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <button onClick={handleSkip} className="px-4 py-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs">
              Skip for now
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => goToStep(step + 1)}
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
