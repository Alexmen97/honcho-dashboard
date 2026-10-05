/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#090d16',
        surface: {
          DEFAULT: '#0f172a',
          subtle: '#131d31',
          elevated: '#1e293b',
          hover: '#27354f',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          active: 'rgba(99, 102, 241, 0.4)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        level: {
          explicit: '#10b981',
          deductive: '#6366f1',
          inductive: '#f59e0b',
          contradiction: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
