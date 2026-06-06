# Current Tasks — Phase 4 (4a Core-readiness SHIPPED → 4b Visual Desktop Shell)

Checklist only. Current state, recommendation, evidence, parked items → `journal/context/active.md`
(owner). Phase map + exit criteria → `ROADMAP.md`.

Active track: **Phase 4a SHIPPED (2026-06-05) AND GRADUATED to `master`** (2026-06-06, PR #2
`5e808cd`). Next = build the **HERO DEMO** (ChatGPT→Gmail cross-site agentic flow) → record → LinkedIn
debut → then **Phase 4b** (shell). State owner: `journal/context/active.md`.

## Next — HERO DEMO for the debut (immediate; Roi's 2026-06-06 call)
Roi: *"go to chatGPT and say hello world and send it, copy gpts respond, then go to gmail and start a
draft mail to anthropic with gpts answer as the respond."* Flow: ChatGPT → type "hello world" → send →
wait for + extract GPT reply → Gmail → start a **draft** to Anthropic with that reply (draft, NOT send).
**Replaces "just a screenshot" as the LinkedIn debut centerpiece.** Full prep:
`ops/sessions/master-merge-and-hero-demo-vision-20260606-1620.md`.

**✅ CORE GATE CLOSED (2026-06-06)** — input/wait commands shipped on `dev` via
`docs/plans/2026-06-06-core-input-commands.md` (10 commits `cae8ef7`..`684396d`). Fresh final gate:
207 unit + 43 integration + `tsc --noEmit` exit 0.

- [x] **Build Core input commands** — `click`, `type`(fill/sequential), `press`(Enter). **GATING:**
  moved Feather observe-only → **act**.
- [x] **Build a wait-for-stable / wait-for primitive** — `wait` command, two flavours (element-state +
  site-agnostic `until:"stable"` with non-empty guard for ChatGPT streaming).
- [x] **Warm a ChatGPT session** — DONE. Warmed into the `primary` profile (agent-blind; Roi typed
  creds). `primary` now holds both Google/Gmail + ChatGPT logins in one jar.
- [x] **Write the headed cross-site demo script** — DONE + **verified working live** (Roi: "it works").
  `scripts/demo/hero-chatgpt-gmail.ts` (`d1b5718`) drives `primary` headed through ChatGPT (type
  `hello world` → send → wait-stable on last answer → read reply) → Gmail (compose draft to Anthropic
  with the reply, **stop before send**). Resilient fallback selectors (EN+HE Gmail), draft-not-send,
  browser kept open on failure, no screenshots/cookies in repo. Spec/plan:
  `docs/specs|plans/2026-06-06-hero-demo-workflow*.md`. Gates: 212 unit (incl. 5 demo-helper tests) + tsc 0.
- [x] **Decide: hero demo = SECOND demo, not a replacement for `quickstart.sh`.** Confirmed — spec
  states `quickstart.sh` stays the public no-login demo; this is the recorded debut workflow.
- [ ] **LinkedIn debut** — record the live run (screen-capture while the script drives the headed
  window), final README touch-ups, then post. *Only step left.*

## Done — milestone graduation `dev`→`master` (2026-06-06; PR #2 `5e808cd`)
- [x] **Re-verified stable before merging** — 184u + tsc 0; no `src/`/`tests/` changes since last full
  integration green (37i + 4m at `16f5ab7`), so that holds. Caught local `master` was stale (115 behind
  origin; PR #1 already merged on GitHub) → worked against `origin/master`; real delta = 37 commits.
- [x] **Committed leftover Anchor bridge notes to `dev`** (`9c91f42`) for a clean tree.
- [x] **Created + merged PR #2** (`gh`, merge commit) → `origin/master` `5e808cd`;
  `origin/master..origin/dev` = 0; local `master` fast-forwarded. Recorded milestone (`7444577`).

## Done — Phase 4a: Core open-source readiness (2026-06-05; SHIPPED)
- [x] **Runnable public demo** — `examples/quickstart.sh` + `examples/README.md`; full session loop ran
  green against a live server (8/8 `state=closed`); friendly non-JSON error handling. `8d42aab`, `b7d9469`.
- [x] **Artifact-forward README** — what it is / who / see-it-work / honest limits / for-AI-agents /
  built-in-the-open; fixed `:3000` + `.feather/token` doc bugs; dropped unimplemented "screenshots"
  claim. `d87e071`, `3aa1d9d`.
- [x] **ROADMAP Core-vs-Shell split** + Phase 4a→4b sequencing. `d921304`.
- [x] **Steering files → Phase 4a** (`tasks.md`/`active.md`/`phase.md`). `c0137f3`.
- [x] **Final gate** — 184 unit pass, tsc 0, demo re-verified green; SHIP log line. `16f5ab7`.
  Blog `0009-the-demo-that-fact-checked-me.md`. Each task double-reviewed (spec then quality); final
  holistic review = READY TO SHIP, 5/5 acceptance criteria MET.

## Next — Phase 4b: Visual Desktop Shell (after debut)
- [ ] **Shell-stack joint call** — review ADR-0009 (GTK4-native + Casilda + headed-Chromium
  stopgap; Tauri a genuine trade); gate on a Casilda+Chromium latency/input spike; then start
  the GUI from `research/2026-06-05-phase4-gui-architecture-sketch.md`. (Resequenced behind 4a;
  unchanged in substance.)
- [ ] (Open, not focus) **Cookie-isolation for the real `primary`** — measure DBSC binding
  read-only first, never blind-clone. JOINT CALL.
- [ ] (Open, not focus) **Vault/behavioral storage backend** — unfreeze ADR-0008 when ready.
- [ ] (Minor, Roi) **sudo Xvfb install** → finish the 3-way anti-detection WebGL table.

## Done — master merge-readiness (graduated 2026-06-04)
- [x] **Full verification pass GREEN (2026-06-04 23:24)** — 175u + 37i + 4m, tsc 0, prod-audit 0.
- [x] **Reviewed the 111-commit `master..dev` delta — coherent** (+1637/−75; no wip/revert; verdict: stable milestone).
- [x] **CI added (`3863da9`) + gating fix** — full suite on ubuntu/Node 22; surfaced + fixed the hardcoded-Wayland bug.
- [x] **PR #1 merged `dev`→`master` (`e39d167`)** — stable graduation.

## Done — inbox processing + workflow (2026-06-05 stop)
- [x] **Research inbox processed → empty** (commit `43933fc`): positioning → `docs/public-positioning.md`;
  composio → memory `project_feather_agent_runtime_direction`; security-risks → absorbed (ADR-0005/0008);
  branching → git-worktree workflow. All 4 notes archived.
- [x] **Adopted git-worktree workflow for parallel workstreams** — documented in `AGENTS.md` (one
  branch+worktree per unrelated workstream, one chat per worktree; create as-needed).

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
