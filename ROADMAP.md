# Roadmap

## Destination

Build a Hybrid Browser: a hyper-lightweight Chromium-compatible daily driver with a Zen-inspired visual shell, and a "Cookie Mine" where human browsing builds a shared persistent trust context (cookies, session state) that local AI agents can piggyback on for background automation — routed through a local Fastify MCP-compatible hub — operating inside explicit user-authorized session state with human approval checkpoints.

The human browser (Phase 4) and the agent runtime (Phase 5+) are not sequential add-ons. They are architecturally coupled: the human session is the trust foundation that agents depend on. Phase 4 is a prerequisite for Phase 5+.

Feather should not depend on Chrome extensions as its product strategy. Critical capabilities should be native or integrated project features, using mature open-source tools where they reduce risk and cost.

## Roadmap Model

- Milestones are solid destination points.
- Phases are flexible placeholders until active.
- Every phase starts with Step 0: research and plan that phase.
- Only the current phase gets detailed tasks in `journal/ops/tasks.md`.
- Future phases stay high-level here until the prior phase is finished.

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

## Phase 4: Visual Desktop Shell Prototype

Goal: Wrap the stable Phase 3 core in a minimalist, Zen-inspired graphical browser shell. Consume the Phase 3 event stream. Establish the long-running primary persistent context that Phase 5+ agents depend on (Cookie Mine foundation). Keep agent UI panels absent.

Milestones:
- Step 0: research and plan Phase 4. Feather is **Linux-only (Fedora)**; **Electron is eliminated** (it bundles a second Chromium — anti-Feather). Candidate shells: Tauri/WebKitGTK or GTK4-native, both with Playwright-managed Chromium. Browser-surface architecture on Wayland is unresolved and must be prototyped. Runtime is host-primary with Flatpak as the eventual distribution sandbox (ADR-0004).
- Zen-inspired layout: vertical tab sidebar, collapsible panel, browser surface.
- Consume the Phase 3 SSE event stream to drive tab list and session state in the UI.
- Workspace/profile controls visible in the shell.
- Command palette or shortcut system.
- Theme and layout configuration.
- RTL handling and toggles.
- Import/export settings.
- The running shell process is itself the long-running primary context that Phase 5+ agents depend on; no discrete implementation task required in this phase (see ADR-0003).
- No agent panels, chat sidebar, or LLM controls in this phase.

## Phase 5+: Agent Runtime Layer & Daily Hardening

Goal: Add agent-oriented systems on top of the stable human browser shell. Implement the Cookie Mine model: agents open new pages (tabs) within the human's running session via the Fastify MCP-compatible hub, piggybacking on accumulated trust signals. Harden the result for daily use.

Planning notes (check before starting Phase 5+):
- Microsoft ships an official Playwright MCP server. Evaluate it before designing Feather's MCP hub — Feather may build on top of it rather than reimplement from scratch.
- The MCP spec is evolving rapidly (stateless HTTP core, Tasks extension RC expected mid-2026). Check current spec state before committing to the hub design to avoid rework.
- MCP spec is final 2026-07-28. Do not design the hub before then.

Milestones:
- Step 0: research and plan Phase 5+.
- Cookie Mine: tab open pathway in SessionManager — agents open new pages within the existing human session rather than launching isolated contexts (see ADR-0003).
- Local MCP-compatible hub routing: Fastify endpoint (`POST /v1/sessions/:id/tabs`) for agent tab requests against the live human session.
- Agent orchestration integration — leading candidate **Hermes**, with **OpenClaw** as a challenger if better suited; selection deferred to Phase 5 Step 0 (see ADR-0006). The agent-facing surface must also be drivable by external agent clients (**Claude Code, Codex**) via the MCP-compatible hub.
- Credentials vault and LLM API credential handling.
- Human approval checkpoint system.
- Agent chat sidebar.
- Context shrinker / token optimizer.
- Atomic agent action protocol.
- Scripted agent recipes.
- Headless screencast / viewport preview portal.
- User-to-agent tab handover.
- yt-dlp subprocess adapter for media downloads.
- Scraping reliability and session realism controls (measured, not assumed).
- Stability testing, performance budget, security review, and update strategy.
