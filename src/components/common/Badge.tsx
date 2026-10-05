import React from 'react';
import { ConclusionLevel } from '../../types/api';

interface BadgeProps {
  level?: ConclusionLevel | string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ level, variant, children, className = '' }) => {
  let colorClasses =
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60';

  if (level) {
    switch (level) {
      case 'explicit':
        colorClasses =
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        break;
      case 'deductive':
        colorClasses =
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
        break;
      case 'inductive':
        colorClasses =
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        break;
      case 'contradiction':
        colorClasses =
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'success':
        colorClasses =
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
        break;
      case 'warning':
        colorClasses =
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        break;
      case 'error':
        colorClasses =
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
        break;
      case 'brand':
        colorClasses =
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border font-mono tracking-tight ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
};
