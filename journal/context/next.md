# Next — Context Bridge

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
