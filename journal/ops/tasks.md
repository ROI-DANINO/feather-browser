# Current Tasks — Phase 4 (Visual Desktop Shell)

Checklist only. Current state, recommendation, evidence, parked items → `journal/context/active.md`
(owner). Phase map + exit criteria → `ROADMAP.md`.

Active track: **ADR-0008 Credentials Vault validation** (Spike C done; A/B gate acceptance).

## Open — pre-shell infrastructure sequence (locked 2026-06-04; must precede the GUI)
1. [x] **Storage-isolation fix — DONE** (XDG split shipped + `.feather/` gitignored; pushed `dev` `cbe939e..13101ff`). profiles/vault→DATA, logs/debug/measurements→STATE, disposable→CACHE, token→RUNTIME. Enforces the Agent-Blind Vault boundary.
2. [x] **Productionize attach-don't-launch — DONE** — `chromium-headed-cdp` mode: `spawnAndConnect()` spawns Chromium (no automation flags) + `connectOverCDP`; `navigator.webdriver === false`; child killed on close. 167u+35i green; pushed `dev`; PR #1 (dev→master). Pairs with #3.
3. [x] **`FEATHER_CHROMIUM_PATH` — DONE** — chromium installed (`148.0.7778.215`, Fedora updates); `resolveChromiumExecutable()` in `config.ts` + wired into `spawnAndConnect()` via `manager.launch`. Guarded real-Chromium probe proves the system build runs (CDP version `.215`, not bundled `.96`) with `webdriver===false`. 175u+37i green; pushed `dev` `6e4f099`.
4. [x] **Warmed persistent Google session on disk — DONE (verified end-to-end 2026-06-04).** `npm run warm-session` (`src/tools/warm-session.ts`) launches the `primary` persistent workspace in stealth `chromium-headed-cdp` against system Chromium 148 (`/usr/bin/chromium-browser`); Roi logged into real Google (passkey/Face-ID new-device flow — **no bot-block/CAPTCHA**), Ctrl-C finalized, **relaunch landed already logged in** (no password prompt). Both acceptance halves met: persistence + un-flagged. Agent-blind preserved (Roi typed creds; Feather never saw them). **Sequencing chosen: warm first, cookie-isolation spike as non-blocking follow-on** (safe — no agent acts in Phase 4). **NEW DATA for the spike:** the login was device-bound (passkey), so DBSC is live → copy-to-isolated-context is the real open question.
5. [x] **Observability sprint — DONE** (out of order; didn't depend on #4) — `DebugCapture` wired: instantiate+`start()` in `launch()` when `input.debug` set (was accepted-but-ignored), `finalize()` before `context.close()` in `close()` (best-effort; `debug.capture.finalize.failed` event). Real-Chromium e2e proves a valid `trace.zip` (PK bytes) + `network-summary.jsonl` land in the debug dir. Closes the S2-deferred "Trace e2e + DebugCapture wiring" gap. Pushed `dev` `46c946e`.
6. [ ] **Prove end-to-end Cookie Mine loop on the headed-Chromium stopgap** (ADR-0007 gate) — *then* design the Visual Desktop Shell GUI.

## Open — Cookie-Mine hardening (before any agent action; Phase 4→5 gate)
- [ ] **`warm-session` must disable Chromium's built-in password manager by policy** — keep raw
  creds out of the shared jar (`credentials_enable_service=false` / `PasswordManagerEnabled` policy
  on the `primary` profile). Surfaced 2026-06-04: Chrome offered to save passwords into the warm
  profile (several saved then cleared via `chrome://password-manager`; the disable toggle wasn't
  found in-UI, hence enforce by policy). Creds belong in Proton Pass now / Feather vault later,
  separate from the profile agents piggyback on. Dormant in Phase 4; **must land before the first
  agent action.** Detail: ADR-0008 → "Real-world corollary".
- [ ] **Cookie-isolation spike** (next; design safely) — copy the warm Google cookies into a fresh
  isolated context; verify auth survives **and** stays un-flagged. ⚠️ Risk: two simultaneous live
  sessions from cloned cookies can look like session theft → could flag/invalidate the freshly
  warmed `primary` session. Design the spike to protect it (read-only first / snapshot / throwaway)
  rather than firing blindly. NEW signal: the login is **device-bound (passkey/Face-ID)** → DBSC is
  live, so copy-to-isolated is the real open question. Procedure:
  `research/2026-06-04-cookie-jar-isolation-and-phase5-sequencing.md` → "Queued action".

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
