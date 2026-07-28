import React from 'react';
import { MascotState } from '../types';

interface OwlMascotProps {
  state: MascotState;
  healthScore: number | null;
  /** `null`/omitted when no real reset header was returned — the countdown is then hidden. */
  nextResetSeconds?: number | null;
  hideBadge?: boolean;
  /** Skip the blurred color aura behind the owl — for contexts (like the free-floating
   * desktop pet) where the owl must read as just a bird, with nothing behind it. */
  hideGlow?: boolean;
  onClick?: () => void;
}

export const OwlMascot: React.FC<OwlMascotProps> = ({
  state,
  healthScore,
  nextResetSeconds = null,
  hideBadge = false,
  hideGlow = false,
  onClick,
}) => {
  // `idle` means we have no real quota data at all. It reuses the calm perched
  // silhouette but is desaturated to neutral grey and makes no health claim, so the
  // mascot can never imply "healthy" from data we don't actually have.
  const isIdle = state === 'idle';
  const shape: Exclude<MascotState, 'idle'> = state === 'idle' ? 'alert' : state;

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m reset`;
    return `${mins}m ${secs}s reset`;
  };

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-0 bg-transparent cursor-pointer group select-none transition-all duration-300"
    >
      {/* Glow Aura Background — omitted when hideGlow is set, and when idle (a colored
          aura would read as a status signal we don't have data for). */}
      {!hideGlow && !isIdle && (
        <div
          className={`absolute inset-0 rounded-full blur-2xl opacity-25 transition-all duration-500 pointer-events-none ${
            shape === 'flying'
              ? 'bg-emerald-400 scale-110'
              : shape === 'alert'
              ? 'bg-amber-400 scale-100'
              : shape === 'tired'
              ? 'bg-orange-500 scale-95'
              : 'bg-purple-600 scale-105 animate-pulse'
          }`}
        />
      )}

      {/* SVG Canvas Container */}
      <div
        className={`relative z-10 py-0 transition-transform duration-500 ${
          isIdle ? 'grayscale opacity-60' : ''
        } ${
          shape === 'flying'
            ? 'animate-float-slow'
            : shape === 'tired'
            ? 'animate-shiver'
            : ''
        }`}
      >
        <svg
          width="130"
          height="125"
          viewBox="0 0 140 145"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-2xl overflow-visible"
        >
          {/* Wings */}
          {shape === 'flying' ? (
            <>
              <path
                d="M 28 65 C 10 45, 5 30, 20 22 C 32 16, 42 40, 48 58 Z"
                fill="#10B981"
                className="animate-wing-flap origin-right"
              />
              <path
                d="M 112 65 C 130 45, 135 30, 120 22 C 108 16, 98 40, 92 58 Z"
                fill="#10B981"
                className="animate-wing-flap origin-left"
              />
            </>
          ) : shape === 'alert' ? (
            <>
              <path d="M 30 58 C 18 64, 16 84, 38 86 Z" fill="#F59E0B" />
              <path d="M 110 58 C 122 64, 124 84, 102 86 Z" fill="#F59E0B" />
            </>
          ) : shape === 'tired' ? (
            <>
              <path d="M 32 65 C 18 78, 20 98, 36 92 Z" fill="#F97316" />
              <path d="M 108 65 C 122 78, 120 98, 104 92 Z" fill="#F97316" />
            </>
          ) : (
            <>
              <path d="M 32 72 C 16 85, 25 105, 42 96 Z" fill="#8B5CF6" />
              <path d="M 108 72 C 124 85, 115 105, 98 96 Z" fill="#8B5CF6" />
            </>
          )}

          {/* Owl Body Base */}
          <ellipse
            cx="70"
            cy="75"
            rx="40"
            ry="44"
            fill={
              shape === 'flying'
                ? '#059669'
                : shape === 'alert'
                ? '#D97706'
                : shape === 'tired'
                ? '#EA580C'
                : '#7C3AED'
            }
          />

          {/* Belly Feather Patch */}
          <ellipse
            cx="70"
            cy="82"
            rx="26"
            ry="28"
            fill={
              shape === 'flying'
                ? '#ECFDF5'
                : shape === 'alert'
                ? '#FFFBEB'
                : shape === 'tired'
                ? '#FFF7ED'
                : '#F5F3FF'
            }
            opacity="0.95"
          />

          {/* Belly Feather Scales */}
          <path
            d="M 60 74 Q 70 80 80 74 M 56 84 Q 70 90 84 84 M 62 94 Q 70 98 78 94"
            stroke={
              shape === 'flying'
                ? '#047857'
                : shape === 'alert'
                ? '#B45309'
                : shape === 'tired'
                ? '#C2410C'
                : '#6D28D9'
            }
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* Ear Tufts (Horn Feathers) */}
          <polygon
            points="42,38 28,14 56,32"
            fill={
              shape === 'flying'
                ? '#047857'
                : shape === 'alert'
                ? '#B45309'
                : shape === 'tired'
                ? '#C2410C'
                : '#5B21B6'
            }
          />
          <polygon
            points="98,38 112,14 84,32"
            fill={
              shape === 'flying'
                ? '#047857'
                : shape === 'alert'
                ? '#B45309'
                : shape === 'tired'
                ? '#C2410C'
                : '#5B21B6'
            }
          />

          {/* Eye Sockets */}
          <circle cx="52" cy="52" r="16" fill="#FFFFFF" />
          <circle cx="88" cy="52" r="16" fill="#FFFFFF" />

          {/* Eye Pupils / Expressions */}
          {shape === 'flying' ? (
            <>
              <path
                d="M 42 52 Q 52 42 62 52"
                stroke="#065F46"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 78 52 Q 88 42 98 52"
                stroke="#065F46"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="56" cy="46" r="2" fill="#34D399" />
              <circle cx="92" cy="46" r="2" fill="#34D399" />
            </>
          ) : shape === 'alert' ? (
            <>
              <circle cx="52" cy="52" r="8" fill="#1E293B" />
              <circle cx="88" cy="52" r="8" fill="#1E293B" />
              <circle cx="49" cy="49" r="2.5" fill="#FFFFFF" />
              <circle cx="85" cy="49" r="2.5" fill="#FFFFFF" />
            </>
          ) : shape === 'tired' ? (
            <>
              <ellipse cx="52" cy="55" rx="7" ry="5" fill="#1E293B" />
              <ellipse cx="88" cy="55" rx="7" ry="5" fill="#1E293B" />
              <path d="M 36 46 C 46 54, 58 54, 68 46 Z" fill="#EA580C" />
              <path d="M 72 46 C 82 54, 94 54, 104 46 Z" fill="#EA580C" />
            </>
          ) : (
            <>
              <path
                d="M 44 54 L 60 54"
                stroke="#4C1D95"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 80 54 L 96 54"
                stroke="#4C1D95"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Beak */}
          <polygon points="70,56 62,66 78,66" fill="#F59E0B" />

          {/* Accessories */}
          {shape === 'alert' && (
            <g transform="translate(86, 76)">
              <rect x="0" y="0" width="15" height="18" rx="3" fill="#EF4444" />
              <path d="M 15 4 C 19 4, 19 14, 15 14" stroke="#EF4444" strokeWidth="2.5" fill="none" />
              <path
                d="M 4 -3 Q 8 -7 4 -11 M 9 -3 Q 13 -7 9 -11"
                stroke="#FCA5A5"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="animate-steam-rise"
                fill="none"
              />
            </g>
          )}

          {shape === 'tired' && (
            <path
              d="M 98 32 Q 104 38 102 44 Q 100 48 96 46 Q 92 44 94 38 Z"
              fill="#38BDF8"
              className="animate-bounce"
            />
          )}

          {shape === 'sleeping' && (
            <>
              <g className="animate-snore-bubble">
                <text x="104" y="34" fill="#C4B5FD" fontSize="16" fontWeight="bold" fontFamily="monospace">z</text>
                <text x="116" y="22" fill="#DDD6FE" fontSize="20" fontWeight="bold" fontFamily="monospace">Z</text>
                <text x="128" y="10" fill="#EDE9FE" fontSize="24" fontWeight="bold" fontFamily="monospace">Z</text>
              </g>
              <rect x="52" y="26" width="36" height="9" rx="2" fill="#F8FAFC" opacity="0.9" transform="rotate(-5, 70, 30)" />
              <path d="M 67 26 L 73 35 M 73 26 L 67 35" stroke="#EF4444" strokeWidth="2" transform="rotate(-5, 70, 30)" />
            </>
          )}

          {/* Feet */}
          <ellipse cx="58" cy="118" rx="6" ry="3.5" fill="#D97706" />
          <ellipse cx="82" cy="118" rx="6" ry="3.5" fill="#D97706" />
        </svg>
      </div>

      {/* Mascot Status Badge (Hidden when hideBadge=true for pure mascot flight) */}
      {!hideBadge && (
        <div className="mt-1 flex flex-col items-center">
          <div
            className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg border transition-colors ${
              isIdle
                ? 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                : shape === 'flying'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : shape === 'alert'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : shape === 'tired'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            {/* The pulsing dot signals "live data" — omitted when there is none. */}
            {!isIdle && <span className="w-1.5 h-1.5 rounded-full animate-ping bg-current" />}
            <span>
              {isIdle
                ? 'No Quota Data'
                : shape === 'flying'
                ? 'Healthy Quota (>70%)'
                : shape === 'alert'
                ? 'Normal Usage (30-70%)'
                : shape === 'tired'
                ? 'Low Quota (<30%)'
                : 'Rate Limited (<10%)'}
            </span>
          </div>

          {/* Countdown only renders when the provider actually returned a reset header. */}
          {!isIdle && typeof nextResetSeconds === 'number' && (shape === 'sleeping' || shape === 'tired') && (
            <div className="mt-1 px-2.5 py-0.5 rounded-md bg-slate-900/90 text-[10px] font-mono text-purple-300 border border-purple-500/30 shadow flex items-center gap-1">
              <span>⏳</span>
              <span>{formatTimer(nextResetSeconds)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
