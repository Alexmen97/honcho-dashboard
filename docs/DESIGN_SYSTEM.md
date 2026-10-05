# Honcho Cognition Studio — Design System & UI Specification
**Product:** Web Dashboard for Alex / Honcho v3.2.2  
**Target Server:** `http://192.168.4.91:8000`  
**Role:** UI/UX Design Proposal & Component Tokens  
**Revision:** v1.1 (Updated with offline assets, batch messaging, mutual scope exclusivity, and measured contrast ratios)  
**Artifact Directory:** `/opt/data/projects/honcho-dashboard/`

---

## 1. Design Vision & Guiding Principles

The dashboard for Alex is conceived as **Honcho Cognition Studio**: a minimalist, high-density, ultra-responsive cognitive operations console. It draws inspiration from the design systems of **Linear** (fluid key commands, precision borders, high information density), **Vercel** (monochrome clarity, crisp micro-interactions, subtle glass layers), and **Stripe** (transparent feedback, impeccable typography, and accessible status tokens).

### Core Tenets:
1. **Cognitive Clarity over Visual Noise:** Honcho is a social cognition and identity layer for AI agents. The UI cleanly differentiates raw messages, derived conclusions, peer traits, and dialectic reasoning traces without visual clutter.
2. **Deterministic Feedback:** Honcho's dreaming and dialectic processes involve multi-step reasoning. The UI provides transparent loading skeletons, streaming progress, and evidence audit trails.
3. **Targeted Accessibility:** Evaluated color contrast ratios, visible keyboard focus rings, semantic HTML elements, and screen-reader labels.
4. **Offline & Self-Contained:** Zero external network dependencies. Scripts and styles are local (`./tailwind.js` bundled locally in `/opt/data/projects/honcho-dashboard/mockup/`).
5. **Clear Demo Demarcation:** All displayed metrics, peer cards, and frontend actions are explicitly flagged as simulated demo data until production API wiring is implemented.

---

## 2. Color System & Measured Contrast Ratios

### 2.1 Base Surfaces & Neutrals
Designed for a dark-first aesthetic with high legibility and low eye strain in long operational sessions.

| Token | CSS / Hex Value | Role & Usage |
|---|---|---|
| `bg-canvas` | `#090d16` (Deep Obsidian) | Full viewport canvas background |
| `bg-surface-subtle` | `#0f172a` (Slate 900) | Sidebar, top header, panel backdrops |
| `bg-surface-elevated`| `#1e293b` (Slate 800) | Cards, active tab pills, popover menus, modals |
| `bg-surface-hover` | `#334155` (Slate 700) | Interactive hover state for items, rows, buttons |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Hairline dividers, card outlines |
| `border-active` | `rgba(99, 102, 241, 0.4)` | Focused inputs, active cards, highlighted evidence |
| `text-primary` | `#f8fafc` (Slate 50) | Main headings, message text, primary values |
| `text-secondary` | `#94a3b8` (Slate 400) | Subtitles, labels, metadata, inactive items |
| `text-tertiary` | `#7e8d9f` (Slate 450) | Timestamps, token counts, empty state hints |

### 2.2 Mathematical Contrast Verification (WCAG Standard)
Calculated via relative luminance formula $(L_1 + 0.05) / (L_2 + 0.05)$:

| Text Element | Color Hex | Background | Measured Contrast Ratio | WCAG 2.1 Threshold |
|---|---|---|---|---|
| Primary Text | `#f8fafc` | `#090d16` (Canvas) | **18.57:1** | Pass AAA (Req: 7.0:1) |
| Primary Text | `#f8fafc` | `#0f172a` (Surface) | **17.06:1** | Pass AAA (Req: 7.0:1) |
| Primary Text | `#f8fafc` | `#1e293b` (Elevated) | **13.98:1** | Pass AAA (Req: 7.0:1) |
| Secondary Text | `#94a3b8` | `#090d16` (Canvas) | **7.58:1** | Pass AAA (Req: 7.0:1) |
| Secondary Text | `#94a3b8` | `#0f172a` (Surface) | **6.96:1** | Pass AA (Req: 4.5:1) |
| Secondary Text | `#94a3b8` | `#1e293b` (Elevated) | **5.71:1** | Pass AA (Req: 4.5:1) |
| Tertiary Text | `#7e8d9f` | `#090d16` (Canvas) | **5.74:1** | Pass AA (Req: 4.5:1) |
| Explicit Badge | `#34d399` | `#090d16` (Canvas) | **10.11:1** | Pass AAA (Req: 7.0:1) |
| Deductive Badge | `#818cf8` | `#090d16` (Canvas) | **6.51:1** | Pass AA (Req: 4.5:1) |
| Inductive Badge | `#fbbf24` | `#090d16` (Canvas) | **11.64:1** | Pass AAA (Req: 7.0:1) |
| Contradiction Badge | `#fb7185` | `#090d16` (Canvas) | **7.22:1** | Pass AAA (Req: 7.0:1) |

*Note:* These represent measured mathematical contrast values under standard sRGB color space, not third-party formal audit certifications.

---

## 3. Cognitive Taxonomy & Level Tokens
Honcho's conclusion deriver categorizes knowledge into 4 distinct reasoning tiers. We assign dedicated semantic color tokens to each level:

| Level | Token / Accent | Badge Classes | Semantic Definition |
|---|---|---|---|
| `explicit` | **Emerald** (`#34d399`) | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` | Directly asserted facts extracted verbatim from messages. `source_ids` is empty. |
| `deductive` | **Indigo** (`#818cf8`) | `bg-indigo-500/10 text-indigo-400 border-indigo-500/20` | Deductions derived strictly from premises during dreaming. |
| `inductive` | **Amber** (`#fbbf24`) | `bg-amber-500/10 text-amber-400 border-amber-500/20` | Pattern-based hypotheses generalized from recurring observations. |
| `contradiction` | **Rose** (`#fb7185`) | `bg-rose-500/10 text-rose-400 border-rose-500/20` | Detected cognitive conflicts or diverging statements across sessions. |

---

## 4. Typography & Hierarchy

Font Stack: `Geist, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`  
Monospace Stack: `JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| Scale Role | Tailwind Class | Font Size / Weight | Line Height | Usage |
|---|---|---|---|---|
| Display / Brand | `text-lg font-semibold tracking-tight` | 18px / 600 | 24px | Header brand, workspace title |
| Section Title | `text-base font-medium` | 16px / 500 | 22px | Panel headers, card headings |
| Body Regular | `text-sm font-normal` | 14px / 400 | 20px | Message text, conclusion body, dialectic output |
| Metadata / Pill | `text-xs font-medium` | 12px / 500 | 16px | Badges, timestamps, reasoning level pills |
| Code / Hash / ID | `font-mono text-xs` | 12px / 400 | 16px | Peer IDs, session UUIDs, token counts, JSON |

---

## 5. Detailed Component Specifications

### 5.1 Workspace Selector Dropdown & Modal
- **Navbar Trigger:** Compact pill with workspace icon, current workspace name (`test-hermes-workspace`), and chevron.
- **Dropdown Menu:** Lists available workspaces. Paged via query parameter `?page=1&size=50` to `POST /v3/workspaces/list`.
- **CTA:** "+ New Workspace" opens a modal dialog requesting `id` and optional JSON `metadata` for `POST /v3/workspaces`.

### 5.2 Peer Profile & Cognitive Card (`/peers/{peer_id}/card`)
- **Peer Summary Header:** Avatar, peer ID (`alex`), workspace binding badge, creation timestamp.
- **Cognitive Card Box:**
  - When `peer_card` is populated: Rendered as high-impact bulleted insight cards with confidence chips.
  - When `peer_card` is `null`: Renders an educational empty card: *"Honcho is observing conversations with Alex. Cognitive cards are synthesized during autonomous dreaming cycles."*
- **Actions:**
  - `[Avvia Dreaming]` triggers `POST /v3/workspaces/{id}/schedule_dream`.
  - `[Recupera Representation]` queries `POST /v3/workspaces/{id}/peers/{id}/representation` (queries a curated subset, does not re-compute embeddings).

### 5.3 Message Timeline & Composer (`/sessions/{session_id}/messages`)
- **Timeline Feed:**
  - Sender grouping: User messages aligned right (subtle indigo tint), Alex messages aligned left (dark slate card with peer avatar).
  - Metadata row: `created_at` in relative time, token count pill (e.g. `42 tokens`), message ID hash button.
- **Composer:**
  - Bottom input bar with sender selector (`alex` / `assistant` / `system`), and "Invia Messaggio (Simulazione)".
  - Implementation Note: Submission payload wraps messages into `MessageBatchCreate` (`{"messages": [{"content": ..., "peer_id": ...}]}`).

### 5.4 Conclusions Table & Semantic Search (`/conclusions/query`)
- **Search Header:**
  - Semantic query input with search icon.
  - Cosine distance slider ($0.1 \rightarrow 1.0$) with default threshold $0.75$.
  - Filter chips for cognitive levels: `Tutti`, `explicit`, `deductive`, `inductive`, `contradiction`.
- **Data Table Layout:**
  - Columns: `Livello`, `Contenuto Conclusione`, `Observer -> Observed`, `Derivazioni`, `Data`.
  - Row click expands derivation drawer: reveals `source_ids` (premises) and parent derivations.

### 5.5 Dialectic Chat Playground (`/peers/{peer_id}/chat`)
- **Configuration Toolbar:**
  - Target Peer selector (`alex`).
  - **Scope vs Session Mutual Exclusivity:** A segmented switch allows selecting either `Session ID` (`session-01`) OR `Scope` (`workspace / scope_name`). Per Honcho API specification, selecting one disables and clears the other.
  - Reasoning Level segmented control: `minimal` | `low` | `medium` | `high` | `max`.
  - Streaming switch: `Streaming (SSE)` toggle.
  - Evidence switch: `Includi Evidenze` toggle.
- **Dialogue Canvas:**
  - Displays conversation with progressive token streaming animation.
- **Collapsible Evidence Drawer:**
  - Displays conclusions consulted, message references read, and tool invocations (`conclusions_search`, `grep_messages`).

### 5.6 Comprehensive State Patterns
- **Normal State:** Sample demo data simulating active Honcho models.
- **Empty State:** Illustrated empty cards with actionable guidance.
- **Loading State:** Shimmering skeleton loaders (`shimmer` CSS animation) for cards, tables, and message bubbles.
- **Error State:** High-visibility notification banner simulating API 500 error and retry handling.

---

## 6. Offline Deliverable & Zero External Dependencies

The interactive mockup is located at `/opt/data/projects/honcho-dashboard/mockup/index.html`.
- **Self-Contained Tailwind JS:** Bundled locally at `/opt/data/projects/honcho-dashboard/mockup/tailwind.js` (398 KB).
- **Zero External Network Calls:** No external CDN scripts, fonts, or assets are requested at runtime.
- **Verified Offline Execution:** Validated in headless browser environment with local `file://` scheme.
