import React from 'react';

export const ShimmerCard: React.FC<{ rows?: number; className?: string }> = ({ rows = 3, className = '' }) => {
  return (
    <div className={`p-4 rounded-xl border border-border-subtle bg-surface/50 space-y-3 ${className}`}>
      <div className="h-4 w-1/3 rounded shimmer" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3.5 rounded shimmer" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
};

export const ShimmerList: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-border-subtle bg-surface-subtle/50 flex items-center justify-between">
          <div className="space-y-1.5 w-2/3">
            <div className="h-3.5 w-1/2 rounded shimmer" />
            <div className="h-2.5 w-1/3 rounded shimmer" />
          </div>
          <div className="h-6 w-16 rounded shimmer" />
        </div>
      ))}
    </div>
  );
};
