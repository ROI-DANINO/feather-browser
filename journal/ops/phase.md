---
phase: phase-4-visual-desktop-shell
sub_phase: step-0-done-cookie-mine-proven
adr: docs/specs/adr-0007-phase-4-shell-sequencing.md
step: "Phase 4 Step 0 complete (proven by spikes); next is security research (credentials vault)"
prior_phase: stabilization-linux-readiness-closed
sessions: ["...s3-currency-security✅", "s3-push-verify✅(ops)", "phase4-step0-cookie-mine✅"]
blocking: null
next: "SECURITY RESEARCH (highest priority): a highly-secure open-source password manager + a secure database/storage format for the future credentials vault (Phase 5). Then: productionize attach-don't-launch into src/; graduate rnd; FEATHER_CHROMIUM_PATH (sudo)."
note: "Phase 4 Step 0 done by SPIKING not speccing. ADR-0007: defer seamless low-latency shell to a later dedicated R&D phase; headed-Chromium STOPGAP now; prove Cookie Mine loop first (DONE). Target end-state = painted-in one-window shell (headless Chromium + screencast + forwarded input) but the IMPLEMENTATION STACK IS OPEN R&D, NOT LOCKED (no commitment to Rust/GTK/Tauri/Zig). 6 no-install spikes on Fedora/Wayland/niri (Playwright 1.60/Chromium 148): (1) Chromium headed native on Wayland, niri tiles it; (2) Wayland-embed blocker dissolved via separate-window/painted-in; (3) Cookie Mine loop on practice site OK; (4) real site → BOT DETECTION (Google/Cloudflare) — src/browser/modes.ts has NO anti-detection; (5) ATTACH-DON'T-LAUNCH (spawn normally + connectOverCDP → navigator.webdriver=false) logged into real ChatGPT no CAPTCHA; (6) agent sent 'hello world' as Roi in his live ChatGPT (authorized), login then wiped. Bot-detection = #1 risk. 'Chrome for Testing' banner is cosmetic (real Chromium binary removes it). rnd graduation deferred (Phase-5 framing). Phase-5 ideas captured: behavioral fidelity, observe-to-learn, detection self-emulation — framed as user-authorized continuity, never stealth/bypass."
---
