# Honcho v3.2.2 API Schema & Architectural Alignment
**Target Instance:** `http://192.168.4.91:8000`  
**API Specification:** Verified against OpenAPI 3.1.0 at `/openapi.json`  
**Revision:** v1.1 (Corrections applied: query pagination, batch messages, representation query semantics, mutual exclusivity of scope, and empirical runtime SSE verification)  
**Target Peer:** `alex` (located in workspace `test-hermes-workspace`)

---

## 1. Executive Summary & Verification

The Honcho v3.2.2 instance running at `http://192.168.4.91:8000` is active and responsive. The API schema and live runtime behavior have been thoroughly inspected and tested.

Key architectural corrections verified against OpenAPI 3.1.0:
1. **Query Parameters for Pagination:** In all `/list` endpoints (`POST /v3/workspaces/list`, `POST /v3/workspaces/{id}/sessions/list`, etc.), `page`, `size`, and `reverse` are **Query Parameters** (`in: query`), NOT JSON body fields. The optional POST body contains filter objects (`WorkspaceGet`, `SessionGet`, `PeerGet`, `MessageGet`, `ConclusionGet`).
2. **Batch Message Creation:** Message creation via `POST /v3/workspaces/{workspace_id}/sessions/{session_id}/messages` requires the `MessageBatchCreate` schema: `{"messages": [{"content": string, "peer_id": string, ...}]}` (array of 1 to 100 messages). Honcho does not accept an unnested individual message object.
3. **Representation Endpoint is a Retrieval (Query), Not a Calculation:** `POST /v3/workspaces/{workspace_id}/peers/{peer_id}/representation` ("Get Representation") retrieves a curated, scoped subset of an existing Peer's Representation. It is a read/query operation, not a vector re-embedding or dreaming process.
4. **Dialectic Scope Mutual Exclusivity:** In `DialecticOptions`, `scope` is **mutually exclusive** with `session_id` and `filters`. Specifying both returns an HTTP 422 validation error.
5. **Runtime SSE Streaming Verified:** Tested live on `http://192.168.4.91:8000/v3/workspaces/test-hermes-workspace/peers/alex/chat`. The server emits progressive JSON frames (`data: {"delta": {"content": "..."}, "done": false}\n\n`) followed by a final completion frame (`data: {"done": true, "evidence": {...}}`).

---

## 2. Detailed Endpoint Mapping by UI Area

### Area A: Workspace & Session Management
| UI Component | Action | HTTP Method | Honcho Endpoint | Query Params | Request Body |
|---|---|---|---|---|---|
| Workspace Selector | List workspaces | `POST` | `/v3/workspaces/list` | `?page=1&size=50&reverse=false` | Optional `WorkspaceGet` (`{}`) |
| Workspace Modal | Create workspace | `POST` | `/v3/workspaces` | — | `WorkspaceCreate` (`{ id: string, metadata?: obj, configuration?: obj }`) |
| Workspace Stats | Queue status | `GET` | `/v3/workspaces/{workspace_id}/queue/status` | — | — |
| Session Directory | List sessions | `POST` | `/v3/workspaces/{workspace_id}/sessions/list` | `?page=1&size=50&reverse=false` | Optional `SessionGet` (`{}`) |
| Session Modal | Create session | `POST` | `/v3/workspaces/{workspace_id}/sessions` | — | `SessionCreate` (`{ id: string, metadata?: obj, configuration?: obj }`) |
| Session Context | Get context | `GET` | `/v3/workspaces/{workspace_id}/sessions/{session_id}/context` | — | — |
| Session Summaries | Get summaries | `GET` | `/v3/workspaces/{workspace_id}/sessions/{session_id}/summaries` | — | — |

---

### Area B: Peer Profile & Peer Card
| UI Component | Action | HTTP Method | Honcho Endpoint | Query Params | Request Body |
|---|---|---|---|---|---|
| Peer Switcher | List peers | `POST` | `/v3/workspaces/{workspace_id}/peers/list` | `?page=1&size=50&reverse=false` | Optional `PeerGet` (`{}`) |
| Peer Card Tab | Fetch card | `GET` | `/v3/workspaces/{workspace_id}/peers/{peer_id}/card` | — | Response: `PeerCardResponse { peer_card: string[] \| null }` |
| Peer Context | Fetch context | `GET` | `/v3/workspaces/{workspace_id}/peers/{peer_id}/context` | — | Returns full representation context |
| Representation | Query subset | `POST` | `/v3/workspaces/{workspace_id}/peers/{peer_id}/representation` | — | `PeerRepresentationGet` (`{ session_id?: string, target?: string, scope?: string }`) |
| Autonomous Dream | Schedule dream | `POST` | `/v3/workspaces/{workspace_id}/schedule_dream` | — | `ScheduleDreamRequest` |

*Note on Peer Card:*  
If `peer_card` is `null`, Honcho has not yet synthesized high-level traits during dreaming cycles. The UI displays an empty/learning state indicating that cognitive cards are distilled asynchronously through dreaming.

---

### Area C: Message Timeline & Composer
| UI Component | Action | HTTP Method | Honcho Endpoint | Query Params | Request Body |
|---|---|---|---|---|---|
| Message Feed | List messages | `POST` | `/v3/workspaces/{workspace_id}/sessions/{session_id}/messages/list` | `?page=1&size=50&reverse=false` | Optional `MessageGet` (`{}`) |
| Message Composer | Send batch message | `POST` | `/v3/workspaces/{workspace_id}/sessions/{session_id}/messages` | — | `MessageBatchCreate` (`{ messages: [{ content: string, peer_id: string, metadata?: obj }] }`) |
| Message Upload | Upload file | `POST` | `/v3/workspaces/{workspace_id}/sessions/{session_id}/messages/upload` | — | Multipart file upload |

*Batch Creation Payload Example:*
```json
{
  "messages": [
    {
      "content": "Definire i vincoli di stile per la dashboard.",
      "peer_id": "alex",
      "metadata": { "client": "honcho-cognition-studio" }
    }
  ]
}
```

---

### Area D: Conclusions Table & Semantic Search
| UI Component | Action | HTTP Method | Honcho Endpoint | Query Params | Request Body |
|---|---|---|---|---|---|
| Conclusions Table | Paginated list | `POST` | `/v3/workspaces/{workspace_id}/conclusions/list` | `?page=1&size=50&reverse=false` | Optional `ConclusionGet` (`{}`) |
| Semantic Search | Vector search | `POST` | `/v3/workspaces/{workspace_id}/conclusions/query` | — | `ConclusionQuery` |
| Conclusion Detail | Inspect deriver | `GET` | `/v3/workspaces/{workspace_id}/conclusions/{conclusion_id}` | — | Single conclusion document |

*Cognitive Levels Supported:*
1. `explicit`: Direct extraction from messages (`source_ids` is empty).
2. `deductive`: Premises-based deduction derived during dreaming.
3. `inductive`: Pattern-based generalization from multiple observations.
4. `contradiction`: Incompatibilities identified during dreaming across sessions.

*Semantic Query Payload (`ConclusionQuery`):*
```json
{
  "query": "preferenze UI",
  "top_k": 10,
  "distance": 0.75,
  "filters": null
}
```
*Distance Note:* Cosine distance ranges from $0.0$ (identical vector) to $1.0$ (orthogonal).

---

### Area E: Dialectic Chat Playground
| UI Component | Action | HTTP Method | Honcho Endpoint | Request Body |
|---|---|---|---|---|
| Dialectic Prompt | Peer-anchored chat | `POST` | `/v3/workspaces/{workspace_id}/peers/{peer_id}/chat` | `DialecticOptions` |
| Workspace Prompt | Unanchored chat | `POST` | `/v3/workspaces/{workspace_id}/chat` | `WorkspaceChatOptions` |

*Request Payload (`DialecticOptions`):*
```json
{
  "query": "Quali sono i vincoli principali espressi da Alex?",
  "stream": true,
  "reasoning_level": "low",
  "include_evidence": true,
  "session_id": "session-01",
  "target": null,
  "scope": null,
  "filters": null
}
```

#### Mutual Exclusivity Constraint
- `scope` is **mutually exclusive** with `session_id` and `filters`.
- In the UI: Selecting a `scope` disables the `session_id` selector. Selecting a `session_id` clears and disables `scope`.

#### Empirically Tested Runtime SSE Output
Live execution verified on `http://192.168.4.91:8000/v3/workspaces/test-hermes-workspace/peers/alex/chat` with `stream: true` and `include_evidence: true`:
```
data: {"delta": {"content": "Test received. Memory retrieval is working properly. \n\nAccording to your profile, you"}, "done": false}

data: {"delta": {"content": " are Alex, specializing in developing custom applications for umbrelOS, and you strongly prefer multi-agent architectures. Let me know what"}, "done": false}

data: {"delta": {"content": " you'd like to look up or work on!"}, "done": false}

data: {"done": true, "evidence": {"conclusions": [], "messages": [{"id": "gqAJaog1Mno1nhRkUa_zv", "session_id": "session-01", "peer_id": "alex", "created_at": "2026-10-05T10:29:35.716645Z"}], "tool_calls": [{"tool_name": "search_memory", "tool_input": {"query": "test query"}}, {"tool_name": "grep_messages", "tool_input": {"text": "a"}}], "reasoning_trace_id": null}}
```
*Engineering Note for Developer:*
While the live server demonstrates this frame structure, the frontend SSE client must be built resiliently: handle arbitrary chunk boundaries, keep-alives, network disconnects, and potential fallback to non-streaming buffered mode if SSE connection fails.

---

## 3. Verified Assumptions & Guardrails for Developer Hand-off

1. **Pagination Parameters are in Query String:** For all `POST /v3/.../list` endpoints, pass `?page=N&size=M&reverse=false` in the URL query string. The POST request body carries optional filtering criteria.
2. **Messages are Batched:** Never attempt `POST /messages` with a flat message object. Always wrap in `{"messages": [...]}`.
3. **Peer Cards can be null:** Unlike typical static profiles, Honcho's peer cards are generated asynchronously via the dreaming engine. The UI must cleanly handle `peer_card: null` with an informative empty state.
4. **Evidence over-reports by design:** The Honcho specification explicitly states that evidence collates what the agent *accessed* (auditing trace), not just what was cited in prose.
5. **Distance Threshold in Semantic Search:** Lower distance in Honcho's cosine distance metric implies higher semantic similarity ($0.0$ is identical, $1.0$ is orthogonal).
