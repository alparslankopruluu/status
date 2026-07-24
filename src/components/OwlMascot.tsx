import React from 'react';
import { MascotState } from '../types';

interface OwlMascotProps {
  state: MascotState;
  healthScore: number;
  nextResetSeconds?: number;
  onClick?: () => void;
}

export const OwlMascot: React.FC<OwlMascotProps> = ({
  state,
  healthScore,
  nextResetSeconds = 6240, // default ~1h 44m
  onClick,
}) => {
  // Format reset timer
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
      className="relative flex flex-col items-center justify-center p-4 cursor-pointer group select-none transition-all duration-300"
    >
      {/* Dynamic Background Glow Aura */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-500 ${
          state === 'flying'
            ? 'bg-emerald-500/50 scale-110'
            : state === 'alert'
            ? 'bg-amber-500/40 scale-100'
            : state === 'tired'
            ? 'bg-orange-600/40 scale-95'
            : 'bg-purple-600/50 scale-100 animate-pulse'
        }`}
      />

      {/* Main Mascot SVG Graphic */}
      <div
        className={`relative z-10 transition-transform duration-500 ${
          state === 'flying'
            ? 'animate-float-slow'
            : state === 'tired'
            ? 'animate-shiver'
            : ''
        }`}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-xl"
        >
          {/* Outer Wings (Left & Right) */}
          {state === 'flying' ? (
            <>
              {/* Flying Flapping Wings */}
              <path
                d="M 28 65 C 10 45, 5 30, 20 22 C 32 16, 42 40, 48 58 Z"
                fill="#059669"
                className="animate-wing-flap origin-right"
              />
              <path
                d="M 112 65 C 130 45, 135 30, 120 22 C 108 16, 98 40, 92 58 Z"
                fill="#059669"
                className="animate-wing-flap origin-left"
              />
            </>
          ) : state === 'alert' ? (
            <>
              {/* Perched Wings */}
              <path
                d="M 32 60 C 20 65, 18 85, 38 88 Z"
                fill="#D97706"
              />
              <path
                d="M 108 60 C 120 65, 122 85, 102 88 Z"
                fill="#D97706"
              />
            </>
          ) : state === 'tired' ? (
            <>
              {/* Drooping Wings */}
              <path
                d="M 32 65 C 18 78, 20 98, 36 92 Z"
                fill="#EA580C"
              />
              <path
                d="M 108 65 C 122 78, 120 98, 104 92 Z"
                fill="#EA580C"
              />
            </>
          ) : (
            <>
              {/* Resting Grounded Wings */}
              <path
                d="M 32 72 C 16 85, 25 105, 42 96 Z"
                fill="#7C3AED"
              />
              <path
                d="M 108 72 C 124 85, 115 105, 98 96 Z"
                fill="#7C3AED"
              />
            </>
          )}

          {/* Owl Body Base */}
          <ellipse
            cx="70"
            cy="72"
            rx="42"
            ry="46"
            fill={
              state === 'flying'
                ? '#10B981'
                : state === 'alert'
                ? '#F59E0B'
                : state === 'tired'
                ? '#F97316'
                : '#6D28D9'
            }
          />

          {/* Owl Belly Feather Patch */}
          <ellipse
            cx="70"
            cy="80"
            rx="28"
            ry="30"
            fill={
              state === 'flying'
                ? '#D1FAE5'
                : state === 'alert'
                ? '#FEF3C7'
                : state === 'tired'
                ? '#FFEDD5'
                : '#EDE9FE'
            }
            opacity="0.9"
          />

          {/* Belly Feather Pattern Scales */}
          <path
            d="M 60 72 Q 70 78 80 72 M 56 82 Q 70 88 84 82 M 62 92 Q 70 96 78 92"
            stroke={
              state === 'flying'
                ? '#059669'
                : state === 'alert'
                ? '#D97706'
                : state === 'tired'
                ? '#EA580C'
                : '#7C3AED'
            }
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* Ear Tufts (Feather Horns) */}
          <polygon
            points="42,34 30,12 56,28"
            fill={
              state === 'flying'
                ? '#047857'
                : state === 'alert'
                ? '#B45309'
                : state === 'tired'
                ? '#C2410C'
                : '#5B21B6'
            }
          />
          <polygon
            points="98,34 110,12 84,28"
            fill={
              state === 'flying'
                ? '#047857'
                : state === 'alert'
                ? '#B45309'
                : state === 'tired'
                ? '#C2410C'
                : '#5B21B6'
            }
          />

          {/* Big Eye Sockets */}
          <circle cx="52" cy="50" r="17" fill="#FFFFFF" />
          <circle cx="88" cy="50" r="17" fill="#FFFFFF" />

          {/* Eye Pupils / Expressions */}
          {state === 'flying' ? (
            <>
              {/* Happy Smiling Eyes */}
              <path
                d="M 42 50 Q 52 40 62 50"
                stroke="#065F46"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 78 50 Q 88 40 98 50"
                stroke="#065F46"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Sparkle Glint */}
              <circle cx="56" cy="44" r="2" fill="#34D399" />
              <circle cx="92" cy="44" r="2" fill="#34D399" />
            </>
          ) : state === 'alert' ? (
            <>
              {/* Wide Alert Eyes with Pupils */}
              <circle cx="52" cy="50" r="9" fill="#1E293B" />
              <circle cx="88" cy="50" r="9" fill="#1E293B" />
              <circle cx="49" cy="47" r="3" fill="#FFFFFF" />
              <circle cx="85" cy="47" r="3" fill="#FFFFFF" />
            </>
          ) : state === 'tired' ? (
            <>
              {/* Heavy Drooping Frowning Eyes */}
              <ellipse cx="52" cy="53" rx="8" ry="6" fill="#1E293B" />
              <ellipse cx="88" cy="53" rx="8" ry="6" fill="#1E293B" />
              {/* Eyelid Drop Covers */}
              <path
                d="M 35 44 C 45 52, 60 52, 69 44 Z"
                fill="#F97316"
              />
              <path
                d="M 71 44 C 81 52, 96 52, 105 44 Z"
                fill="#F97316"
              />
            </>
          ) : (
            <>
              {/* Closed Sleeping Eyes (- -) */}
              <path
                d="M 44 52 L 60 52"
                stroke="#4C1D95"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 80 52 L 96 52"
                stroke="#4C1D95"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Beak */}
          <polygon
            points="70,54 62,64 78,64"
            fill="#F59E0B"
          />

          {/* State Specific Accessories */}
          {state === 'alert' && (
            /* Coffee Mug */
            <g transform="translate(85, 75)">
              <rect x="0" y="0" width="16" height="20" rx="3" fill="#EF4444" />
              <path d="M 16 4 C 21 4, 21 14, 16 14" stroke="#EF4444" strokeWidth="3" fill="none" />
              {/* Steam */}
              <path
                d="M 4 -4 Q 8 -8 4 -12 M 10 -4 Q 14 -8 10 -12"
                stroke="#FCA5A5"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="animate-steam-rise"
                fill="none"
              />
            </g>
          )}

          {state === 'tired' && (
            /* Sweat Drop */
            <path
              d="M 98 30 Q 104 36 102 42 Q 100 46 96 44 Q 92 42 94 36 Z"
              fill="#38BDF8"
              className="animate-bounce"
            />
          )}

          {state === 'sleeping' && (
            <>
              {/* Snoring zZz */}
              <g className="animate-snore-bubble">
                <text x="105" y="32" fill="#A78BFA" fontSize="18" fontWeight="bold" fontFamily="monospace">z</text>
                <text x="116" y="20" fill="#C4B5FD" fontSize="22" fontWeight="bold" fontFamily="monospace">Z</text>
                <text x="128" y="8" fill="#DDD6FE" fontSize="26" fontWeight="bold" fontFamily="monospace">Z</text>
              </g>
              {/* Forehead Bandage */}
              <rect x="52" y="24" width="36" height="10" rx="2" fill="#F8FAFC" opacity="0.9" transform="rotate(-5, 70, 29)" />
              <path d="M 67 24 L 73 34 M 73 24 L 67 34" stroke="#EF4444" strokeWidth="2" transform="rotate(-5, 70, 29)" />
            </>
          )}

          {/* Feet Perched */}
          <ellipse cx="58" cy="116" rx="7" ry="4" fill="#D97706" />
          <ellipse cx="82" cy="116" rx="7" ry="4" fill="#D97706" />
        </svg>
      </div>

      {/* Mascot Status Badge */}
      <div className="mt-2 flex flex-col items-center">
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg border transition-colors ${
            state === 'flying'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : state === 'alert'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : state === 'tired'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full animate-ping bg-current" />
          <span>
            {state === 'flying'
              ? 'Healthy Quota (>70%)'
              : state === 'alert'
              ? 'Normal Usage (30-70%)'
              : state === 'tired'
              ? 'Low Quota (<30%)'
              : 'Rate Limited (<10%)'}
          </span>
        </div>

        {/* Floating Reset Countdown Badge when Exhausted / Low */}
        {(state === 'sleeping' || state === 'tired') && (
          <div className="mt-1.5 px-2.5 py-0.5 rounded-md bg-slate-900/90 text-[11px] font-mono text-purple-300 border border-purple-500/30 shadow flex items-center gap-1">
            <span>⏳</span>
            <span>{formatTimer(nextResetSeconds)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
