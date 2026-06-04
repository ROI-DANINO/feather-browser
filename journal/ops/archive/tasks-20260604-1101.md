# Current Tasks — Phase 4 (Visual Desktop Shell)

Checklist only. Current state, recommendation, evidence, parked items → `journal/context/active.md`
(owner). Phase map + exit criteria → `ROADMAP.md`.

Active track: **ADR-0008 Credentials Vault validation** (Spike C done; A/B gate acceptance).

## Open — pre-shell infrastructure sequence (locked 2026-06-04; must precede the GUI)
1. [ ] **Storage-isolation fix (CRITICAL — currently violated):** `src/config.ts` defaults `featherDir` to repo-relative `.feather`, not gitignored. Relocate profile/cookies/vault → `~/.config` / `~/.local/share`, gitignore, never inside the workspace. Enforces the Agent-Blind Vault boundary.
2. [ ] **Productionize attach-don't-launch** into `src/` — `src/browser/modes.ts` has no anti-detection. Spawn Chromium + `connectOverCDP`. Pairs with `FEATHER_CHROMIUM_PATH`. `ui-playground` branch = reference.
3. [ ] **`FEATHER_CHROMIUM_PATH`** (sudo: `dnf install chromium`) — also drops the "Chrome for Testing" banner. Env var in `config.ts` + `executablePath` in `modes.ts`.
4. [ ] **Warmed persistent Google session on disk** — long-running primary authenticated context (Cookie Mine foundation); single-click Google Auth, agent blind, Feather injects under the hood.
5. [ ] **Observability sprint:** wire `DebugCapture` (dead code) — `start()` after `setContext`, `finalize()` before `context.close()`, read `debug.trace` in `launch()`.
6. [ ] **Prove end-to-end Cookie Mine loop on the headed-Chromium stopgap** (ADR-0007 gate) — *then* design the Visual Desktop Shell GUI.

## Open — vault track (frozen; architecture stands)
- [ ] **Spike A — SQLCipher feasibility** (Fedora + Node/TS; raw-key DB; verify DB/WAL/journals/temp don't leak; packaging). Sudo-gated install → Roi. **Frozen.**
- [ ] **Spike B — KeePassXC integration** (CLI / Secret Service / KDBX; request-without-storing; approval boundary). Sudo-gated install → Roi. **Frozen.**

## Done (current phase — full detail in journal/log.md + ops/sessions/)
- [x] Token Diet finished — Step 1 `.remember` plugin lobotomy (journal = sole engine) + Step 2 ROADMAP collapse (Phase 5+ → `archive/roadmap-future.md`); ~5,037 → ~3,635 tok projected.
- [x] Reshaped `/init` into the phase-boundary ritual (A. Orient / B. Phase wrap / C. Open next) + fixed its stale file list (dropped `PROGRESS.md`; `active.md` as owner; log tail-15).
- [x] Reconciled AGENTS.md (`e6132bd`) — `/init` named as phase-wrap; Change Classification phase-agnostic; stale l.7 goal + l.45 branch comment fixed.
- [x] Spike C — secret-leakage harness shipped (`assertNoSecretLeak` + real-Chromium gate; `redactUrl` strips query+fragment at `TAB_UPDATED` + `network-summary`).
- [x] ADR-0008 CredentialsVault candidate landed (🚧 non-accepted).
- [x] Phase 4 Step 0 — Cookie Mine proven; attach-don't-launch beat bot detection (ADR-0007).
