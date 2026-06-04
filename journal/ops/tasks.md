## Active — Execute the secret-leakage harness plan (ADR-0008 Spike C)

Phase 4 Step 0 done (ADR-0007). **ADR-0008 CredentialsVault landed** (🚧 non-accepted). **Spike C
is brainstormed, evidence-probed, spec'd, and PLANNED — not built.** All docs on `origin/dev`
(`4ec2e24`). Next session: pick execution mode and implement.

## Next track (recommend the first)

- [ ] **EXECUTE `docs/plans/2026-06-04-secret-leakage-harness.md` — recommended.** 4 tasks, TDD,
  full code in the plan. **Subagent-driven mode recommended** (fresh agent/task, review between).
  - Task 1 — `assertNoSecretLeak` detector (`tests/helpers/leak-scan.ts`) + red/green unit tests.
  - Task 2 — harden `redactUrl` (strip query+fragment) + apply at `manager.ts:159` &
    `capture.ts:44,55`. **Fixes a real shipping URL leak** (decision A).
  - Task 3 — hermetic fixture + e2e gate on real Chromium (autofill + URL vectors).
  - Task 4 — mark Spike C done; keep ADR-0008 **non-accepted** (Spikes A/B remain).
- [ ] **Spike A — SQLCipher feasibility** (Fedora + Node/TS; raw-key DB; verify DB/WAL/journals/temp
  don't leak; packaging). **Sudo-gated install → Roi.**
- [ ] **Spike B — KeePassXC integration** (CLI / Secret Service / KDBX; request-without-storing;
  approval boundary). **Sudo-gated install → Roi.**
- [ ] **Productionize attach-don't-launch** into `src/` — anti-detection lives only in spikes;
  `src/browser/modes.ts` has none. Spawn Chromium normally + `connectOverCDP`. Pairs with
  `FEATHER_CHROMIUM_PATH`. `ui-playground` branch has reference stealth experiments.
- [ ] **`FEATHER_CHROMIUM_PATH`** (sudo, Roi runs `dnf install chromium`) — also drops the cosmetic
  "Chrome for Testing" banner. Env var in `config.ts` + `executablePath` in `modes.ts`.
- [ ] **Deferred — observability sprint:** wire `DebugCapture` (dead code) — `start()` after
  `setContext`, `finalize()` before `context.close()`, read `debug.trace` in `launch()`.

## Evidence to honor (research-driven, not arrogance-driven)

`research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`: traces leak off-screen
secrets (`fill()` arg + POST body) → off-by-default policy, not redaction; `network-summary`
records URLs only, never POST bodies; password fields protect nothing at the data layer;
screenshots leak visually but are text-invisible → policy, not OCR.

## Parked (Phase 5; frame as user-authorized continuity, NOT "stealth/bypass")

- **Sensitive-session flag + no-trace policy; mediated late credential release** (the trace/
  screenshot mitigation deferred from Spike C).
- **Learned behavioral fidelity** — agent acts with Roi's mouse/typing signature.
- **Observe-to-learn** — agent sees Roi's screen on request → understand context; learn workflows.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive).
- **Agent perception layer** — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.
- Details: `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Done

### Credentials-vault ADR + leakage spike planned ✅ (2026-06-04, credentials-vault-leakage-spike)
- [x] ADR-0008 CredentialsVault candidate (🚧 non-accepted); indexed; intake archived
- [x] Spike C: throwaway evidence probe → findings; design spec + TDD plan. **Code NOT written.**
- [x] redactUrl found dead + query/fragment-leaky; fix designed (decision A). 3 commits pushed.

### Organize & housekeeping ✅ (2026-06-04, organize-housekeeping)
- [x] Synced `dev`; inbox→archive lifecycle + swept 12 files
- [x] Graduated `rnd` → ADR-0006 + ROADMAP reframe; deleted 3 stale branches
- [x] Reconciled canonical docs (specs index, README, PROGRESS). 6 commits pushed.

### Phase 4 Step 0 ✅ (2026-06-04, phase4-step0-cookie-mine)
- [x] ADR-0007; 6 no-install spikes; Cookie Mine proven on real ChatGPT; attach-don't-launch
- [x] Insights captured; real login wiped; blog/0006 published

### Earlier (see ops/sessions/ and archive/)
- [x] S3 Currency & Security · S2 core · S2 design · repo cleanup · Task 6b · S1 Foundation
