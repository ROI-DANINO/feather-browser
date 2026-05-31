# Phase 3 Browser Stability First Brief

## Purpose

This document is a planning brief for future code-generation or architecture-analysis sessions.

It does not define an implementation task by itself. It should not be treated as permission to add code, dependencies, folders, agent-runtime modules, desktop UI scaffolding, or roadmap changes without explicit approval.

The goal is to help future analysis preserve Feather Browser's core direction: build a stable, minimalist browser foundation first, and keep agent-oriented systems as future optional layers rather than early architectural noise.

## Current Concern

Feather Browser has a strong long-term vision: a lightweight, minimalist desktop browser shell with a clean foundation for background automation and autonomous AI agents.

However, adding too many agent features too early can harm the stability and clarity of the browser core. Features such as Hermes orchestration, LLM credentials, human-readable agent chat, checkpoints, screencasting, context shrinking, and agent recipes are valuable, but they should not be mixed directly into the browser foundation before the core browser lifecycle is stable.

The immediate risk is architectural noise: the repository could become an agent platform before it becomes a reliable browser.

## Guiding Principle

Build the browser first.
Make it observable.
Make it controllable.
Only then make it agentic.

## Stability-First Interpretation Of Phase 3

Phase 2 is complete and should not be reopened.

Phase 3 should be interpreted as:

> Browser Core Stabilization & UI Readiness

The focus should be on preparing the core for a future desktop shell without prematurely implementing the full agent runtime.

Phase 3 should prioritize narrow, browser-relevant infrastructure:

- Reliable session lifecycle.
- Better tab/page lifecycle tracking.
- Minimal event stream for UI readiness.
- Stable API contracts.
- Profile/workspace clarity.
- Debuggability and measurement.
- Clear boundaries for future agent features.

Phase 3 should avoid introducing full agent systems unless explicitly approved.

## What Belongs In The Core Soon

These items are allowed to be analyzed as near-term browser-core improvements:

1. Dynamic page/tab tracking
   - Track pages created after session launch.
   - Hook into Playwright `context.on("page")`.
   - Track page close, navigation, title, URL, and load state.

2. Minimal lifecycle events
   - Emit internal events for session created/running/closed.
   - Emit internal events for tab created/updated/closed.
   - Keep the event model small and browser-oriented.

3. UI-readiness transport
   - Consider SSE or WebSocket as a thin event stream.
   - Do not build a full agent messaging protocol yet.
   - Keep HTTP command endpoints stable.

4. API contract cleanup
   - Keep public response shapes independent from Playwright objects.
   - Avoid leaking internal Playwright types into the future UI layer.

5. Measurement and stability
   - Preserve resource measurement work.
   - Avoid speculative optimization claims unless measured.

## What Should Stay Future-Scope For Now

The following should be documented, analyzed, or parked in future specs, not implemented directly in the core yet:

- Hermes Agent integration.
- Codex/GPT API wrappers.
- Agent chat sidebar.
- Human approval checkpoints.
- Credentials vault.
- Full context shrinker/token optimizer.
- Atomic agent action protocol.
- Scripted agent recipes.
- Headless screencast portal.
- User-to-agent tab handover.
- Electron/CEF desktop shell implementation.

These may become important later, but they should not shape the current browser core prematurely.

## Recommended Roadmap Interpretation

### Phase 2 — Complete

Keep as completed headless core prototype.

Do not reopen Phase 2 unless there is a critical correctness issue.

### Phase 3 — Browser Core Stabilization & UI Readiness

Recommended focus:

- Stabilize `SessionManager` lifecycle behavior.
- Improve `FeatherSession` page/tab management.
- Add small, typed lifecycle events.
- Add a thin read-only event stream for a future UI.
- Keep agent concepts out of `src/agents/` unless explicitly approved.
- Keep future agent concepts in documentation only.

Possible exit criteria:

- Sessions and pages/tabs can be observed reliably.
- New pages opened after launch are tracked.
- A future UI can subscribe to browser lifecycle events.
- Existing HTTP API remains stable.
- No heavy agent runtime has been added.

### Phase 4 — Visual Desktop Shell Prototype

Only after Phase 3 provides stable lifecycle/events:

- Choose desktop shell technology for prototype.
- Build Zen-inspired layout.
- Add vertical tabs, collapsible sidebar, and browser surface.
- Consume the Phase 3 event stream.
- Keep agent UI panels optional and deferred.

### Phase 5+ — Agent Runtime Layer And Daily Hardening

Only after a stable browser shell exists:

- Add Hermes integration.
- Add credentials handling.
- Add checkpoint system.
- Add context shrinker.
- Add atomic action handler.
- Add human-readable agent feed.
- Add optional viewport preview/screencast.
- Perform security and performance hardening.

## Instructions For Future Claude Or Code-Generation Sessions

Before making any changes, read this file and treat it as a constraint.

Primary task:

Analyze the current codebase and propose a revised roadmap that keeps Feather focused on building a stable minimalist browser shell first, while keeping agent/Hermes features as future optional layers.

Do not add code, dependencies, folders, or agent runtime files unless explicitly approved.

When analyzing possible changes, classify each suggestion as one of:

- Core browser stability.
- UI readiness.
- Future agent layer.
- Do not implement yet.

Prefer documentation and planning over implementation unless the user explicitly approves a concrete code task.

## Non-Goals For This Brief

This document is not a request to:

- Implement a desktop UI.
- Add Electron, Tauri, CEF, or Rust.
- Add a WebSocket dependency.
- Add Hermes integration.
- Add an agent runner.
- Add credentials storage.
- Modify `ROADMAP.md` automatically.
- Change runtime behavior.

It is only a stability-first planning guardrail.
