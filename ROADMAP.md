# Roadmap

## Destination

Build a lightweight, highly configurable browser experience that can use Chrome extensions or equivalent Chromium extension support, exposes Playwright-compatible automation for agents, and keeps a calm, keyboard-friendly, user-owned interface.

## Roadmap Model

- Milestones are solid destination points.
- Phases are flexible placeholders until active.
- Every phase starts with Step 0: research and plan that phase.
- Only the current phase gets detailed tasks in `ops/tasks.md`.
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

## Phase 1: Research and Architecture Decision

Goal: Decide the technical foundation.

Status: Complete.

Decision:
- Phase 2 should start with a Playwright-managed persistent Chromium profile plus a custom local shell/control UI.
- The project should prioritize an agentic-AI-first prototype without becoming agent-only; the first build should remain visible and usable by a human.
- Electron may be useful for control UI ideas but is not the browser core because arbitrary Chrome extension compatibility is an Electron non-goal.
- CEF, Qt WebEngine, and a Chromium fork remain possible later paths if the prototype proves the need for deeper browser chrome ownership.

Exit criteria:
- Architecture decision record is written in `docs/specs/adr-0001-browser-foundation.md`.
- Research findings are written in `research/2026-05-31-browser-architecture-options.md`.
- Non-goals and constraints are explicit.
- Phase 2 can begin with Step 0: research and plan the minimal browser shell/control plane.

## Phase 2: Minimal Browser Shell

Goal: Build the smallest usable browser/control surface that proves the chosen foundation.

Milestones:
- Step 0: research and plan Phase 2.
- Launch a human-visible persistent Chromium workspace.
- Create a minimal profile/workspace configuration model.
- Provide a local control UI or CLI for launch, status, and endpoint discovery.
- Validate Playwright connection and basic agent workflow.
- Capture basic session metadata for debugging.

## Phase 3: Extension and Customization Layer

Goal: Validate extension compatibility and deep user configuration.

Milestones:
- Step 0: research and plan Phase 3.
- Extension strategy tested.
- Theme/layout configuration.
- Command palette or shortcut system.
- Import/export settings.

## Phase 4: Agentic Automation Layer

Goal: Expose reliable Playwright-driven control for AI agents.

Milestones:
- Step 0: research and plan Phase 4.
- Agent profile isolation.
- Playwright endpoint or control protocol.
- Permission model.
- Session logs and replay/debug tools.

## Phase 5: Daily Browser Hardening

Goal: Decide whether this can become a daily browser.

Milestones:
- Step 0: research and plan Phase 5.
- Stability testing.
- Performance budget.
- Security review.
- Update strategy.
