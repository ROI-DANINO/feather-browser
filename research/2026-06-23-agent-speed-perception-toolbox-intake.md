# Agent Speed + Perception + Run-Mining Toolbox — Roi's notes (2026-06-23)

> **Source:** Roi's notes after the v2 spine live tests (GitHub PARTIAL + Instagram PASS).
> **Status:** intake / motivation — **deferred by Roi** ("after stealth / whenever", not now). NOT a
> blocker. Maps to existing roadmap items; this doc records the *why* + a new angle.

## The ask (do-now, scoped separately)
**"Earn the full feature tests."** Roi wants to *see* every Feather feature demonstrated working live,
to spec, in one honest pass — confidence that "we didn't work for nothing." Note: most features already
have automated proof (437 unit + integration on real Chromium + measurement suite + v1 showcase + the 2
live spine runs). The gap = a curated, live, **feature-acceptance** pass with honest PASS/PARTIAL/FAIL
per feature. Being scoped with Roi separately from this intake.

## Note 1 — Speed (live runs feel "very, very slow")
Honest breakdown of where the time goes:
- **Inherent:** headed + human-in-the-loop. Run B's ~4-min cost was *waiting on the human* (password +
  2 CAPTCHAs + email-link), not Feather being slow. Can't optimize away a human.
- **Round-trips:** each `observe`/`act`/`re-observe` is a separate HTTP call. Dense pages + frequent
  re-observes add up.
- **Agent mistakes → extra round-trips:** guessed selectors, REF_EXPIRED recoveries, the plan-doc
  `prompt`/`reason` bug all cost extra calls. The toolbox (Note 3) directly attacks this.

## Note 2 — Perception ("read the underlying layers, not just the rendered page")
Roi's observation: the agent makes targeting mistakes it *wouldn't* make if it "saw the actual page"
(screenshot) or "read the underlying HTML/CSS/JS." **He's right about a real gap:**
- `observe` returns a **flattened action list** (ref/role/name/box) — NOT raw pixels, NOT raw
  DOM/attributes. `snapshot` gives cleaned markdown (for reading); `extract` is CSS-recipe based.
- So when the agent needs a real selector/attribute it **guesses** (e.g. verifying the IG username
  field with `input[name=username]` — wrong; IG's input name differed → read empty).
- **Idea: a "deeper perception" mode** — let the agent pull the raw DOM/attributes (or computed
  CSS) for a region/element on demand, so it stops guessing selectors. This is the *opposite* axis
  from the already-logged "perception-output efficiency" (which is about *shrinking* payloads /
  progressive disclosure). Both can coexist: default thin, expand-on-demand — and "expand" should be
  able to go *deeper* (raw attributes), not just *wider*.
- Screenshot/vision fallback already exists (sanctioned) but is token-heavy; deeper *structured*
  perception is cheaper than pixels for selector problems.

## Note 3 — The Toolbox / Recipe Library (the kitchen analogy)
Roi: Feather **logs and documents every run** (per-session JSONL + run reports). Mine that accumulated
history into a reusable **toolbox** — drawers / recipes / tools — so repeat work is faster and the
agent guesses less. Concretely, per site/flow:
- **Known-good recipes:** "IG login = click Log in first; username input selector = X; refs expire on
  re-render → re-observe; feed-caption is CSS-unreachable, parse snapshot TEXT" (we already hand-carry
  some of these in `active.md` "IG durable recipes" — the toolbox would *systematize* that).
- **Action cache / determinism layer:** replay a known sequence instead of re-perceiving from scratch.
- **Gotcha ledger:** the failure→recovery pairs already in the logs become guardrails.

### Maps to existing roadmap (tasks.md, Feather v2 §):
- **"Teach-a-workflow / action cache (Anchor-inspired determinism layer)"** — the core of this.
- **"Learn-your-behavior"** — mining the run history.
- **"Perception-output efficiency"** (Headroom intake `research/2026-06-15-headroom-integration-intake.md`)
  — neighbor; Note 2 adds the *deeper* axis to its *thinner* axis.

## Timing (Roi's call)
Deferred — "if it's out of scope now, it's okay… maybe after the stealth thing… maybe whenever."
Capture now, build later. Sequencing decision tracked in `journal/context/active.md` / tasks.md.
