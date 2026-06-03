# Browser Desk

Use this desk for browser engine research, shell architecture, extension compatibility, performance, security, packaging, and update strategy.

## Current Focus

Stabilization & Linux-Readiness program — S2. Brainstorm complete; design spec written
(`docs/specs/2026-06-03-s2-tab-layer-observability-design.md`). Next: `writing-plans` → implement.

## Architecture Decisions

- **Foundation:** Playwright-managed Chromium (ADR-0002)
- **Runtime:** Host-primary; Flatpak distribution Phase 4+; Podman optional for headless/CI (ADR-0004)
- **Platform:** Linux-only (Fedora target). Electron eliminated — bundles a second Chromium (anti-Feather).
- **Phase 4 shell candidates:** Tauri/WebKitGTK or GTK4-native. Wayland browser-surface embedding unresolved — must be prototyped.
- **Cookie Mine model:** Phase 4 establishes the long-running human session that Phase 5+ agents piggyback on (ADR-0003).
- **Agentic North Star:** token/context efficiency is a standing constraint; MCP tool selection deferred to Phase 5 Step 0 after 2026-07-28 spec final (ADR-0005).

## S2 Items — design decided (spec: 2026-06-03-s2-tab-layer-observability-design.md)

**Implementation plan scope = items 1, 3, 4 (the 3 unblocked items). Item 2 deferred.**

1. **Fix duplicate tab registration** (prerequisite) — `openTab()` + `context.on("page")` both
   register the same page (two IDs). **Fix:** idempotent `addPage` keyed on the `Page` object
   (reverse map `Page → pageId`); `openTab()` stops assigning its own id. Eliminates the bug + the
   listener-vs-`openTab` race. Keep `TAB_OPENED` (intent/audit) and `TAB_CREATED` (lifecycle)
   distinct — not collapsing.
2. `FEATHER_CHROMIUM_PATH` — **DEFERRED** out of the S2 implementation plan (different theme:
   weight). Gated on `sudo dnf install chromium` (Fedora `updates` repo, NOT RPM Fusion) + probe,
   then env var in `config.ts` + `executablePath` in `modes.ts`. Follow-on after the 3 items.
3. **`TAB_UPDATED` event — scope decided: SETTLED-ONLY.** One event per navigation, fired after
   `domcontentloaded` (title is unreliable at `framenavigated` time). Mechanism: main-frame
   `framenavigated` + `waitForLoadState("domcontentloaded")` + supersede guard; covers SPA
   `pushState`. Add to EVENTS catalog + SSE `LIFECYCLE_EVENTS`. Payload `{ pageId, url, title,
   loadState }`. No loading-spinner pulse (Phase-4 shell concern if ever wanted).
4. **Observability hardening** — `getPageInfoList()` per-page try/catch (best-effort
   `loadState: "unknown"`); trace e2e integration test (`debug.trace:true` → `trace.zip` non-empty).

## Key Spike Results

- **fastify-sse-v2 v5 compat** (`raw/_inbox/spike-fastify-sse-v2-v5-compat.md`): peerDep `>=4` covers v5 by range but only tested v4 — NOT proven. S3 must test explicitly.
- **System Chromium executablePath** (`raw/_inbox/spike-system-chromium-executablepath.md`): not installed; needs `sudo dnf install chromium` from the standard Fedora `updates` repo (NOT RPM Fusion) before the probe can run. Version 148.0.7778.215 — same major as bundled (148.0.7778.96), so version-skew risk is low.
