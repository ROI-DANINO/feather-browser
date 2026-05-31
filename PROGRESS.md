# Progress

## Current Phase

Phase 3 in progress. Started 2026-05-31.

## Current State

Phase 3 Browser Core Stabilization & UI Readiness is active. Two of the eight identified gaps are closed. 98 unit tests passing.

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

### Remaining gaps from Phase 3 scope decision

3. Tab lifecycle events missing — `EVENTS` catalog needs `TAB_CREATED`, `TAB_CLOSED`, `TAB_UPDATED`.
4. `toRecord()` always returns `pages: []` — misleading contract; page list is fetched separately by handlers.
5. Dynamic page tracking — `context.on("page")` not wired in `FeatherSession.setContext()`.
6. `PageInfo` lacks `loadState`.
7. ProfileLock does not check locking pid liveness — stale locks block workspaces permanently.
8. Open measurement question — actual RAM/CPU delta between browser modes is unrecorded.

### Pending design decision before Step 3

Step 3 (dynamic page tracking + tab lifecycle events) requires a decision on where the internal event bus lives:
- Option A: lightweight `EventEmitter` on `FeatherSession` — consumers hold a session reference.
- Option B: lightweight `EventEmitter` on `SessionManager` — one bus for all sessions, events tagged with `sessionId`.
- Option C: logger only for now — emit tab events to JSONL, wire the event bus in a later step when SSE is designed.

This decision shapes the SSE endpoint in the step after it. Not implementing Step 3 until it is settled.

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

Begin Phase 3. Recommended first task: wire `context.on("page")` in `FeatherSession.setContext()` and emit tab lifecycle events, as this is the root cause of the most downstream reliability issues.
