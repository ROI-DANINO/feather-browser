# Browser Desk

Use this desk for browser engine research, shell architecture, extension compatibility, performance, security, packaging, and update strategy.

## Current Focus

Stabilization & Linux-Readiness program — S2 (Linux weight & observability) brainstorm next.

## Architecture Decisions

- **Foundation:** Playwright-managed Chromium (ADR-0002)
- **Runtime:** Host-primary; Flatpak distribution Phase 4+; Podman optional for headless/CI (ADR-0004)
- **Platform:** Linux-only (Fedora target). Electron eliminated — bundles a second Chromium (anti-Feather).
- **Phase 4 shell candidates:** Tauri/WebKitGTK or GTK4-native. Wayland browser-surface embedding unresolved — must be prototyped.
- **Cookie Mine model:** Phase 4 establishes the long-running human session that Phase 5+ agents piggyback on (ADR-0003).
- **Agentic North Star:** token/context efficiency is a standing constraint; MCP tool selection deferred to Phase 5 Step 0 after 2026-07-28 spec final (ADR-0005).

## S2 Items (4 — scope finalized)

1. **Fix duplicate tab registration** — `openTab()` + `context.on("page")` both register the same page (two IDs). Make the listener the single source. Prerequisite for `TAB_UPDATED`.
2. `FEATHER_CHROMIUM_PATH` — use system Chromium instead of bundled. Add env var to `config.ts`, wire `executablePath` in `modes.ts`. Prereq: `sudo dnf install chromium` from the standard Fedora `updates` repo (NOT RPM Fusion — earlier spike doc was wrong), then run spike probe (S1 plan Task 11 Step 2).
3. `TAB_UPDATED` event — top-level navigation event, deferred from Phase 3. Scope pending.
4. **Observability hardening** — confirm `capture.ts` trace e2e + `getPageInfoList()` best-effort per-page.

## Key Spike Results

- **fastify-sse-v2 v5 compat** (`raw/_inbox/spike-fastify-sse-v2-v5-compat.md`): peerDep `>=4` covers v5 by range but only tested v4 — NOT proven. S3 must test explicitly.
- **System Chromium executablePath** (`raw/_inbox/spike-system-chromium-executablepath.md`): not installed; needs `sudo dnf install chromium` from the standard Fedora `updates` repo (NOT RPM Fusion) before the probe can run. Version 148.0.7778.215 — same major as bundled (148.0.7778.96), so version-skew risk is low.
