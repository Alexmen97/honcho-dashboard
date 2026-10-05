import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Square,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Compass,
  Wrench,
  User,
  ShieldAlert,
  Info,
  Layers,
} from 'lucide-react';
import { api, ApiError } from '../../api/client';
import {
  DialecticOptions,
  Evidence,
  ReasoningLevel,
  EvidenceMessageRef,
  Message,
} from '../../types/api';
import { Badge } from '../common/Badge';

interface DialecticTabProps {
  workspaceId: string;
  defaultPeerId?: string;
  availablePeers?: string[];
  availableSessions?: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  evidence?: Evidence | null;
  timestamp: string;
  isStreaming?: boolean;
}

export const DialecticTab: React.FC<DialecticTabProps> = ({
  workspaceId,
  defaultPeerId = 'alex',
  availablePeers = [],
  availableSessions = [],
}) => {
  // Config state
  const [anchorPeerId, setAnchorPeerId] = useState<string>(defaultPeerId);
  const [targetPeerId, setTargetPeerId] = useState<string>('');
  const [scopeMode, setScopeMode] = useState<'none' | 'session' | 'scope'>('session');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [scopeName, setScopeName] = useState<string>('');
  const [reasoningLevel, setReasoningLevel] = useState<ReasoningLevel>('low');
  const [useStream, setUseStream] = useState<boolean>(true);
  const [includeEvidence, setIncludeEvidence] = useState<boolean>(true);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Referenced message inspector cache (fetch on demand)
  const [fetchedMessages, setFetchedMessages] = useState<Record<string, Message>>({});
  const [fetchingMessageId, setFetchingMessageId] = useState<string | null>(null);

  // Active expanded evidence message ID
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  // Abort controller reference
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset conversation and abort ongoing requests on workspace switch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setChatError(null);
    setIsGenerating(false);
  }, [workspaceId]);

  useEffect(() => {
    if (typeof scrollEndRef.current?.scrollIntoView === 'function') {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Mutual Exclusivity: selecting scope mode adjusts inputs
  const handleScopeModeChange = (mode: 'none' | 'session' | 'scope') => {
    setScopeMode(mode);
    if (mode === 'session') {
      setScopeName('');
      if (!selectedSessionId && availableSessions.length > 0) {
        setSelectedSessionId(availableSessions[0]);
      }
    } else if (mode === 'scope') {
      setSelectedSessionId('');
    } else {
      setSelectedSessionId('');
      setScopeName('');
    }
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    // Mark current streaming message as done
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  };

  const handleFetchMessageOnDemand = async (msgRef: EvidenceMessageRef) => {
    if (fetchedMessages[msgRef.id] || fetchingMessageId === msgRef.id) return;
    setFetchingMessageId(msgRef.id);
    try {
      const msg = await api.getMessage(workspaceId, msgRef.session_id, msgRef.id);
      setFetchedMessages((prev) => ({ ...prev, [msgRef.id]: msg }));
    } catch (err) {
      console.error('Failed to fetch evidence message on demand:', err);
    } finally {
      setFetchingMessageId(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, retryQuery?: string) => {
    if (e) e.preventDefault();
    const query = (retryQuery || inputQuery).trim();
    if (!query || isGenerating) return;

    setChatError(null);
    if (!retryQuery) setInputQuery('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      isStreaming: useStream,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Prepare strict DialecticOptions
    const options: DialecticOptions = {
      query,
      stream: useStream,
      reasoning_level: reasoningLevel,
      include_evidence: includeEvidence,
      target: targetPeerId.trim() || undefined,
    };

    // Mutual exclusivity enforcement
    if (scopeMode === 'session' && selectedSessionId.trim()) {
      options.session_id = selectedSessionId.trim();
      options.scope = null;
    } else if (scopeMode === 'scope' && scopeName.trim()) {
      options.scope = scopeName.trim();
      options.session_id = null;
    } else {
      options.session_id = null;
      options.scope = null;
    }

    try {
      if (useStream) {
        let accumulatedContent = '';
        let finalEvidence: Evidence | null = null;

        await api.streamDialecticChat(
          workspaceId,
          anchorPeerId,
          options,
          (chunk) => {
            if (controller.signal.aborted) {
              return;
            }
            if (chunk.delta?.content) {
              accumulatedContent += chunk.delta.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulatedContent, isStreaming: !chunk.done }
                    : m
                )
              );
            }
            if (chunk.evidence) {
              finalEvidence = chunk.evidence;
            }
            if (chunk.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: accumulatedContent,
                        evidence: finalEvidence || chunk.evidence,
                        isStreaming: false,
                      }
                    : m
                )
              );
            }
          },
          controller.signal
        );
      } else {
        // Buffered non-streaming mode
        const res = await api.dialecticChat(workspaceId, anchorPeerId, options);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: res.content || '',
                  evidence: res.evidence,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // User cancelled, not an error
        return;
      }
      const msg = err instanceof ApiError ? err.message : 'Errore durante la generazione dialettica';
      setChatError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `[Errore: ${msg}]`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col rounded-xl border border-border-subtle bg-surface/40 overflow-hidden">
      {/* Configuration Toolbar */}
      <div className="p-3 border-b border-border-subtle bg-surface/70 backdrop-blur-sm space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Peer Perspective: Anchor & Target */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Anchor Peer:</span>
              <select
                value={anchorPeerId}
                onChange={(e) => setAnchorPeerId(e.target.value)}
                className="px-2 py-1 rounded bg-surface-subtle border border-slate-700 text-white text-xs font-mono focus:ring-1 focus:ring-brand-500"
              >
                <option value="alex">alex</option>
                {availablePeers
                  .filter((p) => p !== 'alex')
                  .map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-500">Target (opz.):</span>
              <input
                type="text"
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
                placeholder="es. user / peer"
                className="w-24 px-2 py-1 rounded bg-surface-subtle border border-slate-700 text-white text-xs font-mono placeholder-slate-600 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Scope vs Session Mutual Exclusivity */}
            <div className="flex items-center gap-1.5 text-xs bg-surface-subtle/80 p-1 rounded-lg border border-border-subtle">
              <span className="text-[11px] text-slate-500 font-mono px-1">Scope:</span>
              <button
                type="button"
                onClick={() => handleScopeModeChange('none')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  scopeMode === 'none'
                    ? 'bg-surface-elevated text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Globale
              </button>
              <button
                type="button"
                onClick={() => handleScopeModeChange('session')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  scopeMode === 'session'
                    ? 'bg-surface-elevated text-brand-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sessione
              </button>
              <button
                type="button"
                onClick={() => handleScopeModeChange('scope')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  scopeMode === 'scope'
                    ? 'bg-surface-elevated text-emerald-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Named Scope
              </button>

              {scopeMode === 'session' && (
                <input
                  type="text"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  placeholder="ID Sessione (es. session-01)"
                  className="w-32 px-2 py-0.5 rounded bg-surface border border-slate-700 text-white text-xs font-mono placeholder-slate-600"
                />
              )}

              {scopeMode === 'scope' && (
                <input
                  type="text"
                  value={scopeName}
                  onChange={(e) => setScopeName(e.target.value)}
                  placeholder="Nome Scope"
                  className="w-32 px-2 py-0.5 rounded bg-surface border border-slate-700 text-white text-xs font-mono placeholder-slate-600"
                />
              )}
            </div>
          </div>

          {/* Reasoning & Stream Settings */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Ragionamento:</span>
              <select
                value={reasoningLevel}
                onChange={(e) => setReasoningLevel(e.target.value as ReasoningLevel)}
                className="px-2 py-1 rounded bg-surface-subtle border border-slate-700 text-white text-xs font-mono focus:ring-1 focus:ring-brand-500"
              >
                <option value="minimal">minimal</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="max">max</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useStream}
                onChange={(e) => setUseStream(e.target.checked)}
                className="rounded bg-surface-subtle border-slate-700 text-brand-500 accent-brand-500"
              />
              <span>SSE</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeEvidence}
                onChange={(e) => setIncludeEvidence(e.target.checked)}
                className="rounded bg-surface-subtle border-slate-700 text-brand-500 accent-brand-500"
              />
              <span>Evidenze</span>
            </label>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-600 shrink-0" />
          <span>
            {scopeMode === 'scope'
              ? 'Named Scope attivo: session_id e filters esclusi dalla richiesta per vincolo API schema.'
              : scopeMode === 'session'
              ? 'Session Scoped attivo: limitato ai messaggi e alle conclusioni della sessione.'
              : 'Recall globale: attinge dall\'intera rappresentazione senza restrizioni di sessione.'}
          </span>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Sparkles className="w-10 h-10 mb-3 text-brand-500/50 animate-pulse" />
            <h4 className="text-sm font-semibold text-slate-300">Dialectic Reasoning Playground</h4>
            <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
              Interroga la rappresentazione cognitiva di Honcho con streaming SSE in tempo reale ed ispezione deterministica delle evidenze consultate.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`p-3.5 rounded-xl border max-w-[90%] sm:max-w-[80%] ${
                isUser
                  ? 'ml-auto bg-surface-elevated/90 border-slate-700 text-slate-100'
                  : 'mr-auto bg-surface/90 border-border-subtle text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[11px] mb-2 pb-1.5 border-b border-white/5 font-mono">
                <div className="flex items-center gap-1.5">
                  {isUser ? (
                    <>
                      <User className="w-3.5 h-3.5 text-brand-400" />
                      <span className="font-semibold text-slate-300">Tu</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-400">{anchorPeerId} (Dialectic)</span>
                    </>
                  )}
                </div>
                <span className="text-slate-500">{msg.timestamp}</span>
              </div>

              {/* Safe content rendering */}
              <div className="text-xs leading-relaxed whitespace-pre-wrap break-words font-sans">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 bg-brand-400 ml-1 cursor-blink" />
                )}
              </div>

              {/* Collapsible Evidence Section */}
              {msg.evidence && (
                <div className="mt-3 pt-2.5 border-t border-border-subtle">
                  <button
                    onClick={() =>
                      setExpandedEvidenceId(expandedEvidenceId === msg.id ? null : msg.id)
                    }
                    className="flex items-center justify-between w-full text-[11px] font-mono text-brand-400 hover:text-brand-300 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        Evidenze Consultate (
                        {(msg.evidence.conclusions?.length || 0) +
                          (msg.evidence.messages?.length || 0) +
                          (msg.evidence.tool_calls?.length || 0)}
                        )
                      </span>
                    </div>
                    {expandedEvidenceId === msg.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {expandedEvidenceId === msg.id && (
                    <div className="mt-2.5 space-y-2.5 text-xs animate-in fade-in duration-100">
                      {/* Conclusions Accessed */}
                      {msg.evidence.conclusions && msg.evidence.conclusions.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-amber-400" />
                            <span>Conclusioni Lette ({msg.evidence.conclusions.length}):</span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.evidence.conclusions.map((c) => (
                              <div
                                key={c.id}
                                className="p-2 rounded bg-surface border border-slate-800 text-[11px] font-sans"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge level={c.level}>{c.level}</Badge>
                                  <span className="font-mono text-[10px] text-slate-500">
                                    {c.observer_id} → {c.observed_id}
                                  </span>
                                </div>
                                <div className="text-slate-300">{c.content}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages Accessed (provenance only, on-demand fetch) */}
                      {msg.evidence.messages && msg.evidence.messages.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-brand-400" />
                            <span>Messaggi Consultati ({msg.evidence.messages.length}):</span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.evidence.messages.map((mRef) => {
                              const isFetched = Boolean(fetchedMessages[mRef.id]);
                              const isFetching = fetchingMessageId === mRef.id;
                              return (
                                <div
                                  key={mRef.id}
                                  className="p-2 rounded bg-surface border border-slate-800 text-[11px] font-mono"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-300">
                                      {mRef.peer_id} @ {mRef.session_id}
                                    </span>
                                    {!isFetched ? (
                                      <button
                                        onClick={() => handleFetchMessageOnDemand(mRef)}
                                        disabled={isFetching}
                                        className="text-[10px] text-brand-400 hover:text-brand-300 underline"
                                      >
                                        {isFetching ? 'Caricamento...' : 'Leggi contenuto'}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-emerald-400">Caricato</span>
                                    )}
                                  </div>
                                  {isFetched && (
                                    <div className="mt-1 pt-1 border-t border-slate-800 font-sans text-slate-300 text-xs">
                                      {fetchedMessages[mRef.id].content}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {msg.evidence.tool_calls && msg.evidence.tool_calls.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-surface-subtle/80 border border-border-subtle">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-emerald-400" />
                            <span>Invocazioni Tool ({msg.evidence.tool_calls.length}):</span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            {msg.evidence.tool_calls.map((t, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded bg-surface border border-slate-800 text-slate-300"
                              >
                                <span className="text-brand-300">{t.tool_name}</span>
                                {t.tool_input && (
                                  <span className="text-slate-500 ml-1">
                                    ({JSON.stringify(t.tool_input)})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 font-mono italic">
                        * Le evidenze tracciano le letture deterministiche dell'agente (auditing trace).
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={scrollEndRef} />
      </div>

      {/* Input / Cancel / Retry Bar */}
      <div className="p-3 border-t border-border-subtle bg-surface/70 space-y-2 shrink-0">
        {chatError && (
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{chatError}</span>
            </div>
            <button
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
                if (lastUserMsg) handleSubmit(undefined, lastUserMsg.content);
              }}
              className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-[11px] text-rose-200 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Riprova
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isGenerating}
            placeholder="Poni una domanda dialettica alla cognizione di Honcho..."
            className="flex-1 px-3 py-2 rounded-lg bg-surface-subtle border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={cancelGeneration}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition flex items-center gap-1.5 focus:ring-2 focus:ring-rose-400 shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Interrompi</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition disabled:opacity-40 flex items-center gap-1.5 focus:ring-2 focus:ring-brand-500 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invia</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
