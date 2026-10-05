import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Sparkles,
  Info,
  Search,
  Brain,
  Layers,
  ChevronRight,
  Database,
} from 'lucide-react';
import { api } from '../../api/client';
import { ShimmerCard, ShimmerList } from '../common/LoadingShimmer';
import { ErrorBanner } from '../common/ErrorBanner';
import { Badge } from '../common/Badge';
import { PeerRepresentationGet } from '../../types/api';

interface PeersTabProps {
  workspaceId: string;
  onOpenCreatePeer: () => void;
  onPeerSelected?: (peerId: string) => void;
}

export const PeersTab: React.FC<PeersTabProps> = ({
  workspaceId,
  onOpenCreatePeer,
  onPeerSelected,
}) => {
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [repQuery, setRepQuery] = useState('');
  const [repSessionId, setRepSessionId] = useState('');
  const [representationResult, setRepresentationResult] = useState<unknown | null>(null);

  // List Peers Query
  const {
    data: peersData,
    isLoading: isPeersLoading,
    error: peersError,
    refetch: refetchPeers,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'peers'],
    queryFn: () => api.listPeers(workspaceId, 1, 50, false),
    enabled: Boolean(workspaceId),
  });

  // Active Peer: selected or first in list
  const activePeerId = selectedPeerId || (peersData?.items?.[0]?.id ?? null);

  // Fetch Peer Card
  const {
    data: cardData,
    isLoading: isCardLoading,
    error: cardError,
    refetch: refetchCard,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'peer', activePeerId, 'card'],
    queryFn: () => api.getPeerCard(workspaceId, activePeerId!),
    enabled: Boolean(workspaceId && activePeerId),
  });

  // Fetch Peer Context
  const {
    data: contextData,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'peer', activePeerId, 'context'],
    queryFn: () => api.getPeerContext(workspaceId, activePeerId!),
    enabled: Boolean(workspaceId && activePeerId),
  });

  // Representation Retrieval Mutation (Query semantic)
  const repMutation = useMutation({
    mutationFn: async () => {
      if (!activePeerId) throw new Error('Nessun peer selezionato');
      const params: PeerRepresentationGet = {};
      if (repSessionId.trim()) params.session_id = repSessionId.trim();
      if (repQuery.trim()) {
        params.search_query = repQuery.trim();
        params.search_top_k = 10;
        params.search_max_distance = 0.8;
      }
      return api.getPeerRepresentation(workspaceId, activePeerId, params);
    },
    onSuccess: (data) => {
      setRepresentationResult(data.representation);
    },
  });

  const handleSelectPeer = (id: string) => {
    setSelectedPeerId(id);
    setRepresentationResult(null);
    if (onPeerSelected) onPeerSelected(id);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left Column: Peers List */}
      <div className="w-full md:w-72 shrink-0 flex flex-col rounded-xl border border-border-subtle bg-surface/40 overflow-hidden">
        <div className="p-3 border-b border-border-subtle flex items-center justify-between bg-surface/60">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">Peer Cognitivi</h3>
          </div>
          <button
            onClick={onOpenCreatePeer}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-elevated transition focus:ring-2 focus:ring-brand-500"
            title="Nuovo Peer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isPeersLoading && <ShimmerList count={3} />}

          {peersError && (
            <ErrorBanner
              message={peersError instanceof Error ? peersError.message : 'Errore recupero peer'}
              onRetry={() => refetchPeers()}
            />
          )}

          {peersData?.items.map((peer) => {
            const isSelected = peer.id === activePeerId;
            return (
              <button
                key={peer.id}
                onClick={() => handleSelectPeer(peer.id)}
                className={`w-full text-left p-2.5 rounded-lg transition border flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface-elevated border-emerald-500/40 text-white'
                    : 'border-transparent text-slate-300 hover:bg-surface-elevated/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                    {peer.id.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs font-medium truncate">{peer.id}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
            );
          })}

          {peersData && peersData.items.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">
              Nessun peer registrato. Crea il primo peer (es. alex).
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Peer Card & Context */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activePeerId ? (
          <>
            {/* Header info */}
            <div className="p-4 rounded-xl border border-border-subtle bg-surface/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-mono font-bold text-sm">
                  {activePeerId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">{activePeerId}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>Workspace: {workspaceId}</span>
                  </div>
                </div>
              </div>

              <Badge variant="success">Attivo</Badge>
            </div>

            {/* Cognitive Card Box */}
            <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-400" />
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Scheda Cognitiva (Peer Card)
                  </h3>
                </div>
                <button
                  onClick={() => refetchCard()}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-mono"
                >
                  Aggiorna
                </button>
              </div>

              {isCardLoading && <ShimmerCard rows={3} />}

              {cardError && (
                <ErrorBanner
                  message={cardError instanceof Error ? cardError.message : 'Errore recupero peer card'}
                  onRetry={() => refetchCard()}
                />
              )}

              {/* Populated peer card */}
              {cardData && cardData.peer_card && cardData.peer_card.length > 0 && (
                <div className="space-y-2">
                  {cardData.peer_card.map((trait, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-surface-subtle border border-border-subtle text-xs text-slate-200 flex items-start gap-2.5 font-sans leading-relaxed"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{trait}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Null or empty peer card: educational learning state */}
              {cardData && (!cardData.peer_card || cardData.peer_card.length === 0) && (
                <div className="p-4 rounded-lg bg-surface-subtle/70 border border-slate-700/60 text-center space-y-2">
                  <Info className="w-5 h-5 text-brand-400 mx-auto" />
                  <div className="text-xs font-medium text-slate-300">
                    Scheda cognitiva in fase di distillazione
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    Honcho sta osservando le conversazioni con <span className="text-white font-mono">{activePeerId}</span>. Le schede cognitive ad alto livello vengono sintetizzate in modo asincrono durante i cicli di <em>dreaming</em>.
                  </p>
                </div>
              )}
            </div>

            {/* Representation Query Section (Read/Query Semantics) */}
            <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Query Representation Scoped
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">POST /representation (Query)</span>
              </div>

              <div className="text-xs text-slate-400 leading-relaxed bg-surface-subtle/50 p-2.5 rounded-lg border border-border-subtle">
                Recupera un sottoinsieme profilato della rappresentazione esistente del peer. È un'operazione di lettura/query rapida, <strong>non un ricalcolo di embedding o dreaming</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rep-session-filter" className="block text-[11px] text-slate-400 mb-1 font-mono">Filtro Session ID (opzionale):</label>
                  <input
                    id="rep-session-filter"
                    type="text"
                    value={repSessionId}
                    onChange={(e) => setRepSessionId(e.target.value)}
                    placeholder="es. session-01"
                    className="w-full px-2.5 py-1.5 rounded bg-surface-subtle border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="rep-semantic-query" className="block text-[11px] text-slate-400 mb-1 font-mono">Query Semantica (opzionale):</label>
                  <input
                    id="rep-semantic-query"
                    type="text"
                    value={repQuery}
                    onChange={(e) => setRepQuery(e.target.value)}
                    placeholder="es. architettura, preferenze"
                    className="w-full px-2.5 py-1.5 rounded bg-surface-subtle border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => repMutation.mutate()}
                  disabled={repMutation.isPending}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated hover:bg-surface-hover text-brand-300 border border-brand-500/40 transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{repMutation.isPending ? 'Recupero in corso...' : 'Recupera Representation'}</span>
                </button>
              </div>

              {repMutation.isError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                  {repMutation.error instanceof Error ? repMutation.error.message : 'Errore query representation'}
                </div>
              )}

              {Boolean(representationResult) && (
                <div className="mt-3 p-3 rounded-lg bg-canvas border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-64">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risultato Representation:</div>
                  <pre>{JSON.stringify(representationResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Peer Context Summary */}
            {contextData && (
              <div className="p-5 rounded-xl border border-border-subtle bg-surface/50 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Contesto Profilo Generale
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Target ID: <span className="text-slate-200">{contextData.target_id || 'Globale'}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Seleziona un peer per visualizzare profilo e schede cognitive
          </div>
        )}
      </div>
    </div>
  );
};
