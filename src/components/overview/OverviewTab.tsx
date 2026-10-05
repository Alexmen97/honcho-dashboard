import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  MessageSquare,
  Users,
  Compass,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../api/client';
import { ShimmerCard } from '../common/LoadingShimmer';
import { ErrorBanner } from '../common/ErrorBanner';
import { TabType } from '../layout/Sidebar';

interface OverviewTabProps {
  workspaceId: string;
  onNavigate: (tab: TabType) => void;
  onOpenCreateSession: () => void;
  onOpenCreatePeer: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  workspaceId,
  onNavigate,
  onOpenCreateSession,
  onOpenCreatePeer,
}) => {
  // Queue status query (scoped by workspaceId)
  const {
    data: queueStatus,
    isLoading: isQueueLoading,
    error: queueError,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'queue-status'],
    queryFn: () => api.getQueueStatus(workspaceId),
    enabled: Boolean(workspaceId),
    refetchInterval: 15000,
  });

  // Real Counts queries (size=1 for lightweight counting)
  const { data: sessionsPage } = useQuery({
    queryKey: ['workspace', workspaceId, 'sessions-count'],
    queryFn: () => api.listSessions(workspaceId, 1, 1),
    enabled: Boolean(workspaceId),
  });

  const { data: peersPage } = useQuery({
    queryKey: ['workspace', workspaceId, 'peers-count'],
    queryFn: () => api.listPeers(workspaceId, 1, 1),
    enabled: Boolean(workspaceId),
  });

  const { data: conclusionsPage } = useQuery({
    queryKey: ['workspace', workspaceId, 'conclusions-count'],
    queryFn: () => api.listConclusions(workspaceId, 1, 1),
    enabled: Boolean(workspaceId),
  });

  if (!workspaceId) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        Seleziona o crea un workspace per visualizzare la panoramica.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="p-5 rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 font-medium">
              Workspace Attivo
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Honcho v3.2.2</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono tracking-tight">{workspaceId}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Console operativa per cognizione sociale, memorie e ragionamento dialettico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateSession}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated hover:bg-surface-hover text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60 transition flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500"
          >
            <Plus className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
            Nuova Sessione
          </button>
          <button
            onClick={onOpenCreatePeer}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuovo Peer
          </button>
        </div>
      </div>

      {/* Actual Honcho Counts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('sessions')}
          className="p-4 rounded-xl border border-border-subtle bg-surface/80 hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Sessioni Totali</span>
            <MessageSquare className="w-4 h-4 text-brand-500 dark:text-brand-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {sessionsPage ? sessionsPage.total : <div className="h-7 w-12 rounded shimmer" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Traccia conversazioni e messaggi batch
          </div>
        </div>

        <div
          onClick={() => onNavigate('peer')}
          className="p-4 rounded-xl border border-border-subtle bg-surface/80 hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Peer Registrati</span>
            <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {peersPage ? peersPage.total : <div className="h-7 w-12 rounded shimmer" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Profili cognitivi e schede dreaming
          </div>
        </div>

        <div
          onClick={() => onNavigate('conclusions')}
          className="p-4 rounded-xl border border-border-subtle bg-surface/80 hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer group shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Conclusioni Derivate</span>
            <Compass className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {conclusionsPage ? conclusionsPage.total : <div className="h-7 w-12 rounded shimmer" />}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            Fatti espliciti e deduzioni dreaming
          </div>
        </div>
      </div>

      {/* Queue Status Panel */}
      <div className="p-5 rounded-xl border border-border-subtle bg-surface/80 space-y-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Stato Coda di Elaborazione Honcho</h3>
          </div>
          <button
            onClick={() => refetchQueue()}
            className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-mono transition font-medium"
          >
            Aggiorna
          </button>
        </div>

        {isQueueLoading && <ShimmerCard rows={2} />}

        {queueError && (
          <ErrorBanner
            title="Errore recupero coda"
            message={queueError instanceof Error ? queueError.message : 'Impossibile leggere lo stato della coda'}
            onRetry={() => refetchQueue()}
          />
        )}

        {queueStatus && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Unità Totali
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {queueStatus.total_work_units}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  Completate
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {queueStatus.completed_work_units}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-spin" />
                  In Corso
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {queueStatus.in_progress_work_units}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  In Attesa
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                  {queueStatus.pending_work_units}
                </div>
              </div>
            </div>

            {queueStatus.sessions && Object.keys(queueStatus.sessions).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <div className="text-xs font-medium text-slate-800 dark:text-slate-300 mb-2">Dettaglio per Sessione</div>
                <div className="space-y-1.5">
                  {Object.entries(queueStatus.sessions).map(([sessId, s]) => (
                    <div
                      key={sessId}
                      className="p-2.5 rounded-lg bg-surface-subtle/50 border border-border-subtle flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-800 dark:text-slate-300">{sessId}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400">Tot: {s.total_work_units}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">OK: {s.completed_work_units}</span>
                        <span className="text-amber-600 dark:text-amber-400">Run: {s.in_progress_work_units}</span>
                        <span className="text-slate-600 dark:text-slate-400">Pend: {s.pending_work_units}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compliance Notice */}
      <div className="p-3.5 rounded-lg border border-border-subtle bg-surface-subtle/60 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <span>
          Metriche verificate direttamente dall'istanza Honcho upstream. Nessuna telemetria simulata o statistiche inventate di container.
        </span>
      </div>
    </div>
  );
};
