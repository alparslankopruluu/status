/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        owl: {
          emerald: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          orange: '#F97316',
          crimson: '#EF4444',
          purple: '#8B5CF6',
          dark: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        }
      },
      animation: {
        'wing-flap': 'wingFlap 1.2s ease-in-out infinite',
        'float-slow': 'floatSlow 3s ease-in-out infinite',
        'snore-bubble': 'snoreBubble 2s ease-in-out infinite',
        'shiver': 'shiver 0.3s ease-in-out infinite',
        'steam-rise': 'steamRise 2.5s ease-out infinite',
      },
      keyframes: {
        wingFlap: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-12deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        snoreBubble: {
          '0%': { opacity: '0', transform: 'translate(0, 0) scale(0.6)' },
          '50%': { opacity: '0.8', transform: 'translate(8px, -12px) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(16px, -24px) scale(1.2)' },
        },
        shiver: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-1.5px)' },
          '75%': { transform: 'translateX(1.5px)' },
        },
        steamRise: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.8)' },
          '50%': { opacity: '0.6', transform: 'translateY(-6px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-12px) scale(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
