import React from 'react';
import { ConclusionLevel } from '../../types/api';

interface BadgeProps {
  level?: ConclusionLevel | string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ level, variant, children, className = '' }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700/60';

  if (level) {
    switch (level) {
      case 'explicit':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        break;
      case 'deductive':
        colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        break;
      case 'inductive':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        break;
      case 'contradiction':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'success':
        colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        break;
      case 'warning':
        colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        break;
      case 'error':
        colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        break;
      case 'brand':
        colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
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
