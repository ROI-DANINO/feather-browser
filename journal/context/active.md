## Active — Credentials-vault ADR candidate landed; next is the validation-gate spikes

Phase 4 Step 0 is done (Cookie Mine proven on a real site; ADR-0007). The **`CredentialsVault`
ADR candidate has landed** as `docs/specs/adr-0008-credentials-vault.md` (🚧 non-accepted;
interface-first, local-first; KeePassXC + SQLCipher as *candidates*, not selections); the source
intake is archived. Before that, an organize pass synced `dev`, built the inbox→archive
lifecycle, graduated `rnd` (ADR-0006), and reconciled the canonical docs.

## Next track (recommend the first)

- [ ] **ADR-0008 VALIDATION-GATE SPIKES — recommended.** Three spikes must clear before ADR-0008
  can be Accepted. Recommended order **C → A/B**: **Spike C** secret-leakage harness (seed a
  synthetic secret; run a browser action + debug bundle/logs/screenshots/traces; grep all
  outputs; fail hard on any leak — also hardens existing surfaces and is the standing pre-merge
  gate); **Spike A** SQLCipher feasibility on Fedora + Node/TS (encrypted DB in raw-key mode;
  verify DB/WAL/journals/temp don't leak plaintext; packaging); **Spike B** KeePassXC
  integration (CLI / Secret Service / KDBX library; request-without-storing; approval boundary).
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

### Credentials-vault ADR candidate ✅ (2026-06-04)
- [x] Wrote `docs/specs/adr-0008-credentials-vault.md` (🚧 non-accepted): interface-first,
  local-first, "not a password manager"; KeePassXC + SQLCipher as candidates (not selections);
  leakage-first hard rule; 3-spike validation gate (C→A/B)
- [x] Indexed in specs README with CANDIDATE marker; archived source intake to `journal/raw/archive/`

### Organize & housekeeping ✅ (2026-06-04, organize-housekeeping)
- [x] Synced `dev` (was 2 behind origin); inbox→archive lifecycle + swept 12 files
- [x] Graduated `rnd` by cherry-pick (ADR-0006 + ROADMAP reframe); deleted 3 stale branches
- [x] Reconciled canonical docs (specs index, README, PROGRESS). 6 commits pushed.

### Phase 4 Step 0 ✅ (2026-06-04, phase4-step0-cookie-mine)
- [x] ADR-0007; 6 no-install spikes; Cookie Mine proven on real ChatGPT; blog/0006

### Earlier (see ops/sessions/ and archive/)
- [x] S3 Currency & Security · S2 core · S2 design · repo cleanup · Task 6b · S1 Foundation
