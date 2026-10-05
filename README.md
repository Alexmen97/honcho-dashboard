# Honcho Dashboard — Cognitive Studio & Web Gateway

**Modern Dark-First Web Dashboard for Honcho v3.2.2 on umbrelOS**  
**Repository:** `https://github.com/Alexmen97/honcho-dashboard`  
**Target Server:** `http://192.168.4.91:8000` (OpenAPI 3.1.0 verified)  
**Root Directory:** `/opt/data/projects/honcho-dashboard`  
**Stack:** React 18, TypeScript 5, Vite, Offline-compiled Tailwind CSS, TanStack Query v5, Node same-origin gateway.

---

## 1. Architectural Architecture & Security

Honcho Cognition Studio is built as a hardened Single-Page Application (SPA) served through a dedicated, minimal same-origin Node.js gateway:

```
[Browser Client]
       │
  HTTP / SSE
       │
       ▼
[Node Gateway (server/index.mjs)] ── 127.0.0.1:3000 (Loopback Default)
  ├── Serves compiled SPA assets (dist/) with SPA fallback
  ├── Route Allowlist enforcement & traversal rejection
  ├── Server-side secret isolation (HONCHO_API_KEY never exposed to browser)
  └── Unbuffered streaming reverse-proxy for SSE dialectic chat
       │
       ▼ (Fixed upstream)
[Honcho v3.2.2 Backend] ── http://192.168.4.91:8000
```

### Security & Exposure Guardrails:
1. **Loopback Binding by Default:** Gateway binds strictly to `127.0.0.1:3000`. It is never exposed to public or LAN interfaces without explicit authorization and access control.
2. **Fixed Upstream Target:** The gateway proxies exclusively to the configured Honcho instance (`http://192.168.4.91:8000`). Arbitrary proxying is blocked.
3. **Strict Route Allowlist:** Only valid API endpoints defined in `docs/openapi-3.2.2.json` are permitted. All unapproved paths and traversal attempts (`..`, `//`, etc.) are rejected with HTTP 403.
4. **Server-Side Credential Isolation:** If `HONCHO_API_KEY` is set in the environment, it is injected server-side into upstream headers. No tokens or secrets are ever bundled into Vite frontend code or exposed to client logs.
5. **Zero External Runtime Dependencies:** Tailwind CSS is locally precompiled during build. No external CDNs, Google Fonts, or runtime remote scripts are queried.

---

## 2. Directory Structure

```
/opt/data/projects/honcho-dashboard/
├── package.json               # Scripts, dependencies and test configuration
├── tsconfig.json              # TypeScript strict configuration
├── vite.config.ts             # Vite build & Vitest test configuration
├── tailwind.config.js         # Design tokens (obsidian canvas, cognitive level colors)
├── postcss.config.js          # PostCSS offline build configuration
├── index.html                 # SPA HTML entrypoint
├── src/
│   ├── main.tsx               # React mount root
│   ├── App.tsx                # TanStack Query provider, workspace isolation, top layout
│   ├── index.css              # Custom scrollbars, shimmer animation, Tailwind directives
│   ├── api/
│   │   ├── client.ts          # Typed Honcho API client & resilient SSE parser
│   │   └── client.test.ts     # Client unit tests (SSE parsing, exclusivity, query params)
│   ├── types/
│   │   └── api.ts             # TypeScript definitions aligned with docs/openapi-3.2.2.json
│   ├── components/
│   │   ├── common/            # Badge, LoadingShimmer, ErrorBanner
│   │   ├── layout/            # Navbar, Sidebar (desktop), MobileNav (drawer & bottom tabs)
│   │   ├── modals/            # CreateWorkspaceModal, CreateSessionModal, CreatePeerModal
│   │   ├── overview/          # Real Queue status & entity counts (no fake telemetry)
│   │   ├── sessions/          # Sessions directory, summaries & MessageBatchCreate composer
│   │   ├── peers/             # Peer switcher, Peer Card (null-safe), Scoped Representation
│   │   ├── conclusions/       # Filtered directory, Derivations drawer & Semantic search
│   │   └── dialectic/         # Chat playground, Scope exclusivity, SSE stream, Evidence drawer
│   └── test/
│       └── setup.ts           # Vitest DOM & TextDecoder polyfills
├── server/
│   ├── index.mjs              # Secure Node same-origin reverse proxy & static asset server
│   ├── gateway.test.mjs       # Gateway allowlist, method validation and traversal tests
│   └── e2e.test.mjs           # Live E2E integration test against gateway and Honcho instance
├── dist/                      # Compiled production assets
├── docs/
│   ├── IMPLEMENTATION.md      # Approved specifications, tickets, and acceptance criteria
│   ├── KANBAN.md              # Board status (HCS-01..HCS-09)
│   ├── QA_PLAN.md             # Independent QA test plan
│   ├── DESIGN_SYSTEM.md       # Visual tokens, typography, measured contrast ratios
│   ├── api-schema-notes.md    # Honcho v3.2.2 endpoint notes and contracts
│   └── openapi-3.2.2.json     # Authoritative live OpenAPI snapshot
└── mockup/                    # Original visual mockup reference (preserved intact)
    ├── index.html
    ├── standalone.html
    └── tailwind.js
```

---

## 3. Environment Variables & Payload Sizing

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port for the gateway server |
| `HOST` | `127.0.0.1` | Host interface to bind (defaults to loopback for security) |
| `HONCHO_TARGET_URL` | `http://192.168.4.91:8000` | Upstream Honcho instance URL (validated for http/https and no userinfo) |
| `HONCHO_API_KEY` | `""` | Optional server-side API key injected into upstream requests |
| `MAX_BODY_SIZE` | `2097152` (2 MiB) | Maximum allowed payload size in bytes (protects gateway from memory exhaustion) |
| `ALLOWED_HOSTS` | `127.0.0.1,localhost,::1` | Permitted Host header names (anti-DNS rebinding) |
| `TRUSTED_ORIGINS` | Auto-derived from `ALLOWED_HOSTS:PORT` | Allowed exact Origin header values (anti-CSRF) |

### 3.1 Payload Sizing and Memory Protection (PERF-01)
- **Honcho API Capacity**: The Honcho OpenAPI 3.2.2 specification allows `MessageBatchCreate` batches containing up to 100 messages, each with content up to 25,000 characters.
  * For standard single-byte UTF-8 / ASCII text, 100 × 25,000 chars is ~2.5 MB JSON.
  * For multi-byte UTF-8 text (e.g. non-Latin scripts, emojis), a maximum theoretical batch can reach 5–10 MB.
- **Console Dashboard Sizing**: The interactive UI console is optimized for responsive message composition and typical ingestion batches (1–80 messages of 25,000 chars or 100 messages of ~20,000 chars), which comfortably fit within the default 2 MiB threshold.
- **Large Batch Ingestion**: In deployments requiring the full theoretical upper bound, configure `MAX_BODY_SIZE` (e.g. `MAX_BODY_SIZE=10485760` for 10 MiB).
- **Enforcement**: The gateway enforces this limit in two stages:
  1. Early rejection (`Content-Length` header check > `MAX_BODY_SIZE` returns `HTTP 413 Payload Too Large`).
  2. Stream chunk thresholding (incoming streaming chunks are counted; if cumulative bytes exceed `MAX_BODY_SIZE`, upstream request is aborted and `HTTP 413` with `Connection: close` is returned). Checked via unit tests against a controlled local stub (`server/body-limits.test.mjs`).

---

## 4. Build, Test and Run Instructions

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Run Test Suites
```bash
# Generate TypeScript types reproducibly from OpenAPI snapshot
npm run types:generate

# Run frontend unit & component tests (27 tests in 7 suites)
npm test

# Run gateway security & allowlist tests
npm run test:gateway

# Run full end-to-end integration test against live Honcho instance (9 tests)
npm run test:e2e
# Or: node --test server/e2e.test.mjs
```

### 4.3 Typecheck and Production Build
```bash
# Typecheck TypeScript codebase
npm run typecheck

# Build offline production assets into dist/
npm run build
```

### 4.4 Start Gateway Server
```bash
# Start server in production mode
npm start
# Server listens on http://127.0.0.1:3000
```

---

## 5. Acceptance Verification by Ticket

- **HCS-01 (Scaffold, Toolchain & Gateway):** Complete. Vite + React + TS toolchain, offline compiled Tailwind, Node gateway with route allowlist, secret isolation, loopback binding, health smoke test passing.
- **HCS-02 (Workspace Navigation & Real Overview):** Complete. Workspace selector with cross-workspace query cancellation (`qc.cancelQueries()`), workspace creation modal, real `/queue/status` rendering with work units, live API-derived counts. Zero container telemetry invented.
- **HCS-03 (Sessions & Batch Messages):** Complete. Session pagination via query parameters (`?page=1&size=20&reverse=true`), session creation with peer mapping, session summaries viewer, batch message composer (`MessageBatchCreate` schema: `{"messages": [{"content": ..., "peer_id": ...}]}`) with duplicate submission guard.
- **HCS-04 (Peer Profile & Cognitive Cards):** Complete. Dynamic peer switcher (no hardcoded "alex"), peer creation modal, peer card supporting `null` with educational dreaming state, scoped representation query with explicit query semantics.
- **HCS-05 (Conclusions & Semantic Query):** Complete. Full conclusions directory with cognitive level badges (explicit, deductive, inductive, contradiction), semantic vector query with distance slider (0.0 to 1.0) and top_k, detail derivation drawer displaying premise IDs (`source_ids`).
- **HCS-06 (Dialectic Playground & SSE):** Complete. Anchor peer and target peer configuration, mutual exclusivity between `scope` vs `session_id`/`filters`, reasoning level enum (`minimal`, `low`, `medium`, `high`, `max`), robust SSE stream parser with chunk boundary tolerance, `AbortController` cancellation, explicit retry on error, collapsible evidence drawer showing accessed conclusions, message citations (fetched on demand), and tool calls.
- **HCS-07 (Layout, Accessibility & Packaging):** Complete. Responsive layout (desktop sidebar + mobile drawer & bottom tabs), high contrast tokens (WCAG AAA/AA calculated), unit/integration/E2E test suite with 100% pass rate, offline production build.
- **HCS-08 (Independent QA):** Ready for handoff to `@qa-reviewer`.
