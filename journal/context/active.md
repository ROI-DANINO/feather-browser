## Active — ADR-0008 landed + Spike C planned; next is EXECUTING the leakage-harness plan

Phase 4 Step 0 is done (Cookie Mine proven; ADR-0007). The **`CredentialsVault` ADR candidate
landed** as `docs/specs/adr-0008-credentials-vault.md` (🚧 non-accepted). **Spike C (secret-leakage
harness) is fully brainstormed, evidence-probed, spec'd, and planned — but NOT yet built.** A
throwaway probe established what actually leaks (see desk context + `research/2026-06-04-
credentials-vault-spike-c-leakage-probe-findings.md`). Design: `docs/specs/2026-06-04-secret-
leakage-harness-design.md`. Plan: `docs/plans/2026-06-04-secret-leakage-harness.md`. 3 commits on
`origin/dev` (`b0f869e`/`b14ee8f`/`4ec2e24`) — all docs, **no code yet**.

## Next track (recommend the first)

- [ ] **EXECUTE THE LEAKAGE-HARNESS PLAN — recommended.** Implement
  `docs/plans/2026-06-04-secret-leakage-harness.md`, Tasks 1→4 (TDD, full code in the plan).
  Roi was about to pick execution mode at pause — **subagent-driven recommended** (fresh agent
  per task, review between). Task 2 fixes a real shipping leak (`redactUrl` query+fragment strip
  applied at `manager.ts:159` + `capture.ts:44,55`). Keeps ADR-0008 non-accepted (Spikes A/B left).
- [ ] **Spikes A + B (after C)** — **Spike A** SQLCipher feasibility on Fedora + Node/TS (raw-key
  encrypted DB; verify DB/WAL/journals/temp don't leak; packaging). **Spike B** KeePassXC
  integration (CLI / Secret Service / KDBX; request-without-storing; approval boundary). **Both
  have sudo-gated installs → hand to Roi.**
- [ ] **Productionize attach-don't-launch** into `src/` — anti-detection lives only in spikes;
  `src/browser/modes.ts` has none. Spawn Chromium normally + `connectOverCDP`
  (`navigator.webdriver=false`). Pairs with `FEATHER_CHROMIUM_PATH`. `ui-playground` branch
  has reference stealth experiments.
- [ ] **`FEATHER_CHROMIUM_PATH`** (sudo, Roi runs `dnf install chromium`) — real Chromium
  binary also drops the cosmetic "Chrome for Testing" banner. Env var in `config.ts` +
  `executablePath` in `modes.ts`.
- [ ] **Deferred — observability sprint:** wire `DebugCapture` (dead code) — `start()` after
  `setContext`, `finalize()` before `context.close()`, read `debug.trace` in `launch()`.

## Parked (Phase 5; frame as user-authorized continuity, NOT "stealth/bypass")

- **Learned behavioral fidelity** — agent acts with Roi's mouse/typing signature.
- **Observe-to-learn** — agent sees Roi's screen on request → understand context; later learn
  workflows from demonstration.
- **Detection self-emulation** — model sites' bot-ID techniques to find weak spots (defensive).
- **Agent perception layer** — `research/2026-06-03-phase-5-agent-perception-layer-notes.md`.
- Details: `journal/raw/_inbox/2026-06-04-session-insights-behavioral-fidelity-security.md`.

## Flags

- Inbox lifecycle is live: promoted/superseded notes → `journal/raw/archive/` (NOT `_processed/`,
  which was `rnd`'s competing convention, now dropped). Inbox holds 6 genuinely-open files
  (credentials-vault intake archived on promotion to ADR-0008).
- ADR-0008 is the first **non-accepted** ADR in `docs/specs/` — the index marks it 🚧 CANDIDATE.
  Don't let any doc imply KeePassXC/SQLCipher are selected or that the vault backend is locked.
- `rnd` branch deleted (deliverable graduated as ADR-0006). `ui-playground` KEPT as reference.
- ADR-0006 (interface neutrality) is now a standing design lens on `dev`.
- Shell stack is **active R&D** — don't let any doc imply it's locked.
- Anti-detection is spike-only; not in `src/` yet.

## Done

### Credentials-vault ADR + leakage spike planned ✅ (2026-06-04, credentials-vault-leakage-spike)
- [x] `docs/specs/adr-0008-credentials-vault.md` (🚧 non-accepted): interface-first, local-first,
  "not a password manager"; KeePassXC + SQLCipher candidates (not selections); 3-spike gate (C→A/B)
- [x] Indexed in specs README with CANDIDATE marker; archived source intake to `journal/raw/archive/`
- [x] Spike C: ran a throwaway evidence probe → findings in `research/2026-06-04-credentials-vault-
  spike-c-leakage-probe-findings.md`; wrote design spec + TDD plan. **Code NOT yet written.**

### Organize & housekeeping ✅ (2026-06-04, organize-housekeeping)
- [x] Synced `dev` (was 2 behind origin); inbox→archive lifecycle + swept 12 files
- [x] Graduated `rnd` by cherry-pick (ADR-0006 + ROADMAP reframe); deleted 3 stale branches
- [x] Reconciled canonical docs (specs index, README, PROGRESS). 6 commits pushed.

### Phase 4 Step 0 ✅ (2026-06-04, phase4-step0-cookie-mine)
- [x] ADR-0007; 6 no-install spikes; Cookie Mine proven on real ChatGPT; blog/0006

### Earlier (see ops/sessions/ and archive/)
- [x] S3 Currency & Security · S2 core · S2 design · repo cleanup · Task 6b · S1 Foundation
