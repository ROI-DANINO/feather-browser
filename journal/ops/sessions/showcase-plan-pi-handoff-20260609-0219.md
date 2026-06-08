# Session — Showcase plan, Testing-Honesty principle, pi_agency/Codex execution pivot

**Stop timestamp:** 2026-06-09 02:19 (local)
**Phase:** 4a (Feather v1 wrap)
**Branch:** dev (pushed through `8a040b5`; two new untracked specs committed at this stop)
**Consumes `/next` buffer:** 5 entries (2026-06-08 pause-for-human → 2026-06-09 showcase brainstorm) — archived at
`journal/archive/next/2026-06-09/0219-stop-bundle-showcase-plan-pi-handoff.md`.

---

## Done this session

1. **Housekeeping / journal sync.**
   - Flipped **4a.8 → ✅** across ROADMAP.md, tasks.md, active.md; updated machine pointer phase.md.
   - Found two prior `/next` sessions' journal bridges were never committed; committed them + this session's
     housekeeping as `0802a1c`, pushed to origin/dev.

2. **Showcase/eval suite spec review → revision → approval** (`docs/specs/2026-06-09-showcase-eval-suite-design.md`).
   - Reframed the suite as a **stress-and-learn instrument, not a trophy case**.
   - `PARTIAL` is now a **first-class outcome** carrying a recorded lesson (fallback fired / baseline-pass,
     stretch-fail). Proof/capture split: headed tier → `wf-recorder` film; headless → saved artifact
     (screenshot + extracted text + `results.md`).
   - M1 runs the **normal DuckDuckGo first on purpose** → html-endpoint fallback (the block-then-fallback IS
     the test). H1 keeps the **fragile calendar-write** as the deliberate fallback test. E3 star-count
     suffix-parse noted. Fixed stray `H6`→`H4`. Recorder resolved (`wf-recorder` installed). **Approved.**
   - Committed + pushed `8a040b5`.

3. **Durable principle baked in:** new root-`AGENTS.md` section **"Testing Honesty — Objective, Not Flattering"**
   (test for truth not green checkmarks; never go easy to please; failure+lesson = a successful test). Saved to
   memory as `feedback_testing_honesty` (linked to `feedback_research_driven_not_arrogant`).

4. **Full implementation plan written** → `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (moved out of the
   gitignored `docs/superpowers/plans/` into the open `docs/specs/`). Phases A (scaffolding) → B (Pass-1 live
   discovery) → C (per-task functions) → D (film + docs + journal). **Grounded in real source**
   (`routes.ts`/`manager.ts`/`modes.ts`/`api-reference.md`/`quickstart.sh`), exact API recipes, including the
   warmed-headed launch `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp"}`.

5. **Two real findings flagged in the plan:** the spec's `jq` claim is wrong (quickstart uses **node** — followed
   node); `docs/api-reference.md` is **stale** (missing `chromium-headed-cdp`) — plan Task D4 fixes it.

6. **Strategic pivot + Codex handoff.** Roi wants the suite **run by his pi_agency agent team** (Pi harness),
   with the setup ("set the ground") done via **Codex**. Wrote `docs/specs/2026-06-09-codex-handoff-pi-agency-runs-feather.md`,
   grounded in pi_agency's real structure (agents have `bash` → can curl Feather directly, no bridge; `coder`
   already runs on Codex `gpt-5.5`; `validator` reports exact results). Handoff covers: cross-repo arrangement,
   exposing Feather's operator skills/playbook, phase→pi-role mapping as a chain, and the pi-context plan tweaks.

## Left unfinished (the next actor is Codex, then the pi team — not Claude Code)

- Showcase suite **not built** — Phases A–D pending, to be executed by the pi team after Codex setup.
- `api-reference.md` stale fix (plan Task D4); `examples/README.md` showcase entry (D5).
- **v1 gap decision** (act-human typing cadence / bot self-check: ship in v1 or defer to v2) — pending the
  **Pass-1 verdict** (plan Task B4).

## Next concrete action

Roi sets up *pi_agency-runs-Feather* with Codex per `docs/specs/2026-06-09-codex-handoff-pi-agency-runs-feather.md`,
then the **pi team runs the showcase suite** (Phases A–D). Claude Code resumes only if Roi wants help tweaking the
plan/handoff or reconciling results afterward.

## Decisions

- Showcase suite = **stress-and-learn instrument**; `PARTIAL`+lesson is a pass of a different kind.
- **Testing Honesty** is now repo law (root AGENTS.md) + memory.
- Plan lives in `docs/specs/` (built-in-the-open), not the gitignored `docs/superpowers/`.
- **Execution via pi_agency** (not Claude Code); **setup via Codex**.
- `/stop` here — clean handoff boundary to external tooling.

## Ideas / for Codex to encode

- pi role mapping: `coder` (Codex) builds A/C; a driving/operator agent runs Pass-1 (B); `validator` runs +
  reports tiers; Roi films headed tier + gates the hard tier / B4 verdict; `docs-memory` reconciles journal.
  Encode as a pi chain (extend `implementation-review-validation.chain.md` or new `showcase-run.chain.md`).

## Roi quotes (verbatim)

- "i never want you to go the easy way to please me. i want to actualy, objectively, test and learn."
- "bake it in the root AGENTS.md or somthing my sweet boy."
- "i want to run this tests with my agentic team on the pi agent harness i built (~/Desktop/Projects/pi_agency if relevant)"
- "if we need to set the ground first with code or somthing i would want to do it with codex … than to run the full test suit i want to do with pi agents."
- "if we need to tweak the plan or implament some patches for this new context i added leave it in the handoff for codext to set up"

## Risks / flags

- Hard tier needs the **local desktop host**: Feather server started with `WAYLAND_DISPLAY`/`DISPLAY`, and the
  `scratch` workspace warm (Google + `feather_test_roi` IG). The pi driving-agent for the hard tier must run there.
- Honor Testing Honesty: don't let a pi agent sand a fragile task into an easy one for a green row. `validator`'s
  "report, never fix" posture fits.
- Commit/push policy: dev-only unless Roi calls a master milestone; pi `coder` commits gated on Opus review + Roi.
- `continuity.test.ts` pre-existing flake — irrelevant here.
