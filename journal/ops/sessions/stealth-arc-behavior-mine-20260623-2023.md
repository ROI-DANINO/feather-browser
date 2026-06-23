# Session — Stealth Arc + the Behavior Mine (5d reconciled, roadmap set)

**Timestamp:** 2026-06-23 20:23
**Phase:** Phase 4a → opening the v2.5 stealth arc (Phase 5d)
**Branch:** dev
**Outcome:** 5d reconciled to a secure-only design + plan; stale docs fixed; the full stealth +
"teach-the-agent-human-behavior" work set into the roadmap as an ordered 5-step arc. **No source code
written** — all docs/planning.

---

## Prior chat (folded from the consumed `next.md` 16:20 bridge)

v2 spine live-tested end-to-end: Finding #1 fixed (`identityId`→`LaunchSchema`, `4c75a1e`); Run A
GitHub PARTIAL, Run B Instagram PASS (brake + await-human held through password + 2 CAPTCHAs +
email-link), Run C 5b typed-code inject bug found+fixed live (`a08f4e7`). v2 fully proven live, pushed
`origin/dev`. That session ended pointing at "pick the next thread: 5d Stealth · Phase 2 · 4b shell."

## Done this session

1. **Picked 5d Stealth** and ran a **reconciliation pass first** (per AGENTS.md — plan before code on a
   new feature thread).
2. **Reconciled the 2026-06-07 stealth spec/plan against shipped reality** (Gate A / 5a / 5b /
   perception loop, grep-verified):
   - The MFA mode-switch seam (`setStealthMode` + `POST …/stealth`, consumed by MFA for human-takeover)
     is **dead** — confirmed in `src/mfa/manager.ts`, `src/capability/holds.ts`, the MFA test. MFA
     shipped using an `mfa` hold + banner-free pause.
   - Build order **inverted** — stealth is now *last*, not the root dependency.
   - `type.ts` drifted (ref/probe split, `allowDuringHumanControl`).
   - Key finding: `TypeSchema` (`routes.ts:142-143`) **already exposes per-call `mode`/`delayMs`** → the
     fast path needs no `assisted` mode → the model collapses to **secure-only**.
3. **Brainstormed the mode model → secure-only** (Roi's call: "go with the per-call override").
4. **Wrote + committed** the reconciled design rev 3 (`docs/specs/2026-06-23-5d-stealth-reconciled-design.md`,
   `1c19a40`) and a **9-task TDD plan** (`docs/plans/2026-06-23-5d-stealth-reconciled.md`, `03c0fc4`).
   Design call that mattered: cadence routes through a new **`Actionable.typeSequentially` seam** so it
   reaches **ref targets** (the main agent path), not just CSS selectors — without it "secure typing"
   would silently skip the path agents use most.
5. **Honest review + plain-language explanation** of what 5d.1 will/won't deliver (modest cadence;
   checks warn-not-fix; nothing in it proves we beat a real detector).
6. **Fixed stale docs via 4 parallel agents** (`2bb86e2`): old 2026-06-07 spec+plan banner-superseded;
   ROADMAP 5d, tasks.md 5d, and the browser desk repointed at rev 3; fingerprint-injector pkgs marked
   reference-only.
7. **Set the roadmap to the full stealth arc** (`a8c2290`): new **arc design doc**
   (`docs/specs/2026-06-23-stealth-behavior-arc-design.md`) + ROADMAP/v2.md/tasks.md encode the ordered
   **5d.1 → 5d.5** sequence. Unifying idea: **"one foundation / two payoffs"** — record the human's
   browser use once ("the Behavior Mine"), then motion/rhythm → stealth realism, steps → workflow
   replay. *The Cookie Mine pattern, new payload.*

## The committed arc (5d.1 → 5d.5)

1. **5d.1 Stealth base** — checks + secure-by-default cadence + self-test. *Planned, ready to build.*
2. **5d.2 Measure reality** — point secure Feather at real detectors; honest baseline. **A real gate.**
3. **5d.3 Behavior Mine** — capture human motion/rhythm + steps; the shared ground.
4. **5d.4 Learned human-like input → STEALTH** — agent replays *your* dynamics; re-measure (spike-first).
5. **5d.5 Teach-a-workflow → EFFICIENCY** — agent replays captured *steps* as recipes.

## Left unfinished

- **No code.** 5d.1's plan is ready but unbuilt.
- 5d.2–5d.5 are sequenced but not designed (deliberately — each is specced when reached, informed by the
  prior step; 5d.2's measurement gates 5d.4).

## Next concrete action

**Build 5d.1** next session (subagent-driven, plan task-by-task: `docs/plans/2026-06-23-5d-stealth-reconciled.md`).
Roi's call (this stop): start building, do **not** spec the rest ahead — let 5d.2's measurement drive the
later specs.

## Decisions

- 5d is **secure-only** (no mode enum / `setStealthMode` / mode-switch endpoint — dead; per-call
  `type` `mode`/`delayMs` is the fast path).
- Cadence routes through **`Actionable.typeSequentially`** so it reaches ref targets.
- Stealth built **last**; Identity's `stealthPolicy` slot stays **dormant** under one mode.
- The **5-step arc** is the roadmap of record; **5d.2 measure is a real gate** (can shrink/defer 5d.4).
- **Spec just-in-time, not ahead** — build 5d.1, measure, then design 5d.3+ on the findings.

## Ideas

- **Active anti-bot self-detection** — watch own behavior live, correct when robotic (neighbor to 5d.4).

## Roi quotes (verbatim)

- "secure-only, go with the per-call override"
- "i want to do all the stealth stuff and set the ground for user teach agent humen behavioure"
- "i want to plan and develope those in natural order, even if it means to make one more plan after this one"
- "i want to set the roadmap to the stealth work"
- "no blog, build 5d.1 next session"

## Commits this session (all on `dev`, not yet pushed)

- `1c19a40` — design rev 3 (secure-only)
- `03c0fc4` — 9-task implementation plan
- `2bb86e2` — stale-pointer reconciliation (4 parallel agents)
- `a8c2290` — roadmap arc set

## Risks / flags

- Commits are **local on `dev`, not pushed** to `origin/dev` yet.
- 5d.1 Task 9 (secure-by-default reconciliation) is the riskiest build step — every existing `type`
  call gets slower; watch the hero demo + any test asserting instant `fill()`.
