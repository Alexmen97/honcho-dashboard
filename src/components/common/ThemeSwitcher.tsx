import React, { useRef } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemePreference } from '../../theme/ThemeContext';

export interface ThemeSwitcherProps {
  variant?: 'compact' | 'expanded';
  className?: string;
}

interface ThemeOption {
  id: ThemePreference;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark',
    shortLabel: 'Dark',
    icon: Moon,
    title: 'Tema Scuro (Dark)',
  },
  {
    id: 'light',
    label: 'Light',
    shortLabel: 'Light',
    icon: Sun,
    title: 'Tema Chiaro (Light)',
  },
  {
    id: 'system',
    label: 'Auto (Sistema)',
    shortLabel: 'Auto',
    icon: Monitor,
    title: 'Tema di Sistema (Auto)',
  },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.id === theme);
    if (currentIndex === -1) return;

    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = THEME_OPTIONS.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== -1) {
      const nextTheme = THEME_OPTIONS[nextIndex].id;
      setTheme(nextTheme);

      // Focus the newly selected button
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    }
  };

  if (variant === 'expanded') {
    return (
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Selettore Tema Display"
        onKeyDown={handleKeyDown}
        className={`grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle text-xs ${className}`}
      >
        {THEME_OPTIONS.map((opt) => {
          const isSelected = theme === opt.id;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.title}
              title={opt.title}
              onClick={() => setTheme(opt.id)}
              className={`py-1.5 px-2 rounded text-[11px] font-medium transition flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-hover/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.shortLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant (Header / Navbar)
  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Selettore Tema"
      onKeyDown={handleKeyDown}
      className={`flex items-center bg-surface-subtle p-0.5 rounded-lg border border-border-subtle text-xs ${className}`}
    >
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 px-1.5 uppercase tracking-wider hidden lg:inline">
        Tema:
      </span>
      {THEME_OPTIONS.map((opt) => {
        const isSelected = theme === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.title}
            title={opt.title}
            onClick={() => setTheme(opt.id)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isSelected
                ? 'bg-brand-600 text-white font-medium shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
