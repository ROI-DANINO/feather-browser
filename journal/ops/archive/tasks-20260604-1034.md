# Current Tasks — Phase 4 (Visual Desktop Shell)

Checklist only. Current state, recommendation, evidence, parked items → `journal/context/active.md`
(owner). Phase map + exit criteria → `ROADMAP.md`.

Active track: **ADR-0008 Credentials Vault validation** (Spike C done; A/B gate acceptance).

## Open
- [ ] **Spike A — SQLCipher feasibility** (Fedora + Node/TS; raw-key DB; verify DB/WAL/journals/temp don't leak; packaging). Sudo-gated install → Roi.
- [ ] **Spike B — KeePassXC integration** (CLI / Secret Service / KDBX; request-without-storing; approval boundary). Sudo-gated install → Roi.
- [ ] **Productionize attach-don't-launch** into `src/` — `src/browser/modes.ts` has no anti-detection. Spawn Chromium + `connectOverCDP`. Pairs with `FEATHER_CHROMIUM_PATH`. `ui-playground` branch = reference.
- [ ] **`FEATHER_CHROMIUM_PATH`** (sudo: `dnf install chromium`) — also drops the "Chrome for Testing" banner. Env var in `config.ts` + `executablePath` in `modes.ts`.
- [ ] **Deferred — observability sprint:** wire `DebugCapture` (dead code) — `start()` after `setContext`, `finalize()` before `context.close()`, read `debug.trace` in `launch()`.

## Done (current phase — full detail in journal/log.md + ops/sessions/)
- [x] Reshaped `/init` into the phase-boundary ritual (A. Orient / B. Phase wrap / C. Open next) + fixed its stale file list (dropped `PROGRESS.md`; `active.md` as owner; log tail-15).
- [x] Reconciled AGENTS.md (`e6132bd`) — `/init` named as phase-wrap; Change Classification phase-agnostic; stale l.7 goal + l.45 branch comment fixed.
- [x] Spike C — secret-leakage harness shipped (`assertNoSecretLeak` + real-Chromium gate; `redactUrl` strips query+fragment at `TAB_UPDATED` + `network-summary`).
- [x] ADR-0008 CredentialsVault candidate landed (🚧 non-accepted).
- [x] Phase 4 Step 0 — Cookie Mine proven; attach-don't-launch beat bot detection (ADR-0007).
