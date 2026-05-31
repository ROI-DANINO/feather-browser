# Roadmap

## Destination

Build a hyper-lightweight Chromium-compatible browser/control system for seamless agentic automation first, then wrap the proven core in a calm, bold, minimalist visual browser for personal daily use.

Feather should not depend on Chrome extensions as its product strategy. Critical capabilities should be native or integrated project features, using mature open-source tools where they reduce risk and cost.

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

## Phase 1: Headless Core Architecture Decision

Goal: Decide the technical foundation for a headless-first browser core.

Status: Restarted.

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

Milestones:
- Step 0: research and plan Phase 2.
- Launch and control isolated headless browser sessions.
- Create a minimal profile/workspace configuration model.
- Provide a local CLI or API surface for launch, status, endpoint discovery, and control.
- Validate internal automation API shape for navigation, DOM inspection, extraction, and session control.
- Validate proxy/network configuration boundaries.
- Capture basic session metadata for debugging.

## Phase 3: Native Feature And Integration Layer

Goal: Build critical browser capabilities as native or integrated features instead of depending on Chrome extensions.

Milestones:
- Step 0: research and plan Phase 3.
- Media download integration strategy.
- RTL handling and toggles.
- Scraping reliability and session realism controls.
- Import/export settings.
- Permission and policy model for internal APIs.

## Phase 4: Visual GUI Wrapper

Goal: Wrap the proven core in a gorgeous, bold, minimalist graphical interface inspired by Zen Browser.

Milestones:
- Step 0: research and plan Phase 4.
- UI architecture choice.
- Workspace/profile controls.
- Command palette or shortcut system.
- Theme/layout configuration.
- Human-visible browsing flow.

## Phase 5: Daily Browser Hardening

Goal: Decide whether this can become a daily browser.

Milestones:
- Step 0: research and plan Phase 5.
- Stability testing.
- Performance budget.
- Security review.
- Update strategy.
