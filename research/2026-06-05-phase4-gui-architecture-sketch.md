# Phase 4 GUI Architecture Sketch — Zen-Shell over the Phase-3 SSE Stream

**Status: COMPLETE** (design sketch; grounded in the live `GET /v1/events` route + emitted event types as of 2026-06-05)

**Date:** 2026-06-05
**Scope:** How the minimalist Zen-inspired shell (vertical tab sidebar, collapsible panel, browser surface) consumes the Phase-3 read-only SSE stream to drive its UI — *and nothing more*. No agent panels, no chat, no LLM controls (Phase 4 constraint, ROADMAP.md L42).

This is a data-flow + boundary sketch, not an implementation plan. The display-stack / toolkit is explicitly **not** decided here (ADR-0007: stack is active R&D); the Wayland browser-surface question is referenced, not solved.

---

## 0. Grounding — what the core actually emits today

All claims below trace to real code, not priors:

- **SSE route:** `src/transport/sse.ts` — `GET /v1/events`, registered with `app.get("/v1/events", { preHandler: [tokenAuth] }, ...)`. Auth is the same `X-Feather-Token` middleware as the REST API. Uses `fastify-sse-v2` via `reply.sse(sseSource(ac.signal))`. On socket close it `ac.abort()`s and unsubscribes from the bus.
- **Event bus:** `src/logs/bus.ts` — a single module-level `EventEmitter` on channel `"bus"`. `FeatherLogger.log` (`src/logs/logger.ts:21`) calls `emitBusEvent(...)` alongside every JSONL write, so the SSE stream is a live mirror of the lifecycle log.
- **Event catalog:** `src/logs/events.ts` — the `EVENTS` map. Of the 21 constants, the SSE route's `LIFECYCLE_EVENTS` allow-list (`src/transport/sse.ts:7-18`) forwards exactly **10** to clients; the rest (`page.navigate.*`, `page.snapshot.*`, `profile.lock.*`, `debug.*`, `service.started`) are filtered out at the source.
- **Initial-state REST:** `GET /v1/sessions` returns `SessionRecord[]`; `GET /v1/sessions/:id` returns one `SessionRecord` (`docs/api-reference.md`). `SessionRecord` (`src/sessions/types.ts:27`) carries `sessionId, workspaceId, profileKind, browserMode, state, profilePath, debugDir, proxy, startedAt, pages[], profileLocked`. `PageInfo` = `{ pageId, url, title, loadState }`.

### The 10 events the shell can actually see

| SSE `event:` name | `EVENTS` constant | Emitted from | `data` payload (inside the SSE envelope, see §1) |
|---|---|---|---|
| `session.launch.requested` | `SESSION_LAUNCH_REQUESTED` | `manager.launch` | `{}` (sessionId at envelope top-level) |
| `session.launch.completed` | `SESSION_LAUNCH_COMPLETED` | `manager.ts:187` | `{ workspaceId, profileKind, browserMode, proxy }` |
| `session.launch.failed` | `SESSION_LAUNCH_FAILED` | `manager.launch` (catch) | `{ error }` |
| `session.close.requested` | `SESSION_CLOSE_REQUESTED` | `manager.close` | `{}` |
| `session.close.completed` | `SESSION_CLOSE_COMPLETED` | `manager.close` | `{}` |
| `session.close.failed` | `SESSION_CLOSE_FAILED` | `manager.close` (catch) | `{ error }` |
| `tab.opened` | `TAB_OPENED` | `manager.ts:216` (explicit `openTab`) | `{ pageId }` |
| `tab.created` | `TAB_CREATED` | `manager.ts:137` (`context.on("page")`) | `{ pageId }` |
| `tab.updated` | `TAB_UPDATED` | `manager.ts:175` (`framenavigated`, main frame) | `{ pageId, url, title, loadState }` |
| `tab.closed` | `TAB_CLOSED` | `manager.ts:146` (`page.on("close")`) | `{ pageId }` |

`url` in `tab.updated` is run through `redactUrl()` (strips userinfo) — the shell receives sanitized URLs, which is what you want to render anyway.

---

## 1. The wire format (so the shell parses it right)

`sseSource` (`src/transport/sse.ts:38-47`) builds each SSE frame as:

```
id: <monotonic counter, process-scoped>
event: tab.updated
data: { "sessionId": "ses_…", "ts": "2026-06-05T…", "data": { "pageId":"page_…","url":"…","title":"…","loadState":"complete" } }
```

Two things the shell client must handle:

1. **`sessionId` and `ts` are hoisted to the top of the `data:` JSON**; the event's *own* payload is **nested one level deeper under a `data` key** (only present when the emitter supplied one). So a `tab.updated` page URL is at `frame.data.data.url`, while its session is at `frame.data.sessionId`. This double-nesting is a real shape in the current code — the shell's parser keys off `event:` (the SSE field) and then reads `payload.sessionId` + `payload.data?.*`.
2. **IDs are a per-process monotonic counter that resets on server restart** and there is **no server-side replay** (research/2026-06-02-sse-event-stream-spec.md §3). `retry: 3000` is advertised. Reconnect semantics are covered in §4.

---

## 2. Data flow — SSE → UI state model → chrome

```
                         ┌─────────────────────────────────────────────┐
  core (Phase 3)         │             Zen-shell (thin client)         │
  ───────────────        │             ─────────────────────          │
  GET /v1/sessions  ─────┼──▶  (1) hydrate ──▶  ShellState  ──▶  render │
   (REST, once)          │                     ├ sessions{}            │
                         │                     │   └ pages{}           │
  GET /v1/events    ─────┼──▶  (2) apply ─────▶├ activeSessionId       │
   (SSE, live deltas)    │      delta           ├ activePageId         │
                         │                      └ connection: online?  │
                         │                              │               │
                         │   ┌──────────────────────────┼─────────┐    │
                         │   ▼            ▼              ▼         ▼    │
                         │ vertical    session/      workspace  browser│
                         │ tab side-   status        controls   surface│
                         │ bar         badge         (read-only)(below)│
                         └─────────────────────────────────────────────┘
```

`ShellState` is a plain in-memory model (one normalized map of sessions, each holding a map of pages). SSE events mutate it; the view re-renders off it. No database, no second source of truth — the shell is a projection of the core's state.

### 2a. Which event drives which UI element

**Vertical tab sidebar (the tab list — the centerpiece):**

| UI action | Driven by |
|---|---|
| Add a tab row | `tab.created` *or* `tab.opened` → upsert `pages[pageId]` (placeholder url/title `about:blank` / "") |
| Fill in a tab's title + URL (live) | `tab.updated` → set `pages[pageId].url/title/loadState`. **This is the only event carrying a title/URL** — rows appear blank until the first `tab.updated`. |
| Show a per-tab loading spinner | `tab.updated.loadState` (`"loading"` vs `"complete"`/`document.readyState`) |
| Remove a tab row | `tab.closed` → delete `pages[pageId]` |
| Group tabs under their session/workspace | every tab event's top-level `sessionId` → bucket into `sessions[sessionId].pages` |

**Session / workspace status (collapsible panel + sidebar header):**

| UI action | Driven by |
|---|---|
| Show "launching…" placeholder for a session | `session.launch.requested` (state ≈ `launching`) |
| Promote session to active/running; label it | `session.launch.completed` → set `workspaceId, profileKind, browserMode`, state `running` |
| Show an error toast / failed-session marker | `session.launch.failed` (`data.error`) |
| Show "closing…" then remove the session group | `session.close.requested` → `session.close.completed` |
| Surface a close error | `session.close.failed` (`data.error`) |

**Active tab / active session:**

- The event stream has **no "active tab" / "focus changed" event** (see §5 gap). The shell owns active-tab selection *locally* — clicking a sidebar row sets `activePageId`, and the browser surface targets that `pageId` via REST page actions. SSE only tells the shell which tabs *exist*, not which one the human is looking at.

**Workspace controls (Phase-4 milestone "workspace/profile controls visible"):**

- Read-side: `session.launch.completed.workspaceId` + `profileKind` label the workspace in the panel.
- Write-side is **not** SSE — it's REST: launch a workspace = `POST /v1/sessions { profile, workspaceId }`; close = `DELETE /v1/sessions/:id`. The resulting `session.launch.*` / `session.close.*` events then update the panel. The shell issues the command and *waits for the event* rather than optimistically mutating — the stream is the confirmation channel.

---

## 3. Shell ↔ core API boundary — keep the shell thin

**The shell holds no browsing engine.** Chromium is Playwright-managed by the core (`chromium.launchPersistentContext`, ADR-0002/0003); the shell renders *chrome* (tabs, sidebar, command palette) and positions the browser surface. It is a pure client of the **existing** local contract — it introduces **no parallel API**:

- **Read live state:** `GET /v1/events` (SSE) — the only push channel.
- **Read initial/explicit state:** `GET /v1/sessions`, `GET /v1/sessions/:id`.
- **Drive the browser:** the existing REST verbs — `POST /v1/sessions` (launch), `POST …/tabs` (open tab), `POST …/navigate`, `POST …/snapshot`, `DELETE /v1/sessions/:id` (close). Address bar → `navigate`; new-tab button → `…/tabs`; close-tab → `DELETE`/close.
- **Auth:** read the same token file (`.feather/run/control-token`) and endpoint descriptor (`.feather/run/endpoint.json`) the API already publishes; send `X-Feather-Token` on every request including the SSE connect. No new auth path.

**Lightweight lens:** the shell ships as a thin presentation layer. Its entire model is `ShellState` + an SSE parser + a small REST client. It reuses the Phase-3 contract verbatim; the only net-new code in the *core* that Phase 4 might justify is closing the event gaps in §5 — and even those are additive lifecycle events on the existing bus, not a new protocol.

---

## 4. State reconciliation — hydrate, then apply deltas

Because SSE has **no replay** and IDs reset on restart (§1), the shell cannot treat the stream as a complete event log. The reconciliation contract:

1. **Open the SSE connection first** and start buffering frames in memory (don't apply yet).
2. **Fetch `GET /v1/sessions`** → seed `ShellState` from the `SessionRecord[]` snapshot (sessions + their `pages[]`, which already carry `url/title/loadState`). This is the authoritative baseline.
3. **Apply buffered + subsequent SSE deltas** on top, keyed by `sessionId`/`pageId`. Upserts are idempotent, so a delta that overlaps the snapshot is harmless (snapshot-then-stream may double-count an event; last-write-wins on a normalized map absorbs it).
4. **On disconnect** (the `retry: 3000` reconnect, or a manual one): **re-run steps 1–3** — reconnect SSE, re-fetch `GET /v1/sessions`, rebuild from snapshot, resume deltas. A full re-hydrate is correct and cheap (local API, a handful of sessions) and is the only safe move given no `Last-Event-ID` replay. **Do not** trust `Last-Event-ID`; the server ignores it and counters reset on core restart.
5. **Connection indicator:** `ShellState.connection` flips to `offline` on socket error and back to `online` after a successful re-hydrate. This is a UI affordance only; it does not touch the browser engine (the core keeps running independently of the shell).

The research spec already names the fallback for richer replay if ever needed: the on-disk JSONL log is the source of truth and can be tailed by ID range (research/2026-06-02-sse-event-stream-spec.md §3) — out of scope for Phase 4.

---

## 5. Gaps in the current event stream the GUI will hit

Grounded findings — what a real tab-driving UI needs that the 10 events don't yet provide:

1. **No "active tab / focus" event.** The stream reports tab *existence* (`created`/`opened`/`closed`) and *content* (`updated`), but never which tab is foreground. Acceptable for Phase 4 (shell owns active selection locally), but if the core ever drives focus (e.g. an agent tab steals foreground in Phase 5), the sidebar can't reflect it. *Mitigation now: shell-local active state.*
2. **`tab.created` / `tab.opened` carry only `pageId`** — no `url`/`title`. New sidebar rows render blank until the first `tab.updated` (`framenavigated` on the main frame) fires. For an `about:blank` tab that never navigates, the row stays title-less. *Mitigation: render `pageId`/"New Tab" placeholder; or enrich these two events with the initial `url/title` (cheap, additive).*
3. **No session *state-transition* event for `running`/`failed` beyond launch/close.** `SessionRecord.state` has `launching|running|closing|closed|failed`, but mid-life transitions (e.g. a session that fails *after* launch) aren't broadcast — the shell only learns via re-hydrate. *Mitigation: a `session.state.changed` event, additive.*
4. **`tab.updated` is best-effort and main-frame-only** (`manager.ts:151-178`): SPA in-place route changes that don't fire `framenavigated` won't update the title/URL, and a superseded navigation is dropped (`manager.ts:159`). The sidebar can show a slightly stale title for SPAs. *Acceptable for a prototype; note it.*
5. **No heartbeat/keepalive event** beyond the initial flush. Long-idle SSE connections rely on `retry` + TCP; the shell's `offline` detection leans on socket errors. *Mitigation: periodic comment-ping if idle-disconnect proves flaky on the target.*

None of these block the Phase-4 prototype; #2 is the most visible (blank new-tab rows) and the cheapest to close.

---

## 6. Where the browser surface sits — referenced, not solved

The shell chrome (sidebar left, collapsible panel, command palette) frames a **browser surface** region. *How* Chromium's pixels land in that region is the **unresolved Wayland browser-surface question** and is explicitly out of scope here:

- ADR-0007 settled the *display model direction* (painted-in, one-window, headless-core screencast) and the *stopgap* (headed Chromium in a separate compositor-tiled window) — but **not** the rendering/transport/toolkit stack, which is active R&D.
- The forward-looking **ADR-0009** (referenced by the Phase-4 program as the home for the surface/stack decision) is **not yet written** in `docs/specs/`; this sketch defers the surface mechanics to it and does not pre-empt it.

For this document's purposes: the shell *positions* a surface rectangle and targets it by `pageId` over REST; whether that rectangle is a real embedded window (stopgap) or a painted screencast (end-state) is the surface decision, not the data-flow decision. The SSE→sidebar wiring above is identical under either model.

---

## 7. Phase-4 constraint check — agent UI absent

No element in this sketch surfaces agents, chat, or LLM controls. The same `POST …/tabs` endpoint that the shell's "new tab" button calls is *also* the Cookie-Mine agent entry point (docs/api-reference.md), but in Phase 4 it is driven **only** by human action through the shell. Agent-driven tabs and any agent panel are Phase 5+ and deliberately not rendered. The running shell process is itself the long-running primary context (ADR-0003) — a consequence of existing, not a UI feature to build.

---

## Summary

- **Event → UI map:** `tab.created`/`tab.opened` add a sidebar row (pageId only); `tab.updated` fills its title/URL/spinner (the *only* event with content); `tab.closed` removes it; `session.launch.*`/`session.close.*` drive the workspace/session panel + status. Every tab event's top-level `sessionId` buckets tabs under their workspace.
- **Thin boundary:** the shell holds no engine — it reads the live `GET /v1/events` SSE stream + `GET /v1/sessions` snapshot, and drives the browser through the *existing* REST verbs (launch/tabs/navigate/close) with the same `X-Feather-Token`. No parallel API; `ShellState` is a pure projection of the core.
- **Reconciliation:** open SSE → hydrate from `GET /v1/sessions` → apply idempotent deltas; on disconnect, full re-hydrate (no `Last-Event-ID` replay; IDs reset on restart).
- **Top gap:** `tab.created`/`tab.opened` carry only `pageId` (no url/title), so new sidebar rows render blank until the first `tab.updated` — cheap to close by enriching those two events. Secondary gaps: no active-tab/focus event (shell owns it locally) and no mid-life session-state event.
- **Wayland surface + stack:** referenced (ADR-0007 direction; ADR-0009 unwritten), not solved here. Agent UI absent per Phase-4 constraint.
