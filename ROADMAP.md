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

## Phases 0–3 — Complete

Full milestone/exit-criteria detail archived at `journal/ops/archive/roadmap-phases-0-3.md`.

- **Phase 0 — Workspace Setup** ✅ — project operating system (`/start`/`/stop`, tracking files, git).
- **Phase 1 — Headless Core Architecture Decision** ✅ — pivoted to headless-first; ADR-0002 (Playwright-managed Chromium headless core, Feather-owned control service) superseded the visible-shell ADR-0001.
- **Phase 2 — Headless Core Prototype** ✅ (2026-05-31) — smallest functional headless core; all 9 exit criteria met; 129 tests.
- **Phase 3 — Browser Core Stabilization & UI Readiness** ✅ (merged to `master` 2026-06-03) — clean API contract, full lifecycle events, dynamic tab tracking, stale-lock recovery, read-only SSE stream (`GET /v1/events`). Bridged to Phase 4 by the Stabilization & Linux-Readiness program (`docs/specs/2026-06-03-stabilization-linux-readiness-design.md`).

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
