# Stealth + Behavior-Mine Arc — Design (ordered roadmap)

**Date:** 2026-06-23
**Status:** 📐 Arc design — the committed *sequence* for the stealth + "teach the agent human behavior" work. Each step below gets its own design + plan when reached; this doc owns the ordering and the shared foundation.
**Phase:** Phase 5d (v2.5) — stealth hardening, now expanded into a 5-step arc.
**Supersedes ordering of:** the scattered v2 features "Stealth hardening", "Learn-your-behavior", "Teach-a-workflow", "Active anti-bot self-detection" (`docs/roadmap/v2.md`) — collected and sequenced here.

---

## The idea

Two goals Roi wants, in natural order:
1. **All the stealth work** — agent sessions that real bot-detectors can't tell apart from a human.
2. **The user teaches the agent human behavior** — the agent learns from *how Roi actually uses the browser*, not from generic statistical models.

These look like two projects but share one foundation, so they form a single arc.

## The spine: one foundation, two payoffs

Both goals need the same first thing — **a recording of a real human actually using the browser** — and Feather already owns that surface (the warm-session / daily-driver where the human logs in by hand). So the "ground" is **one capture layer**; two consumers branch off it:

```
        ┌─ uses the MOTION / RHYTHM ─→ agent moves & types like you  (STEALTH realism)
human   │
session ┤  ← record once  ("the Behavior Mine")
        │
        └─ uses the STEPS ──────────→ agent replays your recipe     (WORKFLOW / efficiency)
```

This is the **Cookie Mine pattern again**: the human's normal use produces something the agent piggybacks on. There it was cookies (trust context); here it's *behavior* (how you move) and *workflow* (what you do). Same architecture, new payload.

> Honest framing (carried from the council audit + 5d spec): Feather's real stealth is its *architecture* (real headed Chromium, real IP). The arc below adds the **one thing the architecture can't give for free — human-shaped behavior** — and does it by learning from the actual human rather than faking a generic one.

---

## The ordered arc (5d.1 → 5d.5)

Each step is its own design + plan. We commit to the **sequence** now; we design each step when we reach it.

### 5d.1 — Stealth base *(planned, ready to build)*
Always-on consistency *checks* (verify, never spoof), secure-by-default typing cadence, self-test hard assertions. The hygiene floor everything else sits on.
- **Design:** `docs/specs/2026-06-23-5d-stealth-reconciled-design.md`
- **Plan:** `docs/plans/2026-06-23-5d-stealth-reconciled.md`
- **Produces:** clean-session guarantee + a behavioral seam (`type` cadence) the learned-input step upgrades.

### 5d.2 — Measure reality *(small, cheap — the honest test)*
Point secure Feather at real detectors (`bot.sannysoft.com`, CreepJS, then a real site on the throwaway profile) and **record the honest baseline: what actually gets flagged, and how human do we even need to be?**
- **Why before the expensive work:** the kinematic/learned build must be *measured against real detectors* (council requirement). This produces the target the later steps aim at, and de-risks: if behavioral detection doesn't bite, we learn that cheaply before investing.
- **Produces:** a baseline report (per-detector PASS/PARTIAL/FAIL) + the concrete signals 5d.4 must beat.
- **Consumes:** 5d.1 (a secure session to point at the detector).

### 5d.3 — Behavior Mine: capture foundation *(the ground Roi asked to set)*
Record the human's input during warm/daily sessions — **mouse motion + timing, keystroke rhythm, and the step sequence** — into one structured recording both consumers can read.
- **Design questions deferred to this step's own spec:** capture mechanism (passive during daily-driver vs. an explicit "record me" session), storage shape + where it lives (XDG data root, per-identity), privacy/redaction (never capture into shared jars; same credential-boundary care as cookies), opt-in.
- **Produces:** a behavior-profile artifact (dynamics stream + step stream), the shared base for 5d.4 and 5d.5.
- **Consumes:** the existing warm-session / daily-driver surface.

### 5d.4 — Learned human-like input → STEALTH *(the stealth payoff)*
The agent replays *the captured human dynamics* (motion curves, keystroke cadence) instead of generic math, so it moves like the real user. Then **re-measure against 5d.2** to prove the needle moved.
- **Spike-first** (carried from the 5d spec): prove curved/realistic input beats the detectors found in 5d.2 before committing the build; needs a cursor-position model the action handlers don't have today.
- **Neighbor (optional, later):** *active anti-bot self-detection* — watch own behavior live and correct when it trends robotic.
- **Consumes:** 5d.3 (the dynamics stream) + 5d.2 (the target).

### 5d.5 — Teach-a-workflow / action cache → EFFICIENCY *(the efficiency payoff)*
The agent reads the captured *step sequence* as a reusable recipe and replays known flows without re-perceiving from scratch (Roi's "toolbox" idea).
- **Inputs on file:** `research/2026-06-23-agent-speed-perception-toolbox-intake.md`, `research/2026-06-06-anchor-browser-product-reference.md`, `research/2026-06-06-anchorbrowser-sdk-probe-notes.md`. Maxun `where/what` DSL = reference-only (AGPL).
- **Last in the arc** because it doesn't serve "look human" at all — it's valuable but a different axis. Stealth comes first (Roi's call).
- **Consumes:** 5d.3 (the step stream).

---

## Why this order

- **Measure before you invest** — 5d.2 before 5d.4. Don't build expensive kinematic input until a real detector tells us what's actually flagged.
- **Shared ground before either consumer** — 5d.3 before 5d.4 and 5d.5. One capture layer, two readers; building it once avoids a throwaway generic layer we'd rip out.
- **Stealth before efficiency** — 5d.4 before 5d.5. Roi's sequencing; and 5d.2's measurements feed straight into 5d.4.
- **Base first** — 5d.1 is the hygiene floor and already carries the `type` cadence seam 5d.4 upgrades.

## Honest caveats (recorded, not hidden)

- This is a **multi-plan arc** — at least 4 more design+plan cycles after 5d.1. We commit to the sequence, not to building it all at once.
- **5d.2 is a real gate, not a formality** — if it shows behavioral detection isn't biting on Feather's targets, 5d.4 may shrink or defer. We let the measurement decide.
- **Learned ≠ automatically better than generic.** 5d.4's spike compares learned-from-user input against generic-statistical input; we ship whichever the detectors say works, not whichever sounds cooler.
- **Capture is credential-adjacent.** 5d.3 records human sessions — it must honor the same boundaries as the Cookie Mine (no secrets into shared artifacts; opt-in; redaction). Its own spec owns this.

## Not in this arc

- Raw-CDP external interop (Phase 5e). The visual shell (Phase 4b / v3). General perception-output efficiency (its own logged item) — neighbor to 5d.5, not part of it.
