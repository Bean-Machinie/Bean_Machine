/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          strong: 'rgb(var(--color-accent-strong) / <alpha-value>)',
          contrast: 'rgb(var(--color-accent-contrast) / <alpha-value>)',
        },
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)',
        highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--color-ring) / <alpha-value>)',
      },
      keyframes: {
        'frame-appear': {
          '0%': { transform: 'translateY(18px) scale(0.88) rotate(-1deg)', opacity: '0' },
          '60%': { transform: 'translateY(-8px) scale(1.08) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1) rotate(0deg)', opacity: '1' },
        },
      },
      animation: {
        'frame-appear': 'frame-appear 320ms cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [],
};
