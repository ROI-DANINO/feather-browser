# Browser Desk

Use this desk for browser engine research, shell architecture, extension compatibility, performance, security, packaging, and update strategy.

## Current Focus

Stabilization & Linux-Readiness program — **S2 core implemented (3 of 4 items, on `dev`).**
Plan: `docs/plans/2026-06-03-s2-tab-layer-observability.md`. Next: pick S3 (currency/security)
or the deferred observability work; then ROADMAP Phase 4 Step 0.

## Architecture Decisions

- **Foundation:** Playwright-managed Chromium (ADR-0002)
- **Runtime:** Host-primary; Flatpak distribution Phase 4+; Podman optional for headless/CI (ADR-0004)
- **Platform:** Linux-only (Fedora target). Electron eliminated — bundles a second Chromium (anti-Feather).
- **Phase 4 shell candidates:** Tauri/WebKitGTK or GTK4-native. Wayland browser-surface embedding unresolved — must be prototyped.
- **Cookie Mine model:** Phase 4 establishes the long-running human session that Phase 5+ agents piggyback on (ADR-0003).
- **Agentic North Star:** token/context efficiency is a standing constraint; MCP tool selection deferred to Phase 5 Step 0 after 2026-07-28 spec final (ADR-0005).

## S2 Items — implementation status (plan: 2026-06-03-s2-tab-layer-observability.md)

1. ✅ **Duplicate tab registration FIXED** — `addPage` is now idempotent, keyed on the `Page`
   object (reverse map `Page → pageId`); `setContext`/`openTab` route through it; `removePage`
   clears both maps. The two-ids-per-tab bug + the listener-vs-`openTab` race are gone.
   `TAB_OPENED` (intent/audit) and `TAB_CREATED` (lifecycle) kept distinct. (`4fdf9cc`)
2. ✅ **`TAB_UPDATED` SHIPPED — settled-only.** One event per navigation, after
   `domcontentloaded`. Mechanism: main-frame `framenavigated` + `waitForLoadState
   ("domcontentloaded")` + supersede guard; covers SPA `pushState`. In `EVENTS` + SSE
   `LIFECYCLE_EVENTS`; payload `{ pageId, url, title, loadState }`. All reads best-effort.
   (`ef87440`, `6f35876`; real-Chromium e2e test `ea4e30d`)
3. ✅ **`getPageInfoList()` resilience SHIPPED** — per-page try/catch → best-effort
   `loadState:"unknown"`; one crashed page no longer rejects the whole list. (`42c73c3`)

**Deferred (NOT shipped):**
- **Trace e2e + `DebugCapture` wiring** — CUT from S2 (stabilization discipline). `DebugCapture`
  (`src/debug/capture.ts`) is **dead code**: never instantiated, `debug.trace` never read by
  `launch()`, so `trace.zip` is never produced. A future observability sprint must wire `start()`
  after `setContext` + `finalize()` before `context.close()` + read the flag in `launch()`.
- **`FEATHER_CHROMIUM_PATH`** — spike-gated (`sudo dnf install chromium`, Fedora `updates` repo
  NOT RPM Fusion, + launch probe), then env var in `config.ts` + `executablePath` in `modes.ts`.
  Different theme (weight).

## Key Spike Results

- **fastify-sse-v2 v5 compat** (`raw/_inbox/spike-fastify-sse-v2-v5-compat.md`): peerDep `>=4` covers v5 by range but only tested v4 — NOT proven. S3 must test explicitly.
- **System Chromium executablePath** (`raw/_inbox/spike-system-chromium-executablepath.md`): not installed; needs `sudo dnf install chromium` from the standard Fedora `updates` repo (NOT RPM Fusion) before the probe can run. Version 148.0.7778.215 — same major as bundled (148.0.7778.96), so version-skew risk is low.
