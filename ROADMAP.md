# Roadmap

## Destination

Build a lightweight, highly configurable browser experience that can use Chrome extensions or equivalent Chromium extension support, exposes Playwright-compatible automation for agents, and keeps a calm, keyboard-friendly, user-owned interface.

## Phase 0: Workspace Setup

Goal: Create the project operating system before product research or implementation.

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

Candidate directions:
- Electron or a lighter Chromium shell.
- CEF-based desktop shell.
- Qt WebEngine.
- Playwright persistent Chromium profile with custom companion UI.
- Full Chromium fork or distribution.

Exit criteria:
- Architecture decision record is written.
- Non-goals and constraints are explicit.
- Phase 2 tasks can be planned.

## Phase 2: Minimal Browser Shell

Goal: Build the smallest usable browser surface that proves the chosen foundation.

Milestones:
- Basic window, navigation, tabs or workspaces.
- Persistent profile.
- Config file or settings model.
- Basic keyboard command system.

## Phase 3: Extension and Customization Layer

Goal: Validate extension compatibility and deep user configuration.

Milestones:
- Extension strategy tested.
- Theme/layout configuration.
- Command palette or shortcut system.
- Import/export settings.

## Phase 4: Agentic Automation Layer

Goal: Expose reliable Playwright-driven control for AI agents.

Milestones:
- Agent profile isolation.
- Playwright endpoint or control protocol.
- Permission model.
- Session logs and replay/debug tools.

## Phase 5: Daily Browser Hardening

Goal: Decide whether this can become a daily browser.

Milestones:
- Stability testing.
- Performance budget.
- Security review.
- Update strategy.

