import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Sliders,
  X,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { Conclusion } from '../../types/api';
import { Badge } from '../common/Badge';
import { ShimmerCard, ShimmerList } from '../common/LoadingShimmer';
import { ErrorBanner } from '../common/ErrorBanner';

interface ConclusionsTabProps {
  workspaceId: string;
}

export const ConclusionsTab: React.FC<ConclusionsTabProps> = ({ workspaceId }) => {
  const [viewMode, setViewMode] = useState<'list' | 'semantic'>('list');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Semantic query parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceThreshold, setDistanceThreshold] = useState(0.75);
  const [topK, setTopK] = useState(10);
  const [semanticResults, setSemanticResults] = useState<Conclusion[] | null>(null);

  // Derivation Detail Drawer state
  const [activeConclusionId, setActiveConclusionId] = useState<string | null>(null);

  // List Conclusions Query
  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'conclusions-list', { page, pageSize, selectedLevel }],
    queryFn: () => {
      const filters: Record<string, unknown> = {};
      if (selectedLevel !== 'all') {
        filters.level = selectedLevel;
      }
      return api.listConclusions(workspaceId, page, pageSize, true, filters);
    },
    enabled: Boolean(workspaceId && viewMode === 'list'),
  });

  // Semantic Query Mutation
  const semanticMutation = useMutation({
    mutationFn: async () => {
      if (!searchQuery.trim()) return [];
      return api.queryConclusions(workspaceId, {
        query: searchQuery.trim(),
        top_k: topK,
        distance: distanceThreshold,
      });
    },
    onSuccess: (data) => {
      setSemanticResults(data);
    },
  });

  // Conclusion Detail Query
  const {
    data: detailData,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'conclusion', activeConclusionId],
    queryFn: () => api.getConclusion(workspaceId, activeConclusionId!),
    enabled: Boolean(workspaceId && activeConclusionId),
  });

  const handleSemanticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || semanticMutation.isPending) return;
    semanticMutation.mutate();
  };

  const displayedConclusions = viewMode === 'list' ? listData?.items || [] : semanticResults || [];

  return (
    <div className="space-y-4">
      {/* Top Filter and Mode Switcher */}
      <div className="p-4 rounded-xl border border-border-subtle bg-surface/80 backdrop-blur-sm space-y-3 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-subtle border border-border-subtle text-xs font-medium">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-surface-elevated text-slate-900 dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Elenco Completo ({listData ? listData.total : '...'})
            </button>
            <button
              onClick={() => setViewMode('semantic')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'semantic'
                  ? 'bg-surface-elevated text-slate-900 dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
              <span>Ricerca Semantica Vettoriale</span>
            </button>
          </div>

          {/* Level Filter Chips for List View */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 mr-1 font-mono flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Livello:
              </span>
              {(['all', 'explicit', 'deductive', 'inductive', 'contradiction'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                    selectedLevel === lvl
                      ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/40 font-medium'
                      : 'bg-surface-subtle text-slate-600 dark:text-slate-400 border-border-subtle hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {lvl === 'all' ? 'Tutti' : lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Semantic Search Controls (if active) */}
        {viewMode === 'semantic' && (
          <form onSubmit={handleSemanticSearch} className="pt-2 border-t border-border-subtle space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Inserisci concetto o query semantica (es. preferenze architettura, vincoli UI)..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || semanticMutation.isPending}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500 shrink-0 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{semanticMutation.isPending ? 'Ricerca...' : 'Cerca'}</span>
              </button>
            </div>

            {/* Distance Threshold and Top K */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400 bg-surface-subtle/50 p-2.5 rounded-lg border border-border-subtle">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                <label htmlFor="dist-threshold-slider">Soglia Distanza Coseno:</label>
                <input
                  id="dist-threshold-slider"
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={distanceThreshold}
                  onChange={(e) => setDistanceThreshold(parseFloat(e.target.value))}
                  className="w-28 accent-brand-500"
                />
                <span className="font-mono text-slate-900 dark:text-white text-xs font-semibold">{distanceThreshold.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="top-k-select">Top K:</label>
                <select
                  id="top-k-select"
                  value={topK}
                  onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                  className="px-2 py-0.5 rounded bg-surface border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-mono"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-auto">
                0.0 = identico • 1.0 = ortogonale
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Main Content: Table and Drawer */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Conclusions Table */}
        <div className="flex-1 w-full rounded-xl border border-border-subtle bg-surface/80 overflow-hidden shadow-card">
          {viewMode === 'list' && isListLoading && <ShimmerList count={6} />}

          {viewMode === 'list' && listError && (
            <ErrorBanner
              message={listError instanceof Error ? listError.message : 'Errore caricamento conclusioni'}
              onRetry={() => refetchList()}
            />
          )}

          {viewMode === 'semantic' && semanticMutation.isError && (
            <ErrorBanner
              message={semanticMutation.error instanceof Error ? semanticMutation.error.message : 'Errore query semantica'}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle/80 text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-border-subtle font-mono">
                <tr>
                  <th className="py-2.5 px-3">Livello</th>
                  <th className="py-2.5 px-3">Contenuto Conclusione</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Observer → Observed</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">Premesse</th>
                  <th className="py-2.5 px-3 hidden lg:table-cell">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {displayedConclusions.map((conc) => {
                  const isSelected = conc.id === activeConclusionId;
                  const sourceCount = conc.source_ids?.length || 0;
                  return (
                    <tr
                      key={conc.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Dettaglio conclusione ${conc.id}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveConclusionId(conc.id);
                        }
                      }}
                      onClick={() => setActiveConclusionId(conc.id)}
                      className={`cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                        isSelected
                          ? 'bg-surface-elevated'
                          : 'hover:bg-surface-elevated/40'
                      }`}
                    >
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge level={conc.level}>{conc.level}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed font-sans">
                          {conc.content}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        <span className="text-slate-800 dark:text-slate-300 font-medium">{conc.observer_id}</span>
                        <span className="text-slate-400 dark:text-slate-600 mx-1">→</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{conc.observed_id}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400 hidden md:table-cell">
                        {sourceCount > 0 ? (
                          <span className="flex items-center gap-1 text-brand-600 dark:text-brand-300 font-medium">
                            <GitBranch className="w-3 h-3" />
                            {sourceCount} {sourceCount === 1 ? 'premessa' : 'premesse'}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">diretto</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {new Date(conc.created_at).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayedConclusions.length === 0 && !isListLoading && (
            <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400">
              {viewMode === 'list'
                ? 'Nessuna conclusione trovata con i filtri attuali.'
                : 'Nessun risultato semantico per questa query. Prova ad aumentare la soglia di distanza.'}
            </div>
          )}

          {/* List Pagination Footer */}
          {viewMode === 'list' && listData && listData.pages > 1 && (
            <div className="p-3 border-t border-border-subtle flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-surface/50 font-mono">
              <span>Pagina {listData.page} di {listData.pages} (Tot: {listData.total})</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-surface-elevated disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= listData.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1 rounded hover:bg-surface-elevated disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Derivation & Premise Details */}
        {activeConclusionId && (
          <div className="w-full lg:w-96 rounded-xl border border-border-subtle bg-surface/80 p-4 space-y-4 shrink-0 animate-in fade-in duration-100 shadow-card">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Dettaglio Derivazione
                </h3>
              </div>
              <button
                onClick={() => setActiveConclusionId(null)}
                className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Chiudi dettaglio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isDetailLoading && <ShimmerCard rows={3} />}

            {detailError && (
              <ErrorBanner
                message={detailError instanceof Error ? detailError.message : 'Errore recupero dettaglio'}
              />
            )}

            {detailData && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Livello Cognitivo</div>
                  <Badge level={detailData.level}>{detailData.level}</Badge>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Contenuto</div>
                  <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {detailData.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-surface-subtle/50 p-2.5 rounded-lg border border-border-subtle">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Observer:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{detailData.observer_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Observed:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{detailData.observed_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Derivazioni:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{detailData.times_derived || 1} volte</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Sessione:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{detailData.session_id || 'Globale'}</span>
                  </div>
                </div>

                {/* Premises & Source IDs */}
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">
                    Premesse Originarie (source_ids)
                  </div>
                  {detailData.source_ids && detailData.source_ids.length > 0 ? (
                    <div className="space-y-1.5">
                      {detailData.source_ids.map((sourceId) => (
                        <button
                          type="button"
                          key={sourceId}
                          onClick={() => setActiveConclusionId(sourceId)}
                          className="w-full text-left p-2 rounded bg-surface border border-slate-200 dark:border-slate-700/60 hover:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500 text-[11px] font-mono text-brand-600 dark:text-brand-300 flex items-center justify-between cursor-pointer transition font-medium"
                        >
                          <span className="truncate">{sourceId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-surface-subtle/40 border border-border-subtle text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Estrapolato direttamente dai messaggi conversazionali (source_ids vuoto).</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
