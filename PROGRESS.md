# Progress

## Current Phase

Phase 3 in progress. Started 2026-05-31.

## Current State

Phase 3 Browser Core Stabilization & UI Readiness is active. Seven of the eight Phase 3 gaps are closed. 124 unit tests passing. One gap remains: Gap 8 (measurement — run benchmark, record real RAM/CPU numbers in docs). After Gap 8, the SSE event stream endpoint is next.

## Phase 3 Progress

### Closed

**Step 1 — API contract cleanup** (commit e2bd145, 2026-05-31)
- `ISession` interface added to `sessions/types.ts` covering all fields and methods consumed by command handlers and `DebugBundle`.
- `FeatherSession implements ISession`.
- `ISessionManager` interface added to `sessions/manager.ts`; `SessionManager implements ISessionManager`.
- `registerRoutes()` now accepts `ISessionManager`; the four `manager as any` casts for Navigate/Snapshot/Extract/Screenshot handlers are removed.
- `DebugBundle` now accepts `ISession` rather than the concrete `FeatherSession`; debug layer no longer imports the session implementation directly.
- `DebugBundleHandler` uses the shared `ISession` import; `session as any` cast removed.

**Step 2 — Complete lifecycle event logging** (commit e2bd145, 2026-05-31)
- `SESSION_LAUNCH_REQUESTED` emitted after `FeatherSession` is constructed and all preconditions (dirs, lock, workspace) are met, immediately before `launchPersistentContext`.
- `SESSION_CLOSE_REQUESTED` emitted at the start of `close()` after state transitions to `"closing"`.
- `SESSION_CLOSE_COMPLETED` emitted after the context closes and state transitions to `"closed"`.
- `SESSION_CLOSE_FAILED` emitted in the error path with the error message.

**Hybrid Browser vision + Cookie Mine pathway** (commits e0ef2e6–93b8a5c, 2026-06-01)
- ADR-0003 written: documents architectural shift from strict session isolation to shared persistent context (Cookie Mine model). See `docs/specs/adr-0003-hybrid-browser-shared-context.md`.
- ROADMAP.md updated: Destination rewritten as Hybrid Browser; Phase 4 now explicit prerequisite for Phase 5+ agents; Cookie Mine and MCP-compatible hub milestones added.
- AGENTS.md updated: long-term vision and Technical Vision bullet reflect Hybrid Browser and Cookie Mine.
- `TAB_OPENED: "tab.opened"` added to `EVENTS` catalog.
- `SessionNotRunningError` (code `SESSION_NOT_RUNNING`, HTTP 409) added to `session.ts`.
- `FeatherSession.openTab()`: creates a new page via `context.newPage()`, registers it in the page map, returns `{ pageId, page }`.
- `ISession` and `ISessionManager` interfaces updated with `openTab` signatures.
- `SessionManager.openTab(sessionId)`: validates state, delegates to session, logs `TAB_OPENED`, returns `PageInfo`.
- `OpenTabHandler` added in `src/commands/open-tab.ts` following the thin-delegation command pattern.
- `POST /v1/sessions/:sessionId/tabs` route registered with token auth.
- 11 new unit tests covering all new behaviour. Full suite: 112 passing.

**Gaps 3, 4, 5 — Dynamic page tracking + tab lifecycle events** (2026-06-02)
- `toRecord()` return type fixed to `Omit<SessionRecord, "pages">` — matches `ISession` contract.
- `FeatherSession.addPage()` / `removePage()` added; manager wires `context.on("page")` listener in `launch()`.
- `TAB_CREATED` and `TAB_CLOSED` events emitted via JSONL logger (Option C: logger-only, no event bus yet).
- `TAB_UPDATED` deferred to SSE design step.
- 124 unit tests passing.

**Gap 6 — PageInfo loadState** (2026-06-02)
- `loadState: string` added to `PageInfo` interface in `src/sessions/types.ts`.
- Populated via `page.evaluate(() => document.readyState)` in `getPageInfoList()` and `SessionManager.openTab()`.
- Note: Playwright has no `page.loadState()` getter — `document.readyState` is the correct API; returns `'loading' | 'interactive' | 'complete'`.

**Gap 7 — ProfileLock stale pid** (2026-06-02)
- In `src/profiles/lock.ts`, before throwing `PROFILE_LOCKED`, reads existing lock pid and calls `process.kill(pid, 0)`.
- `ESRCH` (no such process) → stale lock, unlink and proceed with new lock.
- `EPERM` (process exists, no permission) → process is alive, throw `PROFILE_LOCKED` as normal.

**Gap 8 — Browser mode measurement** (2026-06-02)
- Ran full scenario against both modes; recorded in `docs/phase-2-completion.md`.
- `chromium-headless-shell`: 764 ms total, 1.7 MB profile, 194 MB peak Node RSS.
- `chromium-new-headless`: 986 ms total, 4.1 MB profile, 196 MB peak Node RSS.
- Launch is the only meaningfully different step (+211 ms). All other timings are equivalent.

**SSE event stream — `GET /v1/events`** (2026-06-02)
- `src/logs/bus.ts`: module-level EventEmitter, `emitBusEvent()` / `onBusEvent()` (returns unsubscribe fn), `setMaxListeners(100)`.
- `src/logs/logger.ts`: fires `emitBusEvent` for all log events (before sessionId guard), so SERVICE_STARTED and sessionless events reach the bus too.
- `src/transport/sse.ts`: `registerSsePlugin()` registers `fastify-sse-v2`; `registerSseRoute()` registers `GET /v1/events` behind token auth; async-generator queue pattern; AbortController cleanup on socket close; 9 lifecycle events forwarded (session.launch.*, session.close.*, tab.*); per-command events filtered out.
- `src/transport/http.ts`: `registerSsePlugin(app)` called before `registerRoutes`.
- `src/transport/routes.ts`: `registerSseRoute(app, tokenAuth)` wired at bottom of `registerRoutes`.
- `npm install fastify-sse-v2` added to dependencies.
- 5 unit tests (bus.test.ts) + 5 integration tests (sse.integration.test.ts): 129 unit + 32 integration passing.

### All Phase 3 milestones complete

## Architecture Decisions

- Playwright-managed Chromium is the Phase 2 foundation. New headless Chromium is the default high-fidelity mode; Chromium headless shell is an optional lower-resource mode.
- Chrome extensions are not the core product strategy. Critical capabilities are native or integrated project features behind clean internal interfaces.
- Localhost HTTP JSON is the Phase 2 transport, bound to `127.0.0.1` with token protection. Command handlers are transport-independent for later stdio JSON-RPC or Unix socket support.
- Raw CDP is an internal escape hatch for targeted gaps, not the public API surface.
- `yt-dlp` and similar tools are integrated behind adapter boundaries via subprocess control. Real execution is deferred to Phase 3.
- Tauri/WebView, CEF, Qt WebEngine, and a Chromium fork remain future or fallback options.
- Credential redaction (`redactProxy`/`redactUrl`) is applied at the log emission layer to prevent secrets from appearing in JSONL logs or API responses.
- ProfileLock uses file-based locking to enforce single-session-per-profile constraints.

## Open Questions

These were unresolved at Phase 2 close and should inform Phase 3 planning:

- What exact RAM/CPU difference does the resource measurement scenario show between new headless Chromium and Chromium headless shell?
- Which debug bundle fields prove most useful once real failures are captured in production-like runs?
- Should Phase 3 add the `yt-dlp` subprocess adapter first, or harden profile/proxy/session reliability first?

## Phase 3 Scope Decision

Phase 3 is scoped as Browser Core Stabilization & UI Readiness. The earlier candidates (yt-dlp adapter, GUI scaffolding) are deferred: yt-dlp to Phase 5+, GUI scaffolding to Phase 4. Phase 3 stays inside the existing headless core.

Concrete gaps identified in the Phase 2 codebase that Phase 3 must close:

1. Dynamic page tracking — `FeatherSession.setContext()` snapshots only pages existing at context creation. `context.on("page")` is not wired, so pages opened after launch are invisible. `DebugCapture` already does this correctly and is the pattern to follow.
2. Incomplete lifecycle logging — `SessionManager` only emits `SESSION_LAUNCH_COMPLETED`. All other catalogued events (`SESSION_LAUNCH_REQUESTED`, `SESSION_CLOSE_*`, tab events) are never emitted.
3. Tab lifecycle events missing — the `EVENTS` catalog has no tab/page events beyond per-command operation events. Tab created/closed/updated are absent.
4. `toRecord()` always returns `pages: []` — page list is fetched separately by handlers and merged in, but the method contract is misleading.
5. Four `manager as any` casts in `routes.ts` — known tech debt; needs a shared `ISessionManager` interface.
6. `PageInfo` lacks `loadState` — callers cannot distinguish a page mid-navigation from a settled tab.
7. ProfileLock does not check whether the locking pid is still alive — stale locks from crashed processes permanently block a workspace.
8. Open measurement question — actual RAM/CPU delta between browser modes is unrecorded.

## Next

All Phase 3 milestones are complete. Phase 3 exit criteria met. Next: decide whether to merge dev → master and start Phase 4 planning (Visual Desktop Shell Prototype).
