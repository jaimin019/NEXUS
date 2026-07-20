export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        nexus: {
          bg:           '#F5F0E8',
          sidebar:      '#EDE8DE',
          surface:      '#FDFAF6',
          surfaceHigh:  '#F0EBE1',
          border:       '#E2D9C8',
          borderLight:  '#EDE8DE',
          primary:      '#C49A3C',
          primaryHover: '#B8860B',
          primaryLight: '#F5EDD8',
          primaryDim:   'rgba(196,154,60,0.12)',
          text:         '#2C2416',
          textSecond:   '#6B5B3E',
          textMuted:    '#9B8B70',
          textFaint:    '#C4B49A',
          positive:     '#7A8C5A',
          caution:      '#C49A3C',
          critical:     '#A0623A',
          info:         '#6B7A8C',
          inactive:     '#C4B49A',
        }
      },
      boxShadow: {
        'card':     '0 1px 4px rgba(44,36,22,0.06), 0 2px 12px rgba(44,36,22,0.04)',
        'elevated': '0 4px 20px rgba(44,36,22,0.10), 0 1px 4px rgba(44,36,22,0.06)',
        'focus':    '0 0 0 3px rgba(196,154,60,0.2)',
        'gold':     '0 4px 12px rgba(196,154,60,0.35)',
      },
      borderRadius: {
        DEFAULT: '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '999px',
      }
    }
  },
  plugins: []
}
