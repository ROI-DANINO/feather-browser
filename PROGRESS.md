# Progress

## Current Phase

Phase 2 complete. Phase 3 not yet started.

## Current State

Phase 2 Headless Core Prototype is complete as of 2026-05-31. All 9 exit criteria met. 129 tests passing (98 unit, 27 integration, 4 measurement). Ready to plan Phase 3.

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
