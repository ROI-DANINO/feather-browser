# Session Handoff: Phase 1 Headless Core Restart

Date: 2026-05-31

## Status

Phase 0 workspace setup remains complete.

Phase 1 is restarted and active: Headless Core Architecture Decision.

The previous Phase 1 decision selected a visible Playwright-managed Chromium shell with extension compatibility. That direction is now superseded. Keep the old ADR and research as historical context, but do not treat them as current instructions.

## Current Direction

Feather is now a headless-first personal hybrid browser project:
- prove a lightweight Chromium-compatible automation core first
- expose internal APIs for agents, scraping, session control, and data extraction
- prioritize low RAM/CPU use, modularity, profile/session isolation, and scraping reliability
- avoid depending on Chrome extensions as the product strategy
- build critical features natively or integrate mature open-source tools behind Feather-owned interfaces
- defer GUI design and scaffolding until after the headless core is proven

## Next Action

Run Phase 1 restart Step 0:
- research current primary sources
- compare Playwright-managed Chromium, Tauri/WebView, CEF, Qt WebEngine, Chromium fork/distribution paths, and Rust/C++ control-layer options
- evaluate native/integrated feature strategy, including tools such as `yt-dlp`
- define the first internal automation API shape
- define profile/session/proxy isolation requirements
- write fresh research in `research/`
- write a fresh ADR in `docs/specs/`

## Files To Read First

- `AGENTS.md`
- `README.md`
- `ROADMAP.md`
- `PROGRESS.md`
- `ops/tasks.md`
- `ops/phase.md`
- `context/active.md`
- `log.md`

## Guardrails

- Do not design or scaffold GUI components during the active headless-core architecture phase.
- Do not make Chrome extension support the foundation of the product.
- Do not compile Chromium from scratch unless research justifies the maintenance cost.
- Use current web research for architecture facts and prefer official docs or active repositories.
