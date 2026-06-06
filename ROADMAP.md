# Roadmap

## Destination

Build a Hybrid Browser: a hyper-lightweight Chromium-compatible daily driver with a Zen-inspired visual shell, and a "Cookie Mine" where human browsing builds a shared persistent trust context (cookies, session state) that local AI agents can piggyback on for background automation — routed through a local Fastify MCP-compatible hub — operating inside explicit user-authorized session state with human approval checkpoints.

The human browser (Phase 4) and the agent runtime (Phase 5+) are not sequential add-ons. They are architecturally coupled: the human session is the trust foundation that agents depend on. Phase 4 is a prerequisite for Phase 5+.

Feather should not depend on Chrome extensions as its product strategy. Critical capabilities should be native or integrated project features, using mature open-source tools where they reduce risk and cost.

## Public Surface: Feather Core vs. Feather Shell

The roadmap is split so the adoptable part is legible on its own (see
`docs/public-positioning.md`).

**Feather Core** — the near-term open-source surface: the local browser runtime, sessions and
profiles, snapshots/extraction/screenshots, debug bundles, and the local API (future MCP tool
interface). This is what another developer can pick up and use today. **Lead with Core.**

**Feather Shell** — the larger, more platform-specific vision: the Zen-inspired visual browser
shell, the long-running human browsing context ("Cookie Mine"), and later agent-facing
workflows. Harder to adopt and to explain; it comes after Core is adoptable.

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

## Phase 4: Core Open-Source Readiness, then Visual Desktop Shell

Phase 4 runs in two parts. **4a (now): Feather Core open-source readiness** — an
artifact-forward README, a runnable public demo (`examples/quickstart.sh`), the public
Core-vs-Shell split above, and honest docs — so a stranger can understand and run Core. **4b
(after): the Visual Desktop Shell** — unchanged in substance, resequenced behind 4a.

### Phase 4b: Visual Desktop Shell Prototype

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

## Phase 5+: Agent Runtime Layer & Daily Hardening (future — cold storage)

High-level only while Phase 4 is active. Full milestone detail + the two North-Star behavioral
objectives (**Active Anti-Bot Self-Detection** — real-time self-monitoring/correction, not a passive
recorder; **True Perception & Generalized Workflows** — a perception layer for unfamiliar sites, not
a DOM stripper) → `journal/ops/archive/roadmap-future.md`. Expand back into this file when Phase 4 finishes.
