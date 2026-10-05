/**
 * Honcho v3.2.2 Typed Contracts
 * Schema-driven: generated strictly and reproducibly from OpenAPI snapshot.
 * Tool: scripts/generate-types.mjs
 */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export type ConclusionLevel = 'explicit' | 'deductive' | 'inductive' | 'contradiction';

export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max';

export interface Body_create_messages_with_file_v3_workspaces__workspace_id__sessions__session_id__messages_upload_post {
  file: string;
  peer_id: string;
  metadata?: string | null;
  configuration?: string | null;
  created_at?: string | null;
}

/**
 * Conclusion response - external view of a document.
 */
export interface Conclusion {
  id: string;
  content: string;
  /** The peer who made the conclusion */
  observer_id: string;
  /** The peer the conclusion is about */
  observed_id: string;
  session_id?: string | null;
  /** Reasoning level of the conclusion: 'explicit' (directly extracted from messages) or 'deductive'/'inductive'/'contradiction' (derived during dreaming). */
  level?: "explicit" | "deductive" | "inductive" | "contradiction";
  /** IDs of the conclusions this one was derived from: premises for 'deductive', supporting sources for 'inductive', conflicting conclusions for 'contradiction'. Empty for 'explicit' conclusions, which derive from messages rather than from other conclusions. */
  source_ids?: string[];
  /** Number of times this conclusion has been independently derived. */
  times_derived?: number;
  created_at: string;
}

/**
 * Schema for batch conclusion creation with a max of 100 conclusions.
 */
export interface ConclusionBatchCreate {
  conclusions: ConclusionCreate[];
}

/**
 * Schema for creating a single conclusion.
 */
export interface ConclusionCreate {
  content: string;
  /** The peer making the conclusion */
  observer_id: string;
  /** The peer the conclusion is about */
  observed_id: string;
  /** A session ID to store the conclusion in, if specified */
  session_id?: string | null;
}

/**
 * Schema for listing conclusions with optional filters.
 */
export interface ConclusionGet {
  filters?: Record<string, unknown> | null;
}

/**
 * Query parameters for semantic search of conclusions.
 */
export interface ConclusionQuery {
  /** Semantic search query */
  query: string;
  /** Number of results to return */
  top_k?: number;
  /** Maximum cosine distance threshold for results */
  distance?: number | null;
  /** Additional filters to apply */
  filters?: Record<string, unknown> | null;
}

export interface DialecticOptions {
  /** ID of the session to scope the representation to */
  session_id?: string | null;
  /** Optional filters to scope recall. This endpoint supports only the 'session_id' key: a session id, a list of session ids, or {"in": [...]}. Recall (conclusions and messages) is restricted to the allowlist; unsupported keys are rejected. When session_id is also set, it must be included in the allowlist. */
  filters?: Record<string, unknown> | null;
  /** Optional (unprefixed) scope name(s) to confine recall. A single scope answers from the scope's own representation of the target peer: conclusion recall is confined to what the scope observed and message recall to the scope's member sessions. A list of scopes restricts recall to the union of the scopes' member sessions (explicit allowlist, fail-closed: an empty union recalls nothing). Mutually exclusive with `filters` and `session_id`. Requires a workspace- or admin-level key. */
  scope?: string | string[] | null;
  /** Optional peer to get the representation for, from the perspective of this peer */
  target?: string | null;
  /** Dialectic API Prompt */
  query: string;
  stream?: boolean;
  /** Level of reasoning to apply: minimal, low, medium, high, or max */
  reasoning_level?: "minimal" | "low" | "medium" | "high" | "max";
  /** Optional JSON Schema (root type 'object') the response must conform to. When provided, `content` is a JSON string matching this schema. Only a conservative subset of JSON Schema is supported; unsupported  schemas are rejected with 422. Constraint keywords (minItems,  maxLength, ...) are hints to the model, not enforced server-side. */
  response_format?: Record<string, unknown> | null;
  /** When true, the response includes an `evidence` object listing the conclusions and messages the agent read while answering, plus the tool calls it made. Evidence is collated from what the agent accessed; the model is never asked to cite anything, so evidence may over-report (accessed is not the same as used). */
  include_evidence?: boolean;
}

export interface DreamConfiguration {
  /** Whether to enable dream functionality. If reasoning is disabled, dreams will also be disabled and this setting will be ignored. */
  enabled?: boolean | null;
}

/**
 * Types of dreams that can be triggered.
 */
export interface DreamType {
}

/**
 * The body returned for every raised HonchoException.
 * 
 * `HTTPValidationError` is FastAPI's own 422 shape, whose `detail` is an array
 * of per-field errors. Honcho's handler returns a single message string
 * instead (see `honcho_exception_handler` in `src/main.py`), so error codes
 * raised from application code document this schema rather than that one.
 */
export interface ErrorResponse {
  /** What went wrong */
  detail: string;
}

/**
 * What the dialectic agent read and did while answering.
 * 
 * Collated from the agent's own reads rather than reported by the model, so
 * it is deterministic but over-reports: it lists what the agent accessed,
 * which is not necessarily what the answer relied on.
 * 
 * Meant for auditing and analytics -- inspecting why an answer looks the way
 * it does, or measuring what recall actually reaches the agent. It is not a
 * read API: conclusions carry their text because that text is the thing being
 * audited and the deriver keeps it short, while messages carry identity alone
 * (see `EvidenceMessageRef`).
 */
export interface Evidence {
  /** Conclusions the agent read, whether prefetched or found via its tools */
  conclusions?: EvidenceObservation[];
  /** Messages the agent read via its search and grep tools, by ID and provenance only. Fetch a message to read its content. */
  messages?: EvidenceMessageRef[];
  /** Tools the agent invoked, in order, with their arguments. Results are omitted (they are reflected in `conclusions` and `messages`), and so are calls that failed, so this is a record of successful invocations rather than a complete reasoning trace. */
  tool_calls?: EvidenceToolCall[];
  /** ID of the stored reasoning trace for this call, when trace storage is enabled */
  reasoning_trace_id?: string | null;
}

/**
 * A message the dialectic agent read while answering.
 * 
 * Identity and provenance only -- no content. Message content is
 * caller-supplied and unbounded, so carrying it would let one answer drag
 * megabytes behind it, and would invite callers to read messages out of
 * evidence in bulk rather than asking for the ones they want. Fetch the
 * message by `id` when the text is needed.
 */
export interface EvidenceMessageRef {
  /** Message ID */
  id: string;
  /** Session the message belongs to */
  session_id: string;
  /** Peer who sent the message */
  peer_id: string;
  /** When the message was sent */
  created_at: string;
}

/**
 * A conclusion the dialectic agent read while answering.
 */
export interface EvidenceObservation {
  /** Conclusion (document) ID */
  id: string;
  /** Conclusion level: explicit, deductive, inductive, or contradiction */
  level: "explicit" | "deductive" | "inductive" | "contradiction";
  /** The conclusion text (the derived conclusion, for non-explicit levels) */
  content: string;
  /** When the conclusion was derived, from its source messages when known */
  created_at: string;
  /** Session the conclusion is scoped to, if any */
  session_id?: string | null;
  /** The peer who made the conclusion */
  observer_id: string;
  /** The peer the conclusion is about */
  observed_id: string;
  /** IDs of the conclusions this one was derived from. Empty for explicit conclusions, which derive from messages rather than from other conclusions. */
  source_ids?: string[];
}

/**
 * A tool the dialectic agent invoked while answering.
 */
export interface EvidenceToolCall {
  /** Name of the tool */
  tool_name: string;
  /** Arguments the agent passed to the tool */
  tool_input?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface Message {
  id: string;
  content: string;
  peer_id: string;
  session_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  workspace_id: string;
  token_count: number;
}

/**
 * Schema for batch message creation with a max of 100 messages
 */
export interface MessageBatchCreate {
  messages: MessageCreate[];
}

/**
 * The set of options that can be in a message DB-level configuration dictionary.
 * 
 * All fields are optional. Message-level configuration overrides all other configurations.
 */
export interface MessageConfiguration {
  /** Configuration for reasoning functionality. */
  reasoning?: ReasoningConfiguration | null;
}

export interface MessageCreate {
  content: string;
  peer_id: string;
  metadata?: Record<string, unknown> | null;
  configuration?: MessageConfiguration | null;
  created_at?: string | null;
}

export interface MessageGet {
  filters?: Record<string, unknown> | null;
}

export interface MessageSearchOptions {
  /** Search query */
  query: string;
  /** Filters to scope the search */
  filters?: Record<string, unknown> | null;
  /** Number of results to return */
  limit?: number;
}

export interface MessageUpdate {
  metadata?: Record<string, unknown> | null;
}

export interface Page_Conclusion_ {
  items: Conclusion[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_Message_ {
  items: Message[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_Peer_ {
  items: Peer[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_Scope_ {
  items: Scope[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_Session_ {
  items: Session[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_WebhookEndpoint_ {
  items: WebhookEndpoint[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Page_Workspace_ {
  items: Workspace[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Peer {
  id: string;
  workspace_id: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
}

export interface PeerCardConfiguration {
  /** Whether to use peer card related to this peer during reasoning process. */
  use?: boolean | null;
  /** Whether to generate peer card based on content. */
  create?: boolean | null;
}

export interface PeerCardResponse {
  /** The peer card content, or None if not found */
  peer_card?: string[] | null;
}

export interface PeerCardSet {
  /** The peer card content to set */
  peer_card: string[];
}

/**
 * Context for a peer, including representation and peer card.
 */
export interface PeerContext {
  /** The ID of the peer */
  peer_id: string;
  /** The ID of the target peer being observed */
  target_id: string;
  /** A curated subset of the representation of the target peer from the observer's perspective */
  representation?: string | null;
  /** The peer card for the target peer from the observer's perspective */
  peer_card?: string[] | null;
}

export interface PeerCreate {
  id: string;
  metadata?: Record<string, unknown> | null;
  configuration?: Record<string, unknown> | null;
}

export interface PeerGet {
  filters?: Record<string, unknown> | null;
  /** Which kinds of peers to list. Omitted (default): regular peers only (scope peers are excluded). 'scope': scope peers only. 'all': every peer. */
  kind?: "scope" | "all" | null;
}

export interface PeerRepresentationGet {
  /** Optional session ID within which to scope the representation */
  session_id?: string | null;
  /** Optional filters to scope the representation. This endpoint supports only the 'session_id' key: a session id, a list of session ids, or {"in": [...]}. When session_id is also set, it must be included in the allowlist. */
  filters?: Record<string, unknown> | null;
  /** Optional (unprefixed) scope name(s) to confine the representation. A single scope reads the scope's own representation of the target peer, formed only from the scope's member sessions. A list of scopes restricts the representation to conclusions from the union of the scopes' member sessions (explicit allowlist, fail-closed: an empty union yields an empty representation). Mutually exclusive with `filters` and `session_id`. Requires a workspace- or admin-level key. */
  scope?: string | string[] | null;
  /** Optional peer ID to get the representation for, from the perspective of this peer */
  target?: string | null;
  /** Optional input to curate the representation around semantic search results */
  search_query?: string | null;
  /** Only used if `search_query` is provided. Number of semantic-search-retrieved conclusions to include in the representation */
  search_top_k?: number | null;
  /** Only used if `search_query` is provided. Maximum distance to search for semantically relevant conclusions */
  search_max_distance?: number | null;
  /** Only used if `search_query` is provided. Whether to include the most frequent conclusions in the representation */
  include_most_frequent?: boolean | null;
  /** Only used if `search_query` is provided. Maximum number of conclusions to include in the representation */
  max_conclusions?: number | null;
}

export interface PeerUpdate {
  metadata?: Record<string, unknown> | null;
  configuration?: Record<string, unknown> | null;
}

/**
 * Aggregated processing queue status.
 * 
 * Tracks user-facing task types only: representation, summary, and dream.
 * Internal infrastructure tasks (reconciler, webhook, deletion) are excluded.
 * 
 * Note: completed_work_units reflects items since the last periodic queue
 * cleanup, not lifetime totals.
 */
export interface QueueStatus {
  /** Total work units */
  total_work_units: number;
  /** Completed work units (since last periodic cleanup) */
  completed_work_units: number;
  /** Work units currently being processed */
  in_progress_work_units: number;
  /** Work units waiting to be processed */
  pending_work_units: number;
  /** Per-session status when not filtered by session */
  sessions?: Record<string, SessionQueueStatus> | null;
}

export interface ReasoningConfiguration {
  /** Whether to enable reasoning functionality. */
  enabled?: boolean | null;
  /** Optional custom instructions for the reasoning system on this workspace/session/message. Rejected if they exceed the deriver custom-instruction token cap. */
  custom_instructions?: string | null;
}

export interface RepresentationResponse {
  representation: string;
}

export interface ScheduleDreamRequest {
  /** Observer peer name */
  observer: string;
  /** Observed peer name (defaults to observer if not specified) */
  observed?: string | null;
  /** Type of dream to schedule */
  dream_type: DreamType;
  /** Session ID to scope the dream to if specified */
  session_id?: string | null;
  /** card_refresh dreams only: rebuild the peer card solely from observations currently in the collection, without injecting the existing card (use after removals) */
  rebuild?: boolean;
}

/**
 * Scope response — external view of the peer backing a scope.
 * 
 * The ``id`` is the unprefixed scope name; the reserved peer-name prefix is
 * an internal implementation detail and never surfaces here.
 */
export interface Scope {
  id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Schema for creating (or getting) a scope by its unprefixed name.
 */
export interface ScopeCreate {
  id: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Schema for adding sessions to a scope.
 */
export interface ScopeSessionsAdd {
  /** IDs of existing sessions to add to the scope */
  session_ids: string[];
}

/**
 * Per-session backfill/reconciliation job status for a scope.
 * 
 * ``backfill_status`` maps each session that has had a backfill enqueued to
 * its current job state: ``{state, updated_at[, docs_copied]}`` where
 * ``state`` is ``pending``/``completed``/``failed`` and ``docs_copied`` is
 * present once a backfill completes.
 */
export interface ScopeStatus {
  backfill_status?: Record<string, unknown>;
}

export interface Session {
  id: string;
  is_active: boolean;
  workspace_id: string;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  created_at: string;
}

/**
 * The set of options that can be in a session DB-level configuration dictionary.
 * 
 * All fields are optional. Session-level configuration overrides workspace-level configuration, which overrides global configuration.
 */
export interface SessionConfiguration {
  /** Configuration for reasoning functionality. */
  reasoning?: ReasoningConfiguration | null;
  /** Configuration for peer card functionality. If reasoning is disabled, peer cards will also be disabled and these settings will be ignored. */
  peer_card?: PeerCardConfiguration | null;
  /** Configuration for summary functionality. */
  summary?: SummaryConfiguration | null;
  /** Configuration for dream functionality. If reasoning is disabled, dreams will also be disabled and these settings will be ignored. */
  dream?: DreamConfiguration | null;
}

export interface SessionContext {
  id: string;
  messages: Message[];
  /** The summary if available */
  summary?: Summary | null;
  /** A curated subset of a peer representation, if context is requested from a specific perspective */
  peer_representation?: string | null;
  /** The peer card, if context is requested from a specific perspective */
  peer_card?: string[] | null;
}

export interface SessionCreate {
  id: string;
  metadata?: Record<string, unknown> | null;
  peers?: Record<string, SessionPeerConfig> | null;
  configuration?: SessionConfiguration | null;
  /** Optional list of (unprefixed) scope names to add this session to. Each scope is created if it does not exist yet. If the session already has messages, its existing documents are backfilled into the scope asynchronously. */
  scopes?: string[] | null;
}

export interface SessionGet {
  filters?: Record<string, unknown> | null;
}

export interface SessionPeerConfig {
  /** Whether Honcho will use reasoning to form a representation of this peer */
  observe_me?: boolean | null;
  /** Whether this peer should form a session-level theory-of-mind representation of other peers in the session */
  observe_others?: boolean | null;
}

/**
 * Status for a specific session within the processing queue.
 */
export interface SessionQueueStatus {
  /** Session ID if filtered by session */
  session_id?: string | null;
  /** Total work units */
  total_work_units: number;
  /** Completed work units */
  completed_work_units: number;
  /** Work units currently being processed */
  in_progress_work_units: number;
  /** Work units waiting to be processed */
  pending_work_units: number;
}

export interface SessionSummaries {
  id: string;
  /** The short summary if available */
  short_summary?: Summary | null;
  /** The long summary if available */
  long_summary?: Summary | null;
}

export interface SessionUpdate {
  metadata?: Record<string, unknown> | null;
  configuration?: SessionConfiguration | null;
}

export interface Summary {
  /** The summary text */
  content: string;
  /** The public ID of the message that this summary covers up to */
  message_id: string;
  /** The type of summary (short or long) */
  summary_type: string;
  /** The timestamp of when the summary was created (ISO format) */
  created_at: string;
  /** The number of tokens in the summary text */
  token_count: number;
}

export interface SummaryConfiguration {
  /** Whether to enable summary functionality. */
  enabled?: boolean | null;
  /** Number of messages per short summary. Must be positive, greater than or equal to 10, and less than messages_per_long_summary. */
  messages_per_short_summary?: number | null;
  /** Number of messages per long summary. Must be positive, greater than or equal to 20, and greater than messages_per_short_summary. */
  messages_per_long_summary?: number | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface WebhookEndpoint {
  id: string;
  workspace_id: string | null;
  url: string;
  created_at: string;
}

export interface WebhookEndpointCreate {
  url: string;
}

export interface Workspace {
  id: string;
  metadata?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  created_at: string;
}

/**
 * Options for workspace-level chat (no anchor peer; see DialecticOptions).
 */
export interface WorkspaceChatOptions {
  /** Optional session to scope message tools to */
  session_id?: string | null;
  /** Workspace chat prompt */
  query: string;
  stream?: boolean;
  /** Level of reasoning to apply: minimal, low, medium, high, or max */
  reasoning_level?: "minimal" | "low" | "medium" | "high" | "max";
  /** Optional JSON Schema (root type 'object') the response must conform to. When provided, `content` is a JSON string matching this schema. */
  response_format?: Record<string, unknown> | null;
  /** Optional (unprefixed) scope name(s) restricting recall to the union of the scopes' member sessions (explicit allowlist, fail-closed: an empty union recalls nothing). Mutually exclusive with `session_id`. Requires a workspace- or admin-level key. */
  scope?: string | string[] | null;
  /** When true, the response includes an `evidence` object listing the conclusions and messages the agent read while answering, plus the tool calls it made. Evidence is collated from what the agent accessed; the model is never asked to cite anything, so evidence may over-report (accessed is not the same as used). */
  include_evidence?: boolean;
}

/**
 * The set of options that can be in a workspace DB-level configuration dictionary.
 * 
 * All fields are optional. Session-level configuration overrides workspace-level configuration, which overrides global configuration.
 */
export interface WorkspaceConfiguration {
  /** Configuration for reasoning functionality. */
  reasoning?: ReasoningConfiguration | null;
  /** Configuration for peer card functionality. If reasoning is disabled, peer cards will also be disabled and these settings will be ignored. */
  peer_card?: PeerCardConfiguration | null;
  /** Configuration for summary functionality. */
  summary?: SummaryConfiguration | null;
  /** Configuration for dream functionality. If reasoning is disabled, dreams will also be disabled and these settings will be ignored. */
  dream?: DreamConfiguration | null;
}

export interface WorkspaceCreate {
  id: string;
  metadata?: Record<string, unknown>;
  configuration?: WorkspaceConfiguration;
}

export interface WorkspaceGet {
  filters?: Record<string, unknown> | null;
}

/**
 * Workspace-level message search options, extended with `scope`.
 */
export interface WorkspaceMessageSearchOptions {
  /** Search query */
  query: string;
  /** Filters to scope the search */
  filters?: Record<string, unknown> | null;
  /** Number of results to return */
  limit?: number;
  /** Optional (unprefixed) scope name restricting search to the scope's member sessions. A scope with no member sessions returns no results. Mutually exclusive with a 'session_id' key in `filters`. */
  scope?: string | null;
}

export interface WorkspaceUpdate {
  metadata?: Record<string, unknown> | null;
  configuration?: WorkspaceConfiguration | null;
}

export interface DialecticResponse {
  content: string | null;
  evidence?: Evidence | null;
}

export interface DialecticStreamChunk {
  delta?: {
    content?: string;
  };
  done: boolean;
  evidence?: Evidence | null;
  error?: string;
}
