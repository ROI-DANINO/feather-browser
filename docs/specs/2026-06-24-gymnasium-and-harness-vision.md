# The Gymnasium & the Harness — Captured Vision (2026-06-24)

> **Status: captured thinking + direction, NOT a finalized design or a commitment to code.**
> This doc exists so the thinking from the 2026-06-24 conversation isn't lost. The concrete
> design (what the gym *is*, which detectors, what "pass" means) is the next brainstorm pass.
> Plan-of-record for the prior reorientation: `docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`.

## Why this doc exists

Roi worked through a big "remake Feather around stealth + Firefox" impulse and — with a grounded
research pass + reflection — landed somewhere better and truer to what he actually wants. This
captures the decisions so a future session (or a fresh chat) resumes on the real direction.

## Roi's real goals (this reframes everything)

This work is **not a commercial product play.** The goals, in his words:

- **Learn** — by *doing it himself*, not studying like everyone else.
- **Show off** — a portfolio piece he can point at.
- **Get into the field** — it could help land a job in agentic AI / browser automation.
- **Joy + meaning** — the most fun he had was *watching agents do things and pass tests*. He wants
  to feel — and know — he's working at the cutting edge of agentic AI *now*, while the field climbs.
- Maybe become a feature in something later. Mostly, it's **for him.**

Against *these* goals, "can a solo builder win the commercial arms race?" is the wrong question.
The right question is "is this a great thing to **build, learn from, and show**?" — and it is.

## The stealth resolution (Roi's own line)

- **Evading bot detection on real third-party sites that don't want bots = CUT / out of scope.**
  Unwinnable arms race for a solo builder, legal/ToS exposure on logged-in automation, fraud-tool
  stigma. (Confirmed by an adversarially-verified research pass: stealth patches are a mirage at
  the top end; a warmed real session already wins; "Firefox/Gecko is stealthier" is a myth — the
  stealth lives in Camoufox's C++ patches, and DataDome already detects Camoufox by name.)
- **Detection/evasion as RESEARCH inside Roi's OWN sandbox = EMBRACED.** This is the part that
  lights him up, and it's ethically clean: his own arena, his own deployed detectors, his own bots.
  He explicitly does **not** want to break into sites that don't want him. He built מכון ווינגייט
  (a Wingate Institute / training academy) for browser-agent bots — not a lockpick.

The honest-testing guardrail (the calibration knob): a private sandbox can fool you if you only test
against detectors you control and can rig. To stay *real research* (and impressive to an employer),
test against detectors whose internals you **don't** control (commercial trials, open-source
detectors others maintain) and **design tests that can fail.** This is already Feather's
`AGENTS.md` "Testing Honesty — Objective, Not Flattering" philosophy, which traces to the iroh
constitution (Water = verify-before-done).

## The "one harness" shape (real for 3 of 4; Feather is driven, not merged)

Roi has *already* been building toward one system (see `workspace/docs/specs/2026-06-23-white-lotus-phase1-federation-map.md`
and `workspace/docs/decisions/iroh-fable-boundary.md`). The spine:

```
iroh-project/research.md   → the CONSTITUTION (philosophy: Avatar/Iroh four elements). The soul.
The White Lotus (workspace) → the FRAMEWORK / umbrella (operate Claude Code like a pro)
   └─ iroh (orchestration)  → the ORCHESTRATION BRAIN  (fable is being ABSORBED into iroh)
feather-browser            → the BODY / TOOL the harness DRIVES — hands, eyes, feet
```

- **Real & load-bearing:** constitution → framework → orchestration brain. One system, by design,
  increasingly in code (the iroh philosophy is a runnable review rubric, not decoration).
- **The line:** **Feather is a tool the harness *drives*, NOT a limb to absorb.** Folding Feather
  *into* the framework would be the "everything platform" trap — exactly the thing Roi fears
  ("it slips from my fingers"). White Lotus's own charter warns against it ("absorb only the slice
  you use… reimplementing the whole thing is a forever-project").

## Decisions (2026-06-24)

1. **Don't remake Feather around stealth.** Extend today's cut, don't reverse it.
2. **The bot gymnasium is the chosen direction** — Roi's own sandbox where his agents are trained
   and measured against bot-detection *he* deploys. It's the thing that excites him AND the
   connective tissue that makes the harness real.
3. **Don't stop White Lotus — change its job.** It's at a natural rest (Phases 0–1 done). Pause
   *extending* it; shift to *using* it as the cockpit. Improve it only when the gym needs something.
4. **Integrate by driving, not merging.** The gym *is* the integration: iroh orchestrates → drives
   Feather's HTTP API → fable's eval harness scores the run. A thin wire, not a weld.
5. **Don't do the fable→iroh merge first.** It's a grind (decided-but-unexecuted; the renamed spine
   isn't even running live yet — `/rdw-*` are still old pre-rebrand dotfiles). Start with the *fun*
   thing (the gym) and let it pull the harness together by needing it.

## The road (Roi focuses only on Step 1)

1. **The seed (a visible win):** one agent → Feather → **one** real detector → an honest PASS/FAIL
   he can *see*. This is the 5d.2 "measure reality" work he already did and loved, reframed as the
   gym's first brick. Learn: Feather driving a page, what a detector measures, reading an honest result.
2. **The scoreboard:** wire fable's eval harness (`project-fable/evals/`) to score gym runs. The
   first real White Lotus ↔ Feather integration. Learn: the eval brain; defining honest pass/fail.
3. **Grow the arena:** more detectors (commercial trials + open-source), more agent behaviors, a
   results table. Learn: the detection landscape, hands-on.
4. **Show it off:** a demo + writeup — the portfolio/job piece.
5. **Later (optional):** fable→iroh merge, only when the gym makes it worth it.

## Open design questions (the next brainstorm nails these)

- What does "pass" mean, concretely, and what does the scoreboard measure?
- Which detector is Step 1's single target? (cheap, real, internals-not-controlled, can-fail.)
- What's the smallest version that already *feels alive* to watch?
- Where does the gym live in the Feather repo, and how thin can the iroh↔Feather wire stay?

## Honest seams / risks

- **fable and iroh duplicate each other today** (two orchestrators, two `rd-verify`s). The merge is
  decided on paper, not executed. Don't let the gym depend on it being finished.
- **Rig-your-own-test trap** — see the honest-testing guardrail above.
- **Scope discipline** — Feather stays a driven tool; the gym is a Feather-side capability scored by
  the orchestrator's existing eval harness. Resist building a new top-level "everything" component.
