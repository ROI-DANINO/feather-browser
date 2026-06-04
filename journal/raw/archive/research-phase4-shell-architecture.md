# Research: Phase 4 Shell Architecture
# Date: 2026-06-02 | Source: Web research pass

## Context

Feather Browser is Linux-only. Phase 4 goal: wrap the Phase 3 headless core in a
Zen-inspired graphical shell. Consume SSE event stream. Establish the primary persistent
context for Phase 5+ Cookie Mine. No agent panels.

## Electron — Wrong Choice for Feather

- Electron bundles its own Chromium (for the shell UI)
- Playwright launches another Chromium (for sessions)
- Result: two Chromium processes running simultaneously
- Directly contradicts "Feather" (lightweight) branding
- Electron 35: 180MB bundle, ~450MB RAM at launch
- Verdict: DO NOT USE for Phase 4

## Tauri 2.0 — Strong Candidate (with caveats)

- Uses WebKitGTK on Linux (webkit2gtk-4.1 required)
- Bundle: ~12MB, ~85MB RAM
- Rust backend, Wayland-native support
- Mobile (Android/iOS) support added in Tauri 2.0 (not relevant now but future-proof)
- Ecosystem: 120+ plugins as of April 2026

### Critical Concern
GitHub discussion (tauri-apps/tauri #8524): "Webkit is totally unstable, so we need to
use chromium or firefox instead."

WebKitGTK is fine for rendering control UI (sidebar, settings, tab list). As the ACTUAL
BROWSING surface for a daily-driver browser, it has documented crash/compat issues with
complex sites. This is the key risk.

### How Tauri Fits (if used for shell only)
- Tauri renders the control chrome: sidebar, tab list, navigation bar, settings
- Playwright-managed Chromium handles the actual browsing sessions (headed)
- Challenge: how to display the Chromium session INSIDE the Tauri window

## Wayland Embedding Problem

Fedora defaults to Wayland. Critical constraint:

- X11 had XEmbed: embed a foreign window (e.g., Chromium) inside another app's window
- Wayland has NO equivalent standard protocol for foreign window embedding
- Chromium supports `--ozone-platform=wayland` for native Wayland rendering
- But a native Wayland Chromium window CANNOT be embedded in a Tauri/GTK window

Workaround options:
1. Run Chromium in XWayland (X11 compatibility layer) — XEmbed works, but XWayland overhead
2. Side-by-side windows (no embedding) — fragile UX, windows can separate
3. Playwright `page.screencast()` → WebRTC/video stream → displayed in shell — latency, CPU cost
4. CDP remote debugging port → shell renders page in its own WebView — complex, two engines

## Three Candidate Architectures

### A: Tauri + WebKit as Browser Surface
Shell: Tauri (WebKitGTK)
Browser: WebKitGTK WebView (same as shell)
RAM: ~85MB
Wayland: native
Risk: WebKitGTK stability, not Chromium (fingerprinting impact for Cookie Mine)
Note: Could use Playwright's WebKit driver to control it

### B: Tauri Shell + Playwright Chromium (Headed, Side-by-Side)
Shell: Tauri (WebKitGTK for UI only)
Browser: Playwright Chromium headed window
RAM: ~85MB shell + Chromium
Wayland: Chromium runs via XWayland or native Wayland (no embedding)
Risk: UX fragility, window management complexity

### C: GTK4 Native Shell + Playwright Chromium
Shell: GTK4 + libadwaita (pure Rust or node-gtk)
Browser: Playwright Chromium headed
RAM: very low shell + Chromium
Wayland: best native support, GTK4 is Wayland-first
Risk: most complex build, GTK4 learning curve, no web-tech UI

## Recommendation for Phase 4 Step 0 Research

This decision cannot be made without prototyping. Phase 4 Step 0 must:
1. Test Architecture A: Tauri + WebKitGTK stability with real sites (a week of daily use)
2. Test Wayland embedding with Playwright Chromium (`--ozone-platform=wayland`)
3. Decide: is Chromium required for Cookie Mine trust signals, or is WebKit acceptable?

If Chromium is required → Architecture B or C
If WebKit is acceptable → Architecture A (simplest, most "Feather")

## Key API: WebContentsView (if Electron is ever reconsidered)
BrowserView was deprecated since Electron 29. Replacement: WebContentsView.
Don't use BrowserView in any future Electron code.

## Sources
- https://tech-insider.org/tauri-vs-electron-2026/
- https://github.com/orgs/tauri-apps/discussions/8524 (WebKitGTK instability)
- https://v2.tauri.app/blog/tauri-20/
- https://www.electronjs.org/blog/migrate-to-webcontentsview
