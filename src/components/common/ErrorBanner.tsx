import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Errore di caricamento',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 flex items-start gap-3.5 ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <h4 className="font-semibold text-rose-300">{title}</h4>
        <p className="mt-1 text-xs text-rose-200/90 leading-relaxed font-mono">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 border border-rose-500/40 transition focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Riprova
          </button>
        )}
      </div>
    </div>
  );
};
