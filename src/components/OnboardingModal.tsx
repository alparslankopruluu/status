import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';
import { MascotState, StatuslineStatus } from '../types';
import { ProviderService } from '../services/providerService';
import { OwlMascot } from './OwlMascot';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const PREVIEW_CYCLE: MascotState[] = ['flying', 'alert', 'tired', 'sleeping'];

const PREVIEW_STYLES: Record<MascotState, { title: string; chipActive: string }> = {
  idle: { title: 'text-slate-300', chipActive: 'bg-slate-700/40 border-slate-600/60' },
  flying: { title: 'text-emerald-300', chipActive: 'bg-emerald-500/15 border-emerald-500/40' },
  alert: { title: 'text-amber-300', chipActive: 'bg-amber-500/15 border-amber-500/40' },
  tired: { title: 'text-orange-300', chipActive: 'bg-orange-500/15 border-orange-500/40' },
  sleeping: { title: 'text-purple-300', chipActive: 'bg-purple-500/15 border-purple-500/40' },
};

const CHIP_INACTIVE = 'bg-slate-900/50 border-slate-800 hover:border-slate-700';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onFinish }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [previewState, setPreviewState] = useState<MascotState>('flying');
  const [statusline, setStatusline] = useState<StatuslineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 2 || !isOpen) return;
    let i = 0;
    const interval = window.setInterval(() => {
      i = (i + 1) % PREVIEW_CYCLE.length;
      setPreviewState(PREVIEW_CYCLE[i]);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [step, isOpen]);

  useEffect(() => {
    if (step === 3 && isOpen) ProviderService.statuslineStatus().then(setStatusline);
  }, [step, isOpen]);

  if (!isOpen) return null;

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = () => {
    localStorage.setItem('statusowl_onboarding_completed', 'true');
    onFinish();
    onClose();
  };

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      setStatusline(await ProviderService.installStatusline());
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const slide = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-owl-emerald/20 border border-owl-emerald/40 flex items-center justify-center text-sm">
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
                <div
                  key={s}
                  className={`w-6 h-1.5 rounded-full transition-all ${
                    step >= s ? 'bg-owl-emerald' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={finish}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Skip"
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
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {step === 1 && (
                <div className="p-6 flex flex-col gap-4 text-slate-200">
                  <div className="text-center flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-owl-emerald to-owl-cyan flex items-center justify-center shadow-lg text-3xl mb-1">
                      🦉
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Know before you hit the limit</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      StatusOwl lives in your menu bar and shows how much of each AI coding
                      quota you've actually used — with a live countdown to the next reset.
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 flex flex-col gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Every number is measured, never guessed
                    </span>
                    <p className="text-slate-400 leading-snug">
                      Claude Code reports its real 5-hour and weekly limits through an official
                      status line. Other providers are read from their own local sign-ins and are
                      labelled <span className="text-amber-300">Unofficial</span> so you always
                      know how much to trust a figure.
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="p-6 flex flex-col gap-3 text-slate-200">
                  <div className="text-center flex flex-col items-center gap-1">
                    <h3 className="text-base font-bold text-slate-100">Meet Hooty</h3>
                    <p className="text-xs text-slate-400">
                      Hooty reflects the tightest limit across everything you've connected.
                    </p>
                  </div>

                  <div className="flex items-center justify-center py-1 scale-90">
                    <OwlMascot state={previewState} healthScore={50} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {(
                      [
                        ['flying', 'Plenty left', 'Under 30% used'],
                        ['alert', 'Keep an eye out', '30–70% used'],
                        ['tired', 'Running low', '70–90% used'],
                        ['sleeping', 'Nearly out', 'Over 90% used'],
                      ] as [MascotState, string, string][]
                    ).map(([state, title, desc]) => (
                      <button
                        key={state}
                        onClick={() => setPreviewState(state)}
                        className={`text-left p-2 rounded-lg border transition-colors ${
                          previewState === state ? PREVIEW_STYLES[state].chipActive : CHIP_INACTIVE
                        }`}
                      >
                        <span className={`font-bold block ${PREVIEW_STYLES[state].title}`}>
                          {title}
                        </span>
                        <span className="text-slate-400">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="p-6 flex flex-col gap-3 text-slate-200">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Connect Claude Code
                  </h3>
                  <p className="text-xs text-slate-400 leading-snug">
                    This registers StatusOwl as Claude Code's status line so it can read your real
                    5-hour and weekly limits. Your existing settings are backed up first and left
                    otherwise untouched.
                  </p>

                  {statusline?.overridden_by && (
                    <p className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1.5 leading-snug flex gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>
                        A project-level settings file takes precedence here, so data may not flow
                        while you work in that project.
                      </span>
                    </p>
                  )}

                  {statusline?.installed ? (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-[11px] text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected. Numbers appear after your next Claude Code response.
                    </div>
                  ) : (
                    <button
                      onClick={connect}
                      disabled={busy}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Connect Claude Code
                    </button>
                  )}

                  {error && <p className="text-[10px] text-red-300">{error}</p>}

                  <p className="text-[10px] text-slate-500 leading-snug flex gap-1.5 border-t border-slate-800 pt-2">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      Other providers are picked up automatically from their local sign-ins. You
                      can review each one, and why it may be missing, in Settings.
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => goToStep(step - 1)}
              className="px-4 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <button
              onClick={finish}
              className="px-4 py-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs"
            >
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
              onClick={finish}
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
