# Current Tasks — Phase 4 (Visual Desktop Shell)

Checklist only. Current state, recommendation, evidence, parked items → `journal/context/active.md`
(owner). Phase map + exit criteria → `ROADMAP.md`.

Active track: **Master merge-readiness** (Roi, 2026-06-04) — `dev` is 110 commits ahead of `master`;
PR #1 (dev→master) OPEN. Decide if this is a stable milestone to graduate. Pre-shell #1–5 all done;
only #6 (prove end-to-end Cookie Mine loop) remains before the GUI.

## Next — master merge-readiness (immediate)
- [x] **Full verification pass — DONE GREEN (2026-06-04 23:24).** Unit **175/175**, integration (real
  Chromium) **37/37**, measurement **4/4**, `tsc --noEmit` exit 0, `tsc` build exit 0, tree clean. Prod
  dep audit (`--omit=dev`) **0 vulns** (5 audit vulns are dev-only test tooling, never shipped).
- [x] **Reviewed the 111-commit `master..dev` delta — coherent.** Linear (no merges), no
  wip/revert/fixup markers; +1637/−75 across 31 src/test files; all maps to S1–S3 + storage isolation
  + attach-cdp + chromium-path + observability + warm-session. No TODO/FIXME/HACK in src; the one
  `it.skip` is a conditional system-Chromium guard that actually ran. **Verdict: stable milestone.**
- [x] **CI added (`3863da9`) + gating fix** — `.github/workflows/ci.yml` (full suite, ubuntu/Node 22).
  First run RED → surfaced the hardcoded-Wayland `spawnAndConnect` bug; fixed by env-gating the 2
  headed tests (`attach-cdp`, `system-chromium`) on `WAYLAND_DISPLAY` → CI 35 passed + 2 skipped.
  Docs corrected to match. Node pinned (`engines>=20` + `.nvmrc`). README counts 137→175/33→37.
- [ ] **Decide + (if go) merge PR #1** — graduate `dev` → `master`. **CI now gates the PR — confirm
  green (35 passed + 2 Wayland-gated skips) before merging.** Evidence supports it; **held as Roi's
  milestone call** (not auto-merged). PR #1 OPEN · MERGEABLE · not draft; title full-scope.

## Open — pre-shell infrastructure sequence (locked 2026-06-04; must precede the GUI)
1. [x] **Storage-isolation fix — DONE** (XDG split shipped + `.feather/` gitignored; pushed `dev` `cbe939e..13101ff`). profiles/vault→DATA, logs/debug/measurements→STATE, disposable→CACHE, token→RUNTIME. Enforces the Agent-Blind Vault boundary.
2. [x] **Productionize attach-don't-launch — DONE** — `chromium-headed-cdp` mode: `spawnAndConnect()` spawns Chromium (no automation flags) + `connectOverCDP`; `navigator.webdriver === false`; child killed on close. 167u+35i green; pushed `dev`; PR #1 (dev→master). Pairs with #3.
3. [x] **`FEATHER_CHROMIUM_PATH` — DONE** — chromium installed (`148.0.7778.215`, Fedora updates); `resolveChromiumExecutable()` in `config.ts` + wired into `spawnAndConnect()` via `manager.launch`. Guarded real-Chromium probe proves the system build runs (CDP version `.215`, not bundled `.96`) with `webdriver===false`. 175u+37i green; pushed `dev` `6e4f099`.
4. [x] **Warmed persistent Google session on disk — DONE (verified end-to-end 2026-06-04).** `npm run warm-session` (`src/tools/warm-session.ts`) launches the `primary` persistent workspace in stealth `chromium-headed-cdp` against system Chromium 148 (`/usr/bin/chromium-browser`); Roi logged into real Google (passkey/Face-ID new-device flow — **no bot-block/CAPTCHA**), Ctrl-C finalized, **relaunch landed already logged in** (no password prompt). Both acceptance halves met: persistence + un-flagged. Agent-blind preserved (Roi typed creds; Feather never saw them). **Sequencing chosen: warm first, cookie-isolation spike as non-blocking follow-on** (safe — no agent acts in Phase 4). **NEW DATA for the spike:** the login was device-bound (passkey), so DBSC is live → copy-to-isolated-context is the real open question.
5. [x] **Observability sprint — DONE** (out of order; didn't depend on #4) — `DebugCapture` wired: instantiate+`start()` in `launch()` when `input.debug` set (was accepted-but-ignored), `finalize()` before `context.close()` in `close()` (best-effort; `debug.capture.finalize.failed` event). Real-Chromium e2e proves a valid `trace.zip` (PK bytes) + `network-summary.jsonl` land in the debug dir. Closes the S2-deferred "Trace e2e + DebugCapture wiring" gap. Pushed `dev` `46c946e`.
6. [x] **Prove end-to-end Cookie Mine loop on the headed-Chromium stopgap (ADR-0007 gate) — DONE
   (2026-06-05).** Agent-style Feather session on the human-warmed `scratch` context, no login,
   read account email + loaded real Gmail inbox (132 msgs), `webdriver===false`. LOOP CLOSED →
   **GUI design can begin.** Evidence: `research/2026-06-05-cookie-mine-loop-demo.md`.

## Open — Cookie-Mine hardening (before any agent action; Phase 4→5 gate)
- [x] **`warm-session` disables Chromium's built-in password manager by policy — DONE
  (2026-06-05).** `src/browser/profile-policy.ts` `disablePasswordManager()` merges
  `credentials_enable_service=false` + `profile.password_manager_enabled=false` into the profile's
  `Default/Preferences` (merge-not-clobber, no sudo) before `warm-session` launch. Verified on
  `scratch`: both keys persisted through a full Chromium launch+finalize, profile name preserved,
  42 google cookies survived. Full "no save-password bubble" confirmation deferred to the next real
  login. Creds belong in a vault, separate from the jar agents piggyback on.
- [x] **Cookie-isolation spike — DONE on `scratch` (2026-06-05).** Measured scratch is **NOT DBSC
  device-bound** (full auth+rotation cookies, no on-disk bound-session store). Cloned cookies into a
  fresh isolated context → **auth survived**, original session **not invalidated** (no session
  theft). So copy-to-isolated is viable+safe for non-device-bound sessions. Findings:
  `research/2026-06-05-cookie-isolation-spike-findings.md`. ⚠️ **Does NOT transfer to `primary`**
  (passkey-warmed, possibly DBSC) — JOINT CALL: measure `primary`'s binding read-only FIRST, never a
  blind clone on the real jar.

## Open — tooling / tech-debt (post-merge; non-blocking)
- [x] **Make `--ozone-platform` configurable + un-gate the 2 headed tests — DONE (2026-06-05).**
  `resolveSpawnExtraArgs()` in `src/browser/modes.ts` drives `--ozone-platform` / `--headless=new` /
  `--no-sandbox` from env (`FEATHER_OZONE_PLATFORM`, `WAYLAND_DISPLAY`, `FEATHER_SPAWN_HEADLESS`,
  `FEATHER_SPAWN_NO_SANDBOX`); the hardcoded wayland arg is gone. `attach-cdp` now runs on CI by
  attaching over CDP to `--headless=new` + `--no-sandbox` (the anti-detection gate is CI-verified).
  `system-chromium` is **skipped on CI** (`process.env.CI`) because ubuntu's `/usr/bin/chromium` is a
  snap that doesn't expose CDP under headless+no-sandbox (finding) — it runs every local run on the
  real binary. **CI green: 36 passed + 1 skipped; local Wayland 37.** TDD: `modes-ozone.test.ts` (7).
- [x] **Bump `vitest` `^2` → `^4` + clear the dev-tooling audit — DONE (2026-06-05).** Jumped to
  `4.1.8`. The three `vitest.*.config.ts` needed **no** changes (vanilla). One v4 breaking change: a
  `vi.fn()` mock used with `new` must be `function`/`class` not arrow (`debug-bundle.test.ts`
  DebugBundle mock) — fixed. All suites green (184u+37i+4m, typecheck 0); **`npm audit` now 0** (full
  and `--omit=dev`) — the entire `esbuild←vite←vitest` dev-chain advisory set is cleared. CI green.

## Open — vault track (frozen; architecture stands)
- [ ] **Spike A — SQLCipher feasibility** (Fedora + Node/TS; raw-key DB; verify DB/WAL/journals/temp don't leak; packaging). Sudo-gated install → Roi. **Frozen.**
- [ ] **Spike B — KeePassXC integration** (CLI / Secret Service / KDBX; request-without-storing; approval boundary). Sudo-gated install → Roi. **Frozen.**

## Done (current phase — full detail in journal/log.md + ops/sessions/)
- [x] **Pre-shell #3 `FEATHER_CHROMIUM_PATH` shipped** — `resolveChromiumExecutable()` + wiring; guarded system-Chromium probe. Pushed `dev` `6e4f099`.
- [x] **Pre-shell #5 observability shipped** — `DebugCapture` wired into launch/close; real-Chromium trace.zip e2e. Pushed `dev` `46c946e`.
- [x] **Tech-debt cleanups (storage-isolation follow-ons)** — `MeasurementRunner` routed through `FeatherPaths` (`5ba2fe8`); api-flow dead `.feather` strip replaced with an absolute-path contract assertion (`8884e7a`). Both were open threads in `journal/context/next.md`.
- [x] Storage-isolation fix **shipped** — XDG split implemented + `.feather/` gitignored; pushed `dev` (`cbe939e..13101ff`). Spec `5f8f4e7` + plan `0fa0b8a`.
- [x] **Attach-don't-launch (pre-shell #2) shipped** — `chromium-headed-cdp` mode (`spawnAndConnect` + CDP attach; `navigator.webdriver===false`; child killed on close); 167u+35i green; pushed `dev`; PR #1. Spec `33c0470` + plan `605f0e3`.
- [x] `.remember` lobotomy **verified working** — needed a full CC restart (not `/clear`); plugin hooks load at launch. Config was correct.
- [x] Token Diet finished — Step 1 `.remember` plugin lobotomy (journal = sole engine) + Step 2 ROADMAP collapse (Phase 5+ → `archive/roadmap-future.md`); ~5,037 → ~3,635 tok projected.
- [x] Reshaped `/init` into the phase-boundary ritual (A. Orient / B. Phase wrap / C. Open next) + fixed its stale file list (dropped `PROGRESS.md`; `active.md` as owner; log tail-15).
- [x] Reconciled AGENTS.md (`e6132bd`) — `/init` named as phase-wrap; Change Classification phase-agnostic; stale l.7 goal + l.45 branch comment fixed.
- [x] Spike C — secret-leakage harness shipped (`assertNoSecretLeak` + real-Chromium gate; `redactUrl` strips query+fragment at `TAB_UPDATED` + `network-summary`).
- [x] ADR-0008 CredentialsVault candidate landed (🚧 non-accepted).
- [x] Phase 4 Step 0 — Cookie Mine proven; attach-don't-launch beat bot detection (ADR-0007).
