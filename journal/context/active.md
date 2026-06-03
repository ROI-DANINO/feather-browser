## Active — Phase 4 Step 0 DONE (Cookie Mine proven on a real site); next is security research

**Phase 4 Step 0 is complete** — done by *spiking*, not speccing. On `dev` (tracking commit at
stop). The big unknowns are answered by observation, and the product thesis breathed for the
first time: the agent logged into Roi's **real ChatGPT** and **sent a message as him**.

### What we proved (6 no-install spikes; Fedora/Wayland/niri, Playwright 1.60 / Chromium 148)
- Headed Chromium runs **natively on Wayland**; niri tiles it (app can't self-place).
- The Wayland-embedding blocker is **dissolved** (tiling + headless painted-in model).
- Cookie Mine loop works: an agent tab (`context.newPage` == `openTab`) inherits the human
  session — confirmed on a practice site AND on real ChatGPT.
- **Bot-detection is the #1 risk.** A naked Playwright-launched browser got walled by Google +
  Cloudflare. Fix: **attach, don't launch** (spawn Chromium normally, `connectOverCDP` →
  `navigator.webdriver=false`) → logged into ChatGPT with no CAPTCHA.
- Agent sent "hello world" in Roi's live ChatGPT (authorized). Login then wiped from disk.

### Decisions (ADR-0007)
- Defer the seamless low-latency shell to a later **dedicated R&D phase**; **headed-Chromium
  stopgap** now; **prove the loop first** (done).
- Target end-state = "painted-in" one-window shell — but the **implementation stack is open
  R&D, not locked** (no commitment to Rust/GTK/Tauri/Zig).
- `rnd` graduation deferred (Phase-5 framing, doesn't touch the shell).

## Next track (recommend the first)

- [ ] **SECURITY RESEARCH (highest priority):** a **highly-secure open-source password manager**
  + a **secure database/storage format** for the future credentials vault (Phase 5). Threat
  model, encryption-at-rest, key management, auditability, license. (Roi's explicit next ask.)
- [ ] **Productionize attach-don't-launch** into `src/` (anti-detection lives only in spikes
  now; `src/browser/modes.ts` has none). Pairs with `FEATHER_CHROMIUM_PATH` (real Chromium
  binary → also drops the "Chrome for Testing" banner; sudo, Roi runs).
- [ ] **Graduate `rnd`** (ADR-0006 + ROADMAP Phase-5 edit) → `dev`. Still parked.

## Ideas parked (Phase 5; frame as user-authorized continuity, never "stealth/bypass")

- Learned **behavioral fidelity** (agent acts with Roi's mouse/typing signature).
- **Observe-to-learn** (agent sees Roi's screen on request → understand context, later learn
  workflows from demonstration).
- **Detection self-emulation** (model sites' bot-ID to find weak spots; defensive self-test).
- Agent perception layer (Actionable Tree / a11y-tree) — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.

Details: `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Flags

- Shell stack is **active R&D** — don't let any doc imply it's locked.
- Anti-detection is spike-only; not in `src/` yet.
- "Chrome for Testing" banner is cosmetic (real Chromium binary removes it).
