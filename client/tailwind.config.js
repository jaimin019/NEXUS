/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#0A0A0F',
          surface: '#111118',
          border: '#1E1E2E',
          primary: '#4F46E5',
          primaryHover: '#4338CA',
          accent: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#6B7280',
          text: '#F1F5F9',
          textMuted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'nexus-glow': '0 0 20px rgba(79,70,229,0.15)',
        'nexus-glow-lg': '0 0 40px rgba(79,70,229,0.2)',
        'nexus-accent': '0 0 20px rgba(6,182,212,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
