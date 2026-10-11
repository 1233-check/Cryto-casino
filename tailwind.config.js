/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D11',
        surface: {
          DEFAULT: '#14171F',
          elevated: '#1A1E27',
          hover: '#222733',
        },
        primary: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        secondary: '#3B82F6',
        danger: '#EF4444',
        warning: '#F59E0B',
        gold: '#D4AF37',
        purple: '#8B5CF6',
        matte: {
          bg: '#0B0D11',
          card: '#14171F',
          elevated: '#1A1E27',
          border: 'rgba(255, 255, 255, 0.07)',
          text: '#F1F5F9',
          muted: '#94A3B8',
          subtle: '#64748B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
