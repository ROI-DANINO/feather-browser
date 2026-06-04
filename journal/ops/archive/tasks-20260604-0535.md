## Active — Phase 4 Step 0 DONE; next is security research

Phase 4 Step 0 complete (proven by spikes — Cookie Mine works end-to-end on a real site;
agent acted as Roi in his live ChatGPT). See `docs/specs/adr-0007-phase-4-shell-sequencing.md`
and `journal/ops/sessions/phase4-step0-cookie-mine-20260604-0139.md`.

## Next track (recommend the first)

- [ ] **SECURITY RESEARCH — HIGHEST PRIORITY.** A **highly-secure open-source password
  manager** + a **secure database/storage format** for the future credentials vault (Phase 5).
  Evaluate: threat model, encryption-at-rest, key management, recovery, auditability, license,
  Linux fit. (Roi's explicit next ask; "security is a very high priority.")
- [ ] **Productionize attach-don't-launch** into `src/` — anti-detection lives only in spikes;
  `src/browser/modes.ts` has none. Spawn Chromium normally + `connectOverCDP`
  (`navigator.webdriver=false`). Pairs with `FEATHER_CHROMIUM_PATH`.
- [ ] **`FEATHER_CHROMIUM_PATH`** (sudo, Roi runs `dnf install chromium`) — real Chromium
  binary also drops the cosmetic "Chrome for Testing" banner. Then env var in `config.ts` +
  `executablePath` in `modes.ts`.
- [ ] **Graduate `rnd`** (ADR-0006 + ROADMAP Phase-5 edit) → `dev`. Still parked.
- [ ] **Deferred — observability sprint:** wire `DebugCapture` (dead code) — `start()` after
  `setContext`, `finalize()` before `context.close()`, read `debug.trace` in `launch()`; trace
  e2e.

## Parked (Phase 5; frame as user-authorized continuity, NOT "stealth/bypass")

- **Learned behavioral fidelity** — agent acts with Roi's mouse/typing signature, learned by
  observing real usage.
- **Observe-to-learn** — agent sees Roi's screen on request → understand context; later learn
  workflows from demonstration.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive).
- **Agent perception layer** — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.
- Details: `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Done

### Phase 4 Step 0 ✅ (2026-06-04, phase4-step0-cookie-mine)
- [x] ADR-0007 (defer seamless shell; headed-Chromium stopgap; prove loop first; stack = open R&D)
- [x] 6 no-install spikes: headed Chromium on Wayland; embed-blocker dissolved; Cookie Mine loop;
  bot-detection found; attach-don't-launch beat it; agent sent "hello world" in real ChatGPT
- [x] Insights captured (inbox + 3 memories); real login wiped; blog/0006 published

### Earlier (see ops/sessions/ and archive/)
- [x] S3 Currency & Security · S2 core · S2 design · repo cleanup · Task 6b · S1 Foundation
