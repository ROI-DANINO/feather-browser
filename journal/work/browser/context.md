# Browser Desk

Use this desk for browser engine research, shell architecture, extension compatibility, performance, security, packaging, and update strategy.

## Current Focus

**Phase 4 Step 0 DONE (2026-06-04)** — answered by spikes, not specs. Cookie Mine proven
end-to-end on a real site (agent acted in Roi's live ChatGPT).

**Pre-shell infrastructure sequence (locked 2026-06-04) — must precede the Visual Desktop Shell GUI:**
(1) storage-isolation fix (`src/config.ts` `featherDir` → `~/.config`/`~/.local/share` + gitignore;
currently violated) → (2) productionize attach-don't-launch into `src/` + `FEATHER_CHROMIUM_PATH`
(sudo) → (3) warmed persistent Google session on disk (Cookie Mine foundation; agent blind) →
(4) observability (wire `DebugCapture`) → (5) prove the end-to-end Cookie Mine loop on the
**headed-Chromium stopgap** (ADR-0007 gate) → *then* the GUI. Vault Spikes A/B **frozen** (sudo → Roi;
architecture stands).

## Dependency baseline (post-S3, 2026-06-03)

- **Fastify 5.8.5** (was v4; v4 LTS ended 2025-06-30). Migration needed **zero source changes** —
  Feather validates with Zod (no Fastify `schema:` blocks, so v5's full-schema requirement is
  N/A), `listen()` already object-form, no `request.connection`/`hostname`/`getDefaultRoute` usage.
- **Playwright 1.60.0** (floor `^1.60.0`). Bundled Chromium **148** (148.0.7778.96).
- `fastify-sse-v2@4.2.2`, zod ^3, vitest ^2 unchanged.

## Architecture Decisions

- **Foundation:** Playwright-managed Chromium (ADR-0002)
- **Runtime:** Host-primary; Flatpak distribution Phase 4+; Podman optional for headless/CI (ADR-0004)
- **Platform:** Linux-only (Fedora target). Electron eliminated — bundles a second Chromium (anti-Feather).
- **Phase 4 shell (ADR-0007):** target end-state = "painted-in" one-window shell (headless
  Chromium + screencast + forwarded input). Display *model* is the direction; the
  *implementation stack* is **open R&D, not locked** (not Tauri/GTK/Rust/Zig by decree). The
  seamless shell is **deferred** to a later dedicated R&D phase; **headed Chromium is the
  stopgap** human surface now. WebKit-as-browser-surface is dead (need Chromium for trust).
- **Wayland surface (spiked 2026-06-04):** Chromium runs **headed natively on Wayland**
  (`--ozone-platform=wayland`, no XWayland needed). On `niri` (tiling), windows are tiles —
  the app cannot self-size/place. The "Wayland can't embed" blocker is **dissolved** by the
  separate-window / headless-painted-in model (no foreign window to embed). niri-vs-GNOME
  floating behavior parked for the shell phase.
- **Anti-detection — attach, don't launch (spiked 2026-06-04):** a Playwright-*launched*
  browser is flagged as a bot (Google/Cloudflare walls; `navigator.webdriver=true`). Spawning
  Chromium *normally* (no automation flags) + `connectOverCDP` yields
  `navigator.webdriver=false` and gets past real CAPTCHAs (logged into ChatGPT clean).
  **Bot-detection is the #1 risk** to Cookie Mine. Current `src/browser/modes.ts` has NO
  anti-detection (old stealth patches dropped) — productionizing this is open work.
- **Cookie Mine model:** Phase 4 establishes the long-running human session that Phase 5+
  agents piggyback on (ADR-0003). **Proven on a real site 2026-06-04**: an agent tab
  (`context.newPage` == `openTab`) inherits the human's live login.
- **Agentic North Star:** token/context efficiency is a standing constraint; MCP tool selection deferred to Phase 5 Step 0 after 2026-07-28 spec final (ADR-0005).
- **Credentials vault (ADR-0008, 🚧 non-accepted):** interface-first, local-first `CredentialsVault`; Feather is NOT a password manager; KeePassXC + SQLCipher are **candidates, not selections**; acceptance gated on 3 spikes (C leakage harness, A SQLCipher, B KeePassXC). Spikes A/B need sudo installs (hand to Roi).

## Secret-leakage findings (Spike C probe, 2026-06-04 — evidence, not assumption)

A throwaway probe drove a real `chromium-headless-shell` session with 3 canaries (password POST /
URL query / visible text) and scanned every output surface. Durable facts:

- **`trace.zip` leaks secrets that were never on screen** — the `fill()` action argument verbatim
  + the POST body as a resource (`.dat`). NOT redactable → traces must be **off by default for
  credential sessions** (Phase-5 policy). The leakage gate treats a trace's *presence* as a finding
  (no unzip, no zip dependency).
- **Feather leaks raw URLs into clean-tier surfaces** — `TAB_UPDATED.data.url` (`manager.ts:159`)
  and `network-summary` (`capture.ts:44,55`). `network-summary` records the URL only — **never POST
  bodies/headers** (confirmed by code).
- **`redactUrl` (`src/logs/redact.ts`) was dead code** (only its own test imported it) and stripped
  only `user:pass@`. The plan hardens it to also drop **query string + fragment** and applies it at
  those two emission points. `DebugCapture` remains dead-code-until-wired.
- **A `type=password` field protects nothing at the data layer** (masking is pixels only).
  **Screenshots leak visually but are text-invisible** → mitigate by policy (don't screenshot
  sensitive sessions), not OCR.

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

- **fastify-sse-v2 v5 compat** — **RESOLVED (S3, 2026-06-03):** proven compatible with Fastify
  **5.8.5**. A throwaway-branch probe ran the full suite + a live SSE stream against v5 — all
  green (`sse.integration.test.ts` + `tab-updated.integration.test.ts` included). The peerDep
  `>=4` claim held. Hand-rolled-SSE contingency was defined but unused. (Was: untested.)
- **System Chromium executablePath** (`raw/_inbox/spike-system-chromium-executablepath.md`): not installed; needs `sudo dnf install chromium` from the standard Fedora `updates` repo (NOT RPM Fusion) before the probe can run. Version 148.0.7778.215 — same major as bundled (148.0.7778.96), so version-skew risk is low.
