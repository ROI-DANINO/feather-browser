# ADR-0001: Browser Foundation

Date: 2026-05-31

## Status

Superseded on 2026-05-31.

This decision is retained as historical research. It was superseded when the project direction changed from visible-shell-first and extension-compatibility-first to headless-core-first, native/integrated-feature-first, and GUI-later.

## Context

Feather Browser aims to become a very light, highly configurable, Chromium-compatible browser experience with a calm Zen-inspired workflow and first-class Playwright support for agentic AI.

The project is a hobby effort expected to evolve over roughly a year. It needs a foundation that can produce useful learning quickly without committing too early to the cost of maintaining a browser engine or a full Chromium fork.

Phase 1 compared:
- Electron
- Chromium Embedded Framework
- Qt WebEngine
- Chromium fork/distribution
- Playwright persistent Chromium profile with custom shell/control UI
- WebView2/Tauri as adjacent candidates

## Decision

Feather will plan Phase 2 around a Playwright-managed persistent Chromium profile with a custom local shell/control UI.

The first build should prove a human-visible, persistent Chromium workspace that Feather can launch, configure, observe, and expose to agents. Feather should own the profile/workspace model, configuration, command layer, agent permissions, session logging, and lifecycle. Chromium should continue to own rendering, site compatibility, extension runtime, media, downloads, and normal web behavior.

Playwright should be the preferred automation interface. CDP may be exposed or used where attachment to an existing browser is useful, but CDP is not the primary quality bar because Playwright documents it as lower fidelity than Playwright protocol connections.

## Rationale

This path best matches the project's constraints:

- It tests the unique agentic-AI premise first instead of spending months rebuilding ordinary browser chrome.
- It keeps Chromium behavior real by using Chromium itself rather than an incomplete embedder.
- It avoids the update and security burden of a Chromium fork during the first build phase.
- It gives the project a direct way to validate persistent profiles, extension behavior, Playwright control, screenshots, traces, logs, and agent permissions.
- It preserves daily-driver optionality by using visible Chromium workspaces rather than headless-only automation.

The recommendation is agentic-AI first, but not agent-only. The Phase 2 artifact should remain useful to a human: launchable windows, persistent sessions, simple workspace switching, and calm local controls.

## Consequences

Positive:
- Fastest credible route to a working prototype.
- Strongest alignment with Playwright and agentic control.
- Lower maintenance burden than CEF, Qt WebEngine, or Chromium fork.
- Real Chromium site behavior and extension experiments remain possible.

Negative:
- Feather will not initially be a fully custom browser chrome.
- Deep browser UI changes are limited unless the project later moves to CEF, Qt WebEngine, or a Chromium fork.
- Browser extension behavior depends on the selected Chromium/Chrome channel and Playwright launch constraints.
- CDP attachment is available but lower fidelity than Playwright-native control.

## Non-Goals For Phase 2

- No full Chromium fork.
- No attempt to replace Chrome's built-in UI completely.
- No promise of Chrome Web Store parity beyond what the selected Chromium/Chrome runtime can support.
- No sync service, password manager replacement, or daily-driver hardening.
- No broad extension compatibility certification.

## Phase 2 Planning Direction

Phase 2 should start with Step 0: research and plan the minimal browser shell/control plane.

Expected high-level Phase 2 scope:
- Launch a persistent Chromium profile from Feather.
- Define a workspace/profile configuration file.
- Open a human-visible Chromium window.
- Provide a small local control UI or CLI for launch, workspace selection, endpoint discovery, and status.
- Expose a Playwright connection path for agent workflows.
- Record basic session metadata, logs, screenshots, or traces sufficient for debugging.
- Validate one or two extension-loading scenarios without making extension parity a release claim.

## Revisit Triggers

Reconsider the foundation if:
- Playwright persistent contexts block essential extension or profile behavior.
- The project needs deep browser chrome ownership before the agentic prototype proves value.
- Daily-driver requirements become the primary goal earlier than planned.
- A Phase 2 prototype shows that CDP/Playwright control cannot support the intended agent workflows.

## Source Research

See `research/2026-05-31-browser-architecture-options.md`.
