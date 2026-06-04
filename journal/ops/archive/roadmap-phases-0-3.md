# Roadmap — Completed Phases 0–3 (Archived Detail)

Moved out of the hot `ROADMAP.md` on 2026-06-04 (token-diet). These phases are **complete**; their
full milestone/exit-criteria detail is retained here verbatim. `ROADMAP.md` keeps a one-line status
for each and the full detail for the active/future phases (4, 5+).

---

## Phase 0: Workspace Setup

Goal: Create the project operating system before product research or implementation.

Status: Complete.

Milestones:
- Directory structure exists.
- `/start` and `/stop` session commands are documented and available as local command files.
- Progress, phase, task, context, log, and session handoff files exist.
- Git tracking is initialized.

Exit criteria:
- A future session can resume from `/start`.
- A paused session can be handed off with `/stop`.
- Phase 1 can be planned from a clean tracking baseline.

## Phase 1: Headless Core Architecture Decision

Goal: Decide the technical foundation for a headless-first browser core.

Status: Complete.

Superseded decision:
- The previous Phase 1 decision selected a Playwright-managed persistent Chromium profile plus a custom local shell/control UI.
- That decision was useful research, but it optimized for a visible shell and extension compatibility.
- The project direction is now headless-first, native/integrated-feature-first, and GUI-later.

Exit criteria:
- Fresh architecture decision record is written in `docs/specs/`.
- Fresh research findings are written in `research/`.
- Non-goals and constraints are explicit.
- Phase 2 can begin with Step 0: research and plan the headless core prototype.

Research candidates:
- Playwright-managed Chromium persistent profiles.
- Tauri/WebView approaches.
- CEF.
- Qt WebEngine.
- Chromium fork/distribution paths.
- Rust/C++ control-layer options.
- Native integration patterns for open-source tools such as `yt-dlp`.

## Phase 2: Headless Core Prototype

Goal: Build the smallest functional headless core that proves the chosen foundation.

Status: Complete. Completed 2026-05-31. All 9 exit criteria met. 129 tests passing.

Milestones:
- Step 0: research and plan Phase 2.
- Launch and control isolated headless browser sessions.
- Create a minimal profile/workspace configuration model.
- Provide a local CLI or API surface for launch, status, endpoint discovery, and control.
- Validate internal automation API shape for navigation, DOM inspection, extraction, and session control.
- Validate proxy/network configuration boundaries.
- Capture basic session metadata for debugging.

## Phase 3: Browser Core Stabilization & UI Readiness

Goal: Make the session and page lifecycle reliably observable. Produce a clean, stable API contract. Prepare a minimal event stream for a future UI. Keep agent concepts entirely out of the core.

Status: Complete. Completed 2026-06-02, merged to `master` 2026-06-03. All milestones met; 129 unit + 32 integration tests passing.

Bridged to Phase 4 by the Stabilization & Linux-Readiness program — see `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`.

Milestones:
- Step 0: research and plan Phase 3. ✓
- API contract cleanup: extract a shared `ISessionManager` interface; resolve the `manager as any` casts in the transport layer; fix `toRecord()` page ownership. ✓
- Complete lifecycle event logging: emit all catalogued events at the correct lifecycle points (launch requested/completed/failed, close requested/completed/failed). ✓
- Dynamic page/tab tracking: hook `context.on("page")` so pages opened after session launch are tracked in the page map. Emit tab lifecycle events (created, closed, updated).
- Enrich `PageInfo` with load state so callers can distinguish in-progress navigation from a settled page.
- Stale lock recovery: check whether a locking pid is still alive before blocking a workspace launch.
- Thin SSE event stream: a read-only `GET /v1/events` endpoint that emits browser lifecycle events for a future UI to consume. No WebSocket, no agent protocol.
- Measurement resolution: run the benchmark scenario and record actual RAM/CPU numbers for both browser modes in documentation.

Exit criteria:
- New pages opened after session launch are tracked and returned by status endpoints.
- All JSONL log events in the `EVENTS` catalog are emitted at the correct lifecycle points.
- A future UI can subscribe to browser lifecycle events without polling.
- The existing HTTP API is unchanged and all current tests continue to pass.
- TypeScript compiles clean with no `as any` casts in the transport layer.
- No agent runtime, LLM wrapper, or new top-level agent module has been introduced.

Deferred from earlier Phase 3 plan:
- Media download / yt-dlp integration → Phase 5+ (agent layer).
- RTL handling and toggles → Phase 4 (requires visible UI).
- Scraping reliability and session realism controls → Phase 5+ (requires measured data and agent context).
- Import/export settings → Phase 4 (requires visible UI).
