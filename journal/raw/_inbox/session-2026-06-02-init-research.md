# Session Context — /init + Research Pass
# Date: 2026-06-02

## What Happened

Ran `/init` after Phase 3 completed. Confirmed all Phase 3 milestones done (129 unit + 32 integration tests). Then ran a full research pass focused on: what did we miss in Phases 1–3, and what should inform Phase 4 planning.

## Key User Clarification (Changes Prior Assumptions)

**Feather Browser is Linux-only.** This invalidates the original Electron recommendation:
- Cross-platform rendering consistency concern → gone
- Electron bundles Chromium for its shell UI → but Playwright ALSO launches Chromium for sessions → two Chromium instances → anti-"Feather"
- Tauri uses WebKitGTK on Linux → consistent and lightweight → back on the table, but with new concerns (see research files)

## Open Questions That Must Be Answered in Phase 4 Step 0

1. **Browser surface architecture** — What does the user actually browse with?
   - Option A: Tauri/WebKitGTK IS the browser (lightweight, but not Chromium — affects Cookie Mine/fingerprinting)
   - Option B: Playwright Chromium headed + shell positioned alongside (Wayland embedding problem)
   - Option C: GTK4 native shell + Playwright Chromium (most Linux-native, most complex)

2. **Wayland embedding** — Fedora defaults to Wayland. XEmbed (X11) doesn't work on Wayland. How does the browser surface appear inside the shell window?

3. **System Chromium on Fedora** — Can we use `/usr/bin/chromium` (RPM Fusion) as the Playwright `executablePath`? Eliminates bundled Chromium download. Must test.

4. **D-Bus vs SSE** — For Phase 4 shell event stream, is D-Bus (binary, desktop-native) better than our HTTP SSE endpoint? Or keep SSE (already built, works, simpler)?

## What Phases 1–3 Actually Missed

- Fastify v4 LTS ended June 2025 — we are running unpatched/unsupported
- System Chromium option never explored (weight reduction opportunity)
- Playwright tracing (`context.tracing`) not used — would enrich debug bundles
- TAB_UPDATED event deferred and still open

## What's Next

1. Merge dev → master (Phase 3 baseline, no new work before this)
2. Phase 4 Step 0: research + plan — must resolve the architecture questions above before any code
3. Migrate Fastify v4 → v5 (before or as part of Phase 4 Step 0)

## Research Files Written

- `raw/_inbox/research-phase4-shell-architecture.md` — Tauri vs Electron vs GTK, Wayland, browser surface
- `raw/_inbox/research-linux-fedora-tools.md` — D-Bus, libsecret, XDG portals, GStreamer, Flatpak, system Chromium
- `raw/_inbox/research-playwright-updates.md` — Playwright 1.50–1.55 changes, tracing, screencast API
- `raw/_inbox/research-mcp-playwright-mcp.md` — MCP spec 2026, Tasks extension, Playwright MCP vs CLI
- `raw/_inbox/research-fastify-v5.md` — Fastify v5 migration, breaking changes
