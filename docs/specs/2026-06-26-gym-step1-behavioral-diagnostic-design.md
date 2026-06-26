# Gym Step 1 — The Behavioral Diagnostic (design)

> **Status: approved design (2026-06-26 brainstorm), ready for an implementation plan.**
> Direction source: `docs/specs/2026-06-24-gymnasium-and-harness-vision.md` (the bot gymnasium).
> Prior art being reframed: `docs/testing/5d2-baseline/baseline-report.md` (5d.2 "measure reality").

## Purpose

The first brick of the bot gymnasium. A **repeatable, watchable diagnostic** — not a trophy. It
answers one honest question:

> Can a real behavioral detector even *score* Feather, and if so, does it read human or bot?

The answer tells Roi **what to upgrade next**. This is the explicit goal: test Feather to know where
to focus, not to collect a green checkmark. A detector Feather already passes (Fingerprint Pro,
browserscan — both PASSED in 5d.2) teaches nothing about what to improve, so Step 1 deliberately
targets the one axis 5d.2 flagged as the real gap: **behavioral / mouse-motion.**

## Scope decisions (from the 2026-06-24 vision + the 2026-06-26 brainstorm)

- **One detector:** `bot.incolumitas.com` — the accessible free behavioral classifier. Real,
  internals not controlled by Roi, can genuinely fail.
- **Agent reads its own verdict** (not eyeballed off a screenshot, unlike 5d.2). This requires a
  machine-readable verdict, which is why a behavioral detector that exposes a score field was chosen
  over canvas-rendered headlines (CreepJS went PARTIAL in 5d.2 precisely because its headline is in
  canvas).
- **Watchable + recorded ("3+1"):** a headed Chromium window you watch drive the page, **and** a row
  appended to a results table you keep — launched by one command.
- **Driven from outside, not welded into core:** lives in a top-level `gym/` directory and drives
  Feather **only through the HTTP API** — the same contract an external agent (and the future fable
  scoreboard wire) uses. The vision explicitly warns against folding gym logic into Feather core.

## The verdict model

The key honesty refinement (Roi, 2026-06-26): **"no score" is a *bad* score, not a neutral one.** A
real human session always emits some behavioral signal; a session that produces *none* is itself a
detection tell. So being unscoreable is a FAIL, not an "n/a."

| Outcome | Meaning | Verdict |
|---|---|---|
| **UNSCORED** | Detector produced no behavioral score (no cursor path to classify) | **FAIL** — red flag: real users always emit signal |
| **SCORED, bot-like** | Got a score; reads as automation | **FAIL** |
| **SCORED, human-like** | Got a score; reads as human | **PASS** |

**Today's expected result: FAIL (UNSCORED)** → focus area = mouse-motion. That *is* the diagnostic
working. The same brick gains a second payoff later: once Feather can move the cursor, the verdict
flips to `SCORED, score = 0.xx` and the gym has its first live dial to watch climb.

## Where it lives

```
gym/
  behavioral.ts      # the runner: drives Feather over the HTTP API (headed), prints, records
  classify.ts        # pure fn: (raw detector fields) -> { outcome, score, reason }
  classify.test.ts   # unit test — the runnable check
  results.md         # the table; one row appended per run
```

No `src/` changes, no import of gym code into Feather core. `behavioral.ts` is an HTTP client of the
running Feather server, nothing more.

## The run flow

Command: `npm run gym:behavioral`

1. Start (or require a running) Feather server; read `endpoint.json` + token (the documented way —
   `baseUrl` field, `X-Feather-Token` header).
2. Launch a **headed** session (`chromium-headed-cdp`, disposable profile, no login — same posture as
   5d.2) so Roi watches it happen.
3. Navigate to `bot.incolumitas.com`.
4. Perform the interaction the detector needs to attempt scoring: fill its Bot Challenge form, click,
   and wait through its scoring windows (5d.2 used 1.5 / 4 / 7 / 10 / 15 s). Driven via the existing
   action API (`click` / `type` / `wait`).
5. **Read the score field** via the snapshot/extract API.
6. `classify(raw)` → `{ outcome, score, reason }`.
7. Print the verdict line (`SCORED 0.xx → PASS` / `UNSCORED → FAIL`).
8. Append one row to `gym/results.md`.
9. Save a screenshot of the detector page as raw evidence.

## What gets tested

Only the real logic. `classify.test.ts` feeds sample detector outputs — **unscored**, **scored-bot**,
**scored-human** — and asserts the correct verdict, including the load-bearing rule that
**unscored → FAIL**. The live drive (steps 1–9) is *observed*, not asserted: it hits a real external
site whose availability and behavior aren't ours to guarantee. This is the honest split — pure logic
is unit-tested; the live run is operate-and-observe, the way 5d.2 ran.

## Honest-test guardrails (AGENTS.md "Testing Honesty")

- The detector is **not controlled** by Roi — its internals can't be rigged green.
- The test **can fail**, and is **expected to fail today** (UNSCORED). A clean recorded failure with
  the lesson ("Feather is invisible to behavioral scoring → add mouse-motion") is a *successful* run.
- **UNSCORED is a real FAIL**, never silently skipped or rounded up.
- Every run keeps a **screenshot + the raw field value**, so the verdict is backed by evidence, not
  self-graded.

## Explicitly NOT in Step 1

- The fable/iroh scoreboard wire (`project-fable/evals/`) — that is **Step 2**.
- The mouse-motion *fix* — that is the upgrade Step 1 *reveals*, built later.
- A second detector — the arena grows in Step 3.

## The one unknown to resolve during build (not by guessing)

The exact field/text on `bot.incolumitas.com` that distinguishes **scored** from **unscored**, and
the human-vs-bot threshold when a score *is* present. In 5d.2 the page showed `Your Behavioral
Score: ...` with no value ever filled in. Before `classify()` is finalized, confirm the real readable
verdict **live, operate-by-hand**, the same way 5d.2 did. No classifier thresholds are committed to
code until the live shape is confirmed.

## Open follow-ups (deliberately deferred)

- If `bot.incolumitas.com` proves too flaky or changes its surface, fall back to another free
  behavioral detector — but keep the "scored vs. unscored, agent-read" shape.
- The "watch the dial climb" payoff only lands after the mouse-motion upgrade exists; Step 1 ships the
  diagnostic, not the climb.
