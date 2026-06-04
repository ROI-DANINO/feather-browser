## Active — Repo organized; next is the credentials-vault ADR candidate

Phase 4 Step 0 is done (Cookie Mine proven on a real site; ADR-0007). The last session was
a **get-organized pass** (no feature code): synced `dev`, built the inbox→archive lifecycle,
graduated `rnd` (ADR-0006), cleaned stale branches, and reconciled the canonical docs. All on
`dev`, pushed to `origin/dev`.

## Next track (recommend the first)

- [ ] **CREDENTIALS-VAULT ADR CANDIDATE — recommended.** Promote the open inbox intake
  (`journal/raw/_inbox/2026-06-04-security-research-credentials-vault.md`) into a
  **non-accepted** `CredentialsVault` ADR candidate in `docs/specs/`. Narrow vault interface;
  KeePassXC (external manager) + SQLCipher (encrypted storage) as first candidates; selection
  NOT final. Scope 3 spikes: leakage harness, KeePassXC integration, SQLCipher feasibility.
  Keep explicitly non-accepted until spikes done. (Prior session attempted this, was blocked.)
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
  which was `rnd`'s competing convention, now dropped). Inbox holds 7 genuinely-open files.
- `rnd` branch deleted (deliverable graduated as ADR-0006). `ui-playground` KEPT as reference.
- ADR-0006 (interface neutrality) is now a standing design lens on `dev`.
- Shell stack is **active R&D** — don't let any doc imply it's locked.
- Anti-detection is spike-only; not in `src/` yet.

## Done

### Organize & housekeeping ✅ (2026-06-04, organize-housekeeping)
- [x] Synced `dev` (was 2 behind origin); inbox→archive lifecycle + swept 12 files
- [x] Graduated `rnd` by cherry-pick (ADR-0006 + ROADMAP reframe); deleted 3 stale branches
- [x] Reconciled canonical docs (specs index, README, PROGRESS). 6 commits pushed.

### Phase 4 Step 0 ✅ (2026-06-04, phase4-step0-cookie-mine)
- [x] ADR-0007; 6 no-install spikes; Cookie Mine proven on real ChatGPT; blog/0006

### Earlier (see ops/sessions/ and archive/)
- [x] S3 Currency & Security · S2 core · S2 design · repo cleanup · Task 6b · S1 Foundation
