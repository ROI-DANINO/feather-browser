# Next — Context Bridge

---
## 2026-06-05 15:55 — /next bridge after the autonomous run (ready for fresh session)

### Done
- Autonomous research run fully executed + closed out (detail in the section just below + the full
  record `ops/sessions/autonomous-research-run-20260605.md`). All 4 workstreams landed; CI green.
- Everything committed + pushed: `dev` == `origin/dev` (`eab8246`), tree clean.

### Unfinished / open threads
- **No code unfinished** — every workstream reached a green, committed end-state.
- Three **joint-call decisions** are intentionally NOT made (need Roi): shell-stack final pick
  (ADR-0009 recommends GTK4-native + Casilda; gate on a Casilda+Chromium spike) → then start the
  Phase-4 GUI; cookie-isolation for the real `primary` (measure DBSC read-only FIRST, never blind-clone);
  vault/behavioral storage backend (ADR-0008 frozen).
- One **sudo** item for Roi: install Xvfb to finish the 3-way anti-detection WebGL comparison.

### Decisions
- Roi approved the full cookie-isolation clone test on scratch; primary deliberately never touched.

### Next action
**Fresh session → `/start`, then open the joint-call session: review ADR-0009 and decide the shell
stack (run the Casilda+Chromium latency spike to gate it), then begin the Phase-4 GUI** from
`research/2026-06-05-phase4-gui-architecture-sketch.md`.

---
## 2026-06-05 — Autonomous research run COMPLETE (all 4 workstreams, CI green)

### Done (13 commits, `dev` 877d02a..2bbddca; full record: `ops/sessions/autonomous-research-run-20260605.md`)
- **① ozone-platform configurable + un-gated the 2 headed tests.** `resolveSpawnExtraArgs()` drives
  ozone/headless/no-sandbox from env. CI took 3 red iterations that each caught something real (stale
  wayland assertion; no-sandbox needed in CI containers; ubuntu snap-chromium can't expose CDP →
  `system-chromium` skipped on CI). **CI green: 36 passed + 1 skipped; local Wayland 37.**
- **② live `scratch` spikes (roionly9, throwaway — primary never touched):**
  - cookie-isolation: scratch is **NOT DBSC-bound**; clone **survived** + **no session-theft** →
    `research/2026-06-05-cookie-isolation-spike-findings.md`.
  - **pre-shell #6 Cookie Mine loop CLOSED** (ADR-0007 gate) → `…cookie-mine-loop-demo.md`. **GUI unblocked.**
  - anti-detection: **headless is trivially detectable** (HeadlessChrome UA + SwiftShader) → headed/Xvfb
    only → `…anti-detection-self-test.md`.
- **③** warm-session password-manager-disable shipped + verified on scratch; **vitest ^2→^4 (audit 0)**.
- **④ (parallel subagents):** ADR-0009 shell-stack (**GTK4-native + Casilda** rec; joint call),
  `…phase4-gui-architecture-sketch.md`, `docs/specs/2026-06-05-behavioral-fidelity-design.md`.

### Decisions (Roi, this run)
- **Cookie-isolation full clone test APPROVED** despite the shared-iPhone worry (accounts are separate
  security domains; risk to primary very low, not provably zero). Sequenced safely anyway.
- **Primary deliberately NOT touched** — skipped even the optional read-only closeout check.

### Next action (joint session — do NOT decide alone)
1. **Shell stack:** review ADR-0009; run a **Casilda+Chromium latency/input spike** to gate the pick;
   then **start the Phase-4 GUI** from the sketch.
2. **Cookie-iso for `primary`:** measure primary's DBSC binding **read-only first**; never blind-clone.
3. **Vault/behavioral storage backend:** unfreeze ADR-0008 decision when ready.
- Minor: **sudo Xvfb install (Roi)** to finish the 3-way anti-detection WebGL comparison.

---
## 2026-06-05 01:29 — scratch warmed (password-only); run deferred to next session

### Done
- **`scratch` profile warmed + persistence-verified.** `FEATHER_WARM_WORKSPACE=scratch npm run
  warm-session` → logged into the throwaway Google account, finalized cleanly (`✓ Done.`, lock
  released, cookie store ~49 KB persisted). Re-launch test passed: lands already signed in, no
  re-auth. Profile on disk: `~/.local/share/feather/profiles/scratch/profile`.
- **Safety confirmed:** scratch is a genuinely throwaway/burnable account (NOT primary). Roi verified
  directly. It carries an old iPhone/iCloud passkey (Sept 2025) + phone history — that's fine, it's
  still disposable.
- **Two findings worth carrying into the run (see Decisions):** this Fedora box **cannot create a
  local passkey** (Chromium has no platform authenticator — dialog: "device doesn't support creating
  passkeys, use another device"); and the earlier "passkey login ⇒ device-bound session (DBSC)"
  assumption is **unverified** — those are separate mechanisms.

### Unfinished / open threads
- **The autonomous research run has NOT started** — deferred by Roi to a fresh `/next` session
  (the review-gate-then-clean-session shape the plan intended).
- **scratch is password-only, not device-bound.** We deliberately skipped both the local-passkey
  (machine can't) and the phone-number recovery (don't leak real PII into a burnable account). So
  scratch does not yet provably mirror primary's device-binding.

### Decisions
- **Don't chase a passkey on scratch.** Machine can't make a local one; the phone-QR ceremony would
  be *faith, not evidence*. Instead: **measure, don't assume.** The cookie-isolation spike's FIRST
  job = inspect whether scratch's saved session is actually DBSC-bound (look for bound-session
  registration in the profile), rather than infer from login method. If it matters and scratch lacks
  it, *then* do the phone-passkey re-login and re-measure — with evidence it's needed and that it works.
- **Don't add a recovery phone number to scratch** — tying Roi's real number to a burnable account is
  identity leakage with zero upside for the run.
- Net: my earlier passkey→DBSC claim was a prior-driven overstatement; corrected. Turn it into a real
  finding: *can this Fedora box even hold a device-bound session?* (research-driven, not arrogance-driven.)

### Next action
**In a fresh session, paste the kickoff prompt** (saved in the section below — "Kickoff prep") to
execute `docs/plans/2026-06-05-autonomous-research-run.md` via `superpowers:executing-plans`. Add one
thing to the executor's early todos: **scratch is password-only → the cookie-isolation spike must
first MEASURE whether its session is DBSC-bound before drawing any conclusion that transfers to
primary; record the no-local-passkey constraint as a finding.**

---
## 2026-06-05 — Kickoff prep: scratch setup + paste-prompt for the unattended run

### Done
- Confirmed the run launches **next session**: Roi warms `scratch` first, then pastes a kickoff prompt.
- Wrote the **ready-to-paste kickoff prompt** (preserved below) — task-tracked, professional, adds
  tasks midway as findings demand.

### Next action (next session, in order)
1. **Roi sets up `scratch`:** `FEATHER_WARM_WORKSPACE=scratch npm run warm-session` → log into a
   throwaway Google account with **passkey/Face-ID** → Ctrl-C. (Delete the passkey after.)
2. **Paste this prompt** to start the unattended run:

```
Execute the autonomous research run — you're running this UNATTENDED. I've already
warmed the `scratch` profile (throwaway Google account, passkey login). I'm out of
the loop until you hit a wall only I can clear.

1. Read these in full first:
   - docs/specs/2026-06-05-autonomous-research-run-design.md  (rationale, iron rules, hard-stops)
   - docs/plans/2026-06-05-autonomous-research-run.md         (the step-by-step autopilot)

2. Use the superpowers:executing-plans skill. Build a TodoWrite list from the plan's
   tasks and keep it LIVE — mark each in_progress/completed as you go, and ADD new
   todos whenever a finding reveals new work (research-driven; let the spikes steer).
   For heavy independent tasks, dispatch a subagent to conserve context.

3. Work in Ratchet order (① → ② → ③ → ④). Honor the iron rules every workstream:
   scratch ONLY (never touch primary except the read-only closeout check); push dev
   ONLY (never master); commit per task; auto-revert anything that can't go green;
   lightweight lens on every artifact.

4. Stop and hand off at any you-only wall (sudo, master-merge, a scratch re-login,
   the behavioral recording). For the joint-call decisions (shell stack,
   cookie-isolation-for-primary, vault backend): gather evidence and recommend —
   don't decide alone.

5. At the end (or if cut short) run the plan's Closeout: update the journal handoff
   (active.md / next.md / tasks.md / log.md + a session file) and give me a concise
   summary of what landed and what needs me.

Work smart, professional, and honest — evidence before claims, record negative
results, don't overstate green.
```

---
## 2026-06-05 — Autonomous research run: spec + plan READY (awaiting `scratch` warm-up + go)

### Done
- Brainstormed + wrote an **unattended autonomous-run** spec + plan (Roi calling shots up front; he
  won't read the docs — delegating on the brainstorm). Both committed to local `dev`:
  - Spec: `docs/specs/2026-06-05-autonomous-research-run-design.md` (`60d361a`)
  - Plan: `docs/plans/2026-06-05-autonomous-research-run.md` (`4a7ea10`)
- **Shape:** Ratchet order, research-driven. ① ozone-platform configurable + un-gate the 2 Wayland
  tests (run under Xvfb in CI) → ② live spike block on a **burnable `scratch` account** (cookie-isolation,
  pre-shell #6 Cookie Mine loop / ADR-0007 gate, anti-detection self-test incl. headless/headed/Xvfb
  comparison) → ③ warm-session password-manager hardening + vitest 2→4 (auto-revert) → ④ research tail
  (shell-stack ADR-0009 draft + process-boundary/language sub-analyses, Phase-4 GUI sketch,
  behavioral-fidelity design + capture harness).
- **Iron rule:** all live browser work hits `scratch` ONLY; real `primary` never touched (one read-only
  login check at closeout). Lightweight lens applied (most artifacts are *knowledge, not shipped weight*).

### Decisions (Roi, this session)
- Burnable **throwaway Google account** removes the warm-session risk → spike runs LIVE (not just
  designed). Warm `scratch` with **passkey/Face-ID** so DBSC binding mirrors `primary` and findings
  transfer. `warm-session` already supports `FEATHER_WARM_WORKSPACE` (no code change to set the ground).
- Run **later, in a fresh session** (not now) — Roi wanted the review gate before unattended execution.
- vitest bump = **auto-revert** if not cleanly green (never wake to a half-broken test config).
- Headless question recorded: behavioral fidelity works mechanically in headless, but headless has its
  own fingerprints → anti-detection wants **headed (Xvfb for display-less)**; self-test quantifies it.

### Next action (to kick off the run)
1. Roi: `FEATHER_WARM_WORKSPACE=scratch npm run warm-session` → log into a throwaway Google account with
   passkey/Face-ID → Ctrl-C. (Delete the passkey afterward.)
2. In a fresh session, say "execute the autonomous research run plan" → executor follows
   `docs/plans/2026-06-05-autonomous-research-run.md` via `superpowers:executing-plans`, heads-down until
   a you-only wall (sudo / master-merge / `scratch` re-login / behavioral recording) or done.
3. Joint-call decisions are HELD for Roi: shell-stack pick · cookie-isolation-for-`primary` · vault
   backend. The run recommends with evidence; we decide together.

---
## 2026-06-04 23:55 — CI added; first run caught a real Wayland-portability bug

### Done
- **Added CI** (`.github/workflows/ci.yml`, commit `3863da9`): full suite on ubuntu/Node-22 (push to
  dev/master + PRs). Node pinned (`engines>=20` + `.nvmrc 22`). README test counts fixed 137→175/33→37.
- **CI's first run went RED on integration — and that was the point.** Surfaced a latent bug local
  runs hid: `spawnAndConnect` (`src/browser/modes.ts:44`) **hardcodes `--ozone-platform=wayland`** +
  spawns headed → the CDP-attach path only runs on a Wayland desktop; on a display-less runner
  Chromium exits before exposing CDP.
- **Fix (`f0bdd6d`, fast + honest per Roi's "merge first, break later"):** env-gated the 2 headed
  integration tests (`attach-cdp`, `system-chromium`) on `WAYLAND_DISPLAY`, mirroring the existing
  conditional-skip. **CI now GREEN: 175 unit + 35 integration passed + 2 skipped** (verified in the
  run logs, not just the checkmark). Local (Wayland) stays 37 passed.
- **Corrected docs to actual state** (the earlier README/active.md edits overstated "green
  everywhere"): README CI/test lines state the gating; active.md records the CI finding honestly.
- **PR #1: OPEN · MERGEABLE · `verify` check = SUCCESS.**

### Decisions
- Defer the real portability fix (make ozone-platform configurable so the 2 tests run on CI/X11/
  headless, then un-gate) to **post-merge** — tracked in `tasks.md` alongside the vitest 2→4 bump.

### Next action
**Roi decides on PR #1.** CI is green and gates the PR; evidence supports graduating `dev`→`master`.
After merge, post-merge tech-debt queue: (1) make `--ozone-platform` configurable + un-gate the 2
tests; (2) bump `vitest` ^2→^4 to clear the dev-only audit. Then pre-shell **#6** (prove e2e Cookie
Mine loop) → Visual Desktop Shell GUI.

### Cosmetic / noted
- CI logs a non-fatal warning: `actions/checkout@v4` + `setup-node@v4` run on Node 20, which GitHub
  deprecates 2026-06-16. Already on the latest action majors; harmless for now.

---
## 2026-06-04 23:24 — Master merge-readiness: full verification pass (all green)

### Done
- Ran the **full verification pass** on `dev`, all fresh this session:
  - Unit: **175/175 pass** (23 files), 0 fail, 0 skip.
  - Integration (real Chromium): **37/37 pass** (11 files) — incl. attach-cdp anti-detection gate (`webdriver===false`), system-Chromium probe, DebugCapture e2e, secret-leakage gate.
  - Measurement: **4/4 pass**.
  - Typecheck (`tsc --noEmit`): **exit 0**. Build (`tsc`): **exit 0**. Tree clean after build.
- Reviewed the `master..dev` delta: **111 commits** (was 110; +1 from the last `/stop` handoff commit), linear (no merge commits), no `wip`/`revert`/`fixup`/`broken` markers. Composition: 43 docs, 14 chore, 13 feat, 12 ops, 8 test, 6 fix, 2 refactor + research/inbox notes. Source changes **+1637/−75** across 31 files — heavily additive; all map to the documented pre-shell sequence (S1–S3 + storage isolation + attach-cdp + chromium-path + observability + warm-session).
- Source-smell scan: **no TODO/FIXME/HACK in src**. The one `it.skip` is a conditional guard (`systemBin && systemBuild ? it : it.skip`) that **actually ran** this session (system-Chromium present), not a hidden disabled test.
- Dependency health: `npm audit --omit=dev` (production tree) = **0 vulnerabilities**. The 5 audit vulns (4 moderate, 1 critical) are **dev-only test tooling** (vitest/vite/esbuild/vite-node/@vitest/mocker); the critical esbuild advisory is dev-server-only — never ships.
- PR #1 state confirmed: **OPEN · MERGEABLE (no conflicts) · not draft**, title already updated to full scope (`feat: Stabilization (S1–S3) + Phase 4 pre-shell infrastructure (dev → master)`).

### Unfinished / open threads
- **The actual merge of PR #1 is NOT done** — stopped short on purpose. Graduating `dev`→`master` is the human milestone decision (dev/master policy); the goal scoped me to verification + `/next`, not the merge. Roi pulls the trigger.
- **No CI** (`.github/workflows` absent) — every check ran locally. Known solo-project trade-off; worth adding before multi-person/shipping. Not a merge blocker.
- **Dev-tooling vuln cleanup** — fix is a breaking `vitest@4` bump; defer to its own task. Not gating.
- README status line still says "137 unit tests" (now 175) + "Phase 3 Complete" framing — cosmetic doc drift.
- Pre-shell **#6** (prove e2e Cookie Mine loop on headed stopgap) still the only pre-GUI item left — a *forward* item, not unfinished work inside this delta.

### Decisions
- **Verdict: `dev` IS a genuine stable milestone.** Meets both bars — the dev/master policy ("merge only at a stable milestone": coherent, complete, not mid-change) and general release-readiness (all tests green, clean automated checks, mergeable). Evidence supports merging PR #1.
- Held the merge as Roi's call rather than auto-merging.

### Next action
**Roi decides on PR #1.** If go: merge PR #1 (`dev`→`master`) to graduate the stable milestone. (Optional pre-merge polish, non-blocking: refresh README status line 137→175 / Phase framing.) After merge, the next substantive work item is pre-shell **#6** (prove the end-to-end Cookie Mine loop on the headed-Chromium stopgap), then the Visual Desktop Shell GUI.
