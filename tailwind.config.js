/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          active: 'var(--color-border-active)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          DEFAULT: 'var(--color-brand)',
          bg: 'var(--color-brand-bg)',
        },
        level: {
          explicit: '#10b981',
          deductive: '#6366f1',
          inductive: '#f59e0b',
          contradiction: '#f43f5e',
        },
      },
      boxShadow: {
        card: 'var(--color-card-shadow)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
