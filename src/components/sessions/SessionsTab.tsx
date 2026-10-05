import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  Hash,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { ShimmerList } from '../common/LoadingShimmer';
import { ErrorBanner } from '../common/ErrorBanner';

interface SessionsTabProps {
  workspaceId: string;
  onOpenCreateSession: () => void;
  availablePeers?: string[];
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  workspaceId,
  onOpenCreateSession,
  availablePeers = [],
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Composer state
  const [composerContent, setComposerContent] = useState('');
  const [composerPeerId, setComposerPeerId] = useState<string>('alex');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [showSummaries, setShowSummaries] = useState(false);

  // Sessions Query
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'sessions', { page, pageSize }],
    queryFn: () => api.listSessions(workspaceId, page, pageSize, true),
    enabled: Boolean(workspaceId),
  });

  // Automatically select first session if none selected
  const activeSessionId = selectedSessionId || (sessionsData?.items?.[0]?.id ?? null);

  // Messages Query
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'session', activeSessionId, 'messages'],
    queryFn: () => api.listMessages(workspaceId, activeSessionId!, 1, 50, false),
    enabled: Boolean(workspaceId && activeSessionId),
  });

  // Session Summaries Query
  const { data: summariesData } = useQuery({
    queryKey: ['workspace', workspaceId, 'session', activeSessionId, 'summaries'],
    queryFn: () => api.getSessionSummaries(workspaceId, activeSessionId!),
    enabled: Boolean(workspaceId && activeSessionId && showSummaries),
  });

  // Create Message Mutation (batch 1..100)
  const messageMutation = useMutation({
    mutationFn: async ({ content, peerId }: { content: string; peerId: string }) => {
      if (!activeSessionId) throw new Error('Nessuna sessione attiva');
      return api.createMessagesBatch(workspaceId, activeSessionId, {
        messages: [
          {
            content: content.trim(),
            peer_id: peerId.trim(),
            metadata: { client: 'honcho-cognition-studio' },
          },
        ],
      });
    },
    onSuccess: () => {
      setComposerContent('');
      setComposerError(null);
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'session', activeSessionId, 'messages'],
      });
    },
    onError: (err: unknown) => {
      setComposerError(err instanceof ApiError ? err.message : 'Impossibile inviare il messaggio');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerContent.trim() || messageMutation.isPending) return;
    setComposerError(null);
    messageMutation.mutate({
      content: composerContent,
      peerId: composerPeerId || 'alex',
    });
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left Column: Sessions Directory */}
      <div className="w-full md:w-80 shrink-0 flex flex-col rounded-xl border border-border-subtle bg-surface/80 overflow-hidden shadow-card">
        <div className="p-3 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Sessioni</h3>
          </div>
          <button
            onClick={onOpenCreateSession}
            className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-elevated transition focus:ring-2 focus:ring-brand-500"
            title="Nuova Sessione"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isSessionsLoading && <ShimmerList count={5} />}

          {sessionsError && (
            <ErrorBanner
              message={sessionsError instanceof Error ? sessionsError.message : 'Errore sessioni'}
              onRetry={() => refetchSessions()}
            />
          )}

          {sessionsData?.items.map((session) => {
            const isSelected = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`w-full text-left p-2.5 rounded-lg transition border ${
                  isSelected
                    ? 'bg-surface-elevated border-brand-500/40 text-slate-900 dark:text-white shadow-sm'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-surface-elevated/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium truncate">{session.id}</span>
                  {session.is_active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  )}
                </div>
                {session.created_at && (
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(session.created_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </button>
            );
          })}

          {sessionsData && sessionsData.items.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-400">
              Nessuna sessione trovata nel workspace. Crea la prima sessione!
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {sessionsData && sessionsData.pages > 1 && (
          <div className="p-2 border-t border-border-subtle flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-surface/50 font-mono">
            <span>Pagina {sessionsData.page} di {sessionsData.pages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-surface-elevated disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= sessionsData.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded hover:bg-surface-elevated disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Timeline & Composer */}
      <div className="flex-1 flex flex-col rounded-xl border border-border-subtle bg-surface/80 overflow-hidden shadow-card">
        {activeSessionId ? (
          <>
            {/* Session Top Bar */}
            <div className="p-3 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Sessione:</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{activeSessionId}</span>
              </div>
              <button
                onClick={() => setShowSummaries(!showSummaries)}
                className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition ${
                  showSummaries
                    ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-brand-500/30'
                    : 'bg-surface-subtle text-slate-600 dark:text-slate-400 border-border-subtle hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Sommari</span>
              </button>
            </div>

            {/* Summaries Panel Drawer (if toggled) */}
            {showSummaries && (
              <div className="p-4 border-b border-border-subtle bg-surface-subtle/50 text-xs space-y-3 animate-in slide-in-from-top-2">
                <div className="font-semibold text-slate-800 dark:text-slate-300">Sommari Sessione Honcho</div>
                {summariesData ? (
                  <div className="space-y-2">
                    {summariesData.short_summary && (
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Breve</div>
                        <div className="text-slate-800 dark:text-slate-300 font-mono">{summariesData.short_summary.content}</div>
                      </div>
                    )}
                    {summariesData.long_summary && (
                      <div className="p-2.5 rounded bg-surface border border-border-subtle">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">Esteso</div>
                        <div className="text-slate-800 dark:text-slate-300 font-mono">{summariesData.long_summary.content}</div>
                      </div>
                    )}
                    {!summariesData.short_summary && !summariesData.long_summary && (
                      <div className="text-slate-600 dark:text-slate-400 italic">Nessun sommario generato finora dal dreaming cycle.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-600 dark:text-slate-400 italic">Caricamento sommari...</div>
                )}
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isMessagesLoading && <ShimmerList count={4} />}

              {messagesError && (
                <ErrorBanner
                  message={messagesError instanceof Error ? messagesError.message : 'Errore recupero messaggi'}
                  onRetry={() => refetchMessages()}
                />
              )}

              {messagesData?.items.map((msg) => {
                const isUser = msg.peer_id === 'user' || msg.peer_id === 'alex';
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border max-w-[85%] ${
                      isUser
                        ? 'ml-auto bg-brand-50 border-brand-200 text-slate-800 dark:bg-surface-elevated/90 dark:border-slate-700/80 dark:text-slate-100 shadow-sm'
                        : 'mr-auto bg-surface border-border-subtle text-slate-800 dark:text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5 pb-1 border-b border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{msg.peer_id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {msg.id.substring(0, 8)}
                        </span>
                        <span>•</span>
                        <span>{msg.token_count} tok</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.created_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Safe text rendering, whitespace preserved */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {messagesData && messagesData.items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 dark:text-slate-400">
                  <MessageSquare className="w-8 h-8 mb-2 text-slate-400 dark:text-slate-500" />
                  <p className="text-xs">Nessun messaggio in questa sessione.</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Invia il primo messaggio con il compositore sottostante.</p>
                </div>
              )}
            </div>

            {/* Composer Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-surface-subtle/50 space-y-2">
              {composerError && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{composerError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-mono">Mittente:</span>
                <select
                  value={composerPeerId}
                  onChange={(e) => setComposerPeerId(e.target.value)}
                  className="px-2 py-1 rounded bg-surface border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-1 focus:ring-brand-500"
                >
                  <option value="alex">alex</option>
                  <option value="user">user</option>
                  <option value="assistant">assistant</option>
                  {availablePeers
                    .filter(p => !['alex', 'user', 'assistant'].includes(p))
                    .map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Schema: MessageBatchCreate (1..100)
                </span>
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder="Scrivi un messaggio per Honcho (es. Definire i vincoli di stile)..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSendMessage(e);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-sans"
                />
                <button
                  type="submit"
                  disabled={!composerContent.trim() || messageMutation.isPending}
                  className="h-10 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500 shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{messageMutation.isPending ? 'Invio...' : 'Invia'}</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs">
            Seleziona una sessione per visualizzare i messaggi
          </div>
        )}
      </div>
    </div>
  );
};
