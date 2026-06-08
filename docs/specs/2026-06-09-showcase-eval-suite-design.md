# Feather v1 Showcase & Eval Suite — Design

**Date:** 2026-06-09  
**Phase:** 4a (Feather v1 wrap)  
**Status:** Approved 2026-06-09 (post-review) — ready for `writing-plans` → Pass 1

---

## Purpose

A 10-task agent-driven suite that measures and shows off Feather's breadth before wrapping v1.
Two goals at once: internal measurement (find remaining gaps), and a polished external artifact
(shell script + results table + screenshots) for the GitHub repo and LinkedIn.

**This is a stress-and-learn instrument, not a trophy case.** We are not here to manufacture a row
of green checkmarks. We deliberately include tasks that *can* fail so we can (a) watch the fallback
mechanism actually fire, (b) learn the recipe to succeed next time, and (c) discover where headless
gives up and a headed/warmed approach is required. A task that fails cleanly and teaches a lesson is
a **successful test**, recorded as `PARTIAL` — not an embarrassment to hide. We always run the honest
hard version over the sanitized easy one; the result decides, not optimism. (Root principle:
`AGENTS.md` → "Testing Honesty — Objective, Not Flattering".)

---

## Two-pass execution model

**Pass 1 — Interactive agent session (live discovery)**  
Run the tasks turn-by-turn via the Feather HTTP API, like the IG test. No script needed.
I drive, you watch. Results logged manually. Goal: find what breaks, what's missing,
what's impressive. This pass informs the script.

**Pass 2 — Shell script (`examples/showcase.sh`)**  
A standalone bash script, modeled on `examples/quickstart.sh`. Drives Feather with `curl`.
Runs in one shot: `./examples/showcase.sh`. Prints a results table. Saves screenshots.
Filmable and repeatable. This is the public artifact.

### Proof / capture split — every task leaves evidence behind

- **Headed tasks (the hard tier, H1–H4)** → **screen recording**. These are the visually impressive
  ones — you *see* the browser act in a real warmed session. The film is the artifact.
- **Headless tasks (E1–M3)** → a **saved artifact** instead of footage: a screenshot of the result, the
  extracted text written to a file, and/or the row in `results.md`. A film of headless `curl` calls is
  just a scrolling table; the artifact (screenshot + extracted text + table) is the proof.
- Both feed the same `examples/showcase-output/` directory so one run produces a complete evidence set.

---

## Task list

### Easy — API surface proof (headless, public, repeatable)

| # | Errand | Site | Commands | Pass criterion |
|---|--------|------|----------|----------------|
| E1 | Summarize the top 3 Hacker News posts | news.ycombinator.com | navigate, markdown snapshot, extract | Extracted titles + point counts are non-empty |
| E2 | Get current weather in Tel Aviv | wttr.in/tel+aviv | navigate, extract | Temperature string extracted (e.g. "+28°C") |
| E3 | Find GitHub stars for the `playwright` repo | github.com/microsoft/playwright | navigate, extract | Stars count is a number > 0 |

### Medium — real interaction (headless, public)

| # | Errand | Site | Commands | Pass criterion |
|---|--------|------|----------|----------------|
| M1 | Search for "Feather Browser" → return first result title. **Try the normal JS DuckDuckGo first on purpose**; if bot-detection blocks it, fall back to the plain-HTML endpoint (`html.duckduckgo.com/html`) and record the lesson | duckduckgo.com → html.duckduckgo.com/html | navigate, type, press Enter, wait, snapshot | Non-empty first result title extracted (via either path; note which one worked) |
| M2 | Fill + submit a web form | httpbin.org/forms/post | navigate, type, click, screenshot | Confirmation page shown; screenshot saved |
| M3 | Extract a specific fact from Wikipedia (multi-step: search → click → extract) | en.wikipedia.org | navigate, type, click, wait, extract | Target fact string present in extracted output |

### Hard — where Feather is special

| # | Errand | Site | Commands | Pass criterion |
|---|--------|------|----------|----------------|
| H1 | Find the next Israeli public holiday → **attempt** to create a Google Calendar reminder through the UI | timeanddate.com → calendar.google.com (warmed) | navigate, extract, navigate (warmed), click, type, screenshot | **Baseline PASS:** holiday extracted + screenshotted. **Stretch:** event actually created in Calendar (screenshot confirms). Calendar-write is the deliberate fragile step — if the date-picker/dialog flow breaks, that's a `PARTIAL` with a recorded lesson, not a fail |
| H2 | Search a topic → navigate into the first result article → extract the content → write a 3-bullet summary | google.com (warmed) | navigate, click, wait, markdown snapshot, extract | **Script asserts the extraction** (non-empty article text pulled from inside the result). The 3-bullet summary is the visible payoff (agent synthesis), graded by human/recording, not the bash assertion |
| H3 | IG Explore → find a post → read comments → like + post a reply | instagram.com (warmed, feather_test_roi) | navigate (warmed), click, extract, click, type, click | Comment posted; screenshot confirms |
| H4 | Multi-tab research: open 3 tabs (3 different sites), extract one fact from each, return a comparative answer | 3 public sites | POST /tabs ×3, navigate ×3, extract ×3, screenshot | **Script asserts:** 3 facts extracted across 3 live tabs. The one-line comparison is the agent-synthesis payoff (human/recording graded, not the bash assertion) |

---

## Measurement schema

Each task produces:
- **Status:** `PASS` / `PARTIAL` / `FAIL`
  - `PASS` — assertion met cleanly.
  - `PARTIAL` — **a first-class, valuable outcome.** The primary attempt failed but the fallback fired
    (e.g. M1 normal→html, H1 create→holiday-screenshot), *or* the baseline passed while the stretch
    didn't. A `PARTIAL` must carry a **recorded lesson**: what broke, whether the fallback worked, how
    to succeed next time, or what not to attempt. This is the suite's actual payoff — not a black mark.
  - `FAIL` — no result and no useful lesson (the case we genuinely want to avoid).
- **Assertion:** the programmatic check the *script* can self-verify (string match, non-empty, count > 0).
  Agent-synthesis steps (summaries, comparisons) are graded by human/recording, not the bash assertion.
- **Artifact (every task, not just screenshots):** headed tasks → screen recording; headless tasks →
  screenshot of the result and/or extracted text written to `examples/showcase-output/<task-id>-<timestamp>.*`.
- **Lesson:** one line — what worked, what was surprising, what broke, and the takeaway for next time.

**Results table format** (printed at end of shell script run, also saved to `examples/showcase-output/results.md`):

```
Task  | Status  | Time  | Notes
------+---------+-------+------
E1    | PASS    | 4.2s  | Extracted 3 titles + scores
E2    | PASS    | 2.1s  | "28 °C"
...
H4    | PASS    | 38s   | Comment posted; IG markup required nth-selector fallback
```

---

## Shell script design (`examples/showcase.sh`)

Modeled on `examples/quickstart.sh`:
- Reads `endpoint.json` for `baseUrl` + `tokenFile`
- Creates a fresh disposable session for easy/medium tasks
- Uses the `scratch` workspace (`workspaceId: scratch`) for hard tasks that need warmed sessions
- Each task is a function: `run_e1`, `run_e2`, etc.
- Each function prints `[E1] PASS 4.2s` or `[E1] FAIL — <reason>`
- Screenshots saved with `curl ... | jq -r .data.path` → copied to output dir
- Final table printed to stdout + written to `examples/showcase-output/results.md`

**No new runtime dependencies** — bash + curl + jq (already used in quickstart.sh).

---

## Constraints and known risks

- **Warmed session dependency (H1–H4):** scratch profile must have the warmed Google + IG sessions. If the profile is cold, hard tasks fail. Document in the script's prerequisites section.
- **IG markup instability (H3):** IG has no stable selectors. Expect nth-selector fallbacks. If IG changes its markup, this task breaks — acceptable for v1.
- **Google Calendar creation (H1) — fragile *on purpose*.** Creating events via UI automation is brittle (date pickers, dialog flows). We keep it as the deliberate test of the fallback path: baseline PASS = holiday extracted + screenshotted; the calendar-write is the stretch. If it breaks in Pass 1, that's a `PARTIAL` + lesson (does the fallback fire cleanly? what's the recipe to make the write work next time?), which is exactly what we want to learn.
- **Multi-tab (H4):** `POST /tabs` creates a blank tab; must follow with explicit `/navigate`. Session must remain open across all 3 tab operations.
- **Headless public tasks (E1–M3):** safest tier, but some sites bot-detect (DuckDuckGo especially). Per the stress-and-learn intent we **run the normal endpoint first on purpose** (M1); if it's blocked, the agent falls back to the plain-HTML endpoint and we record which path worked and why. The block-then-fallback is a feature of the test, not a failure to route around.
- **E3 GitHub stars parsing:** the star count renders as formatted text (e.g. `65.2k`), not a raw integer. The assertion must parse the `k`/`m` suffix before the `> 0` check, or assert non-empty + numeric-after-normalization.
- **Recording:** Pass 2 (the script) is the filmable artifact. Pass 1 is not filmed — it's a working session.

---

## What this tells us about v1 gaps

After Pass 1, the results feed the v1 gap decision:
- **If headless tasks hit bot-detection** → act-human typing cadence is a v1 ship, not a defer.
- **If warmed-session tasks work cleanly** → cookie mine story is proven beyond the IG test.
- **If H4 (multi-tab) is rough** → tab API docs need a clearer recipe in the agent playbook.
- **Any new selector-discovery friction** → feeds into the a11y/DOM snapshot idea from the IG test learnings.

---

## Out of scope (v2)

- Navigation-survivable resume banner (re-inject on `framenavigated`) — v2 MFA Handler
- Act-human typing cadence (kinematic input) — v2 stealth (5d)
- Bot self-check diagnostic — v2 stealth (5d)

---

## Revision log

### 2026-06-09 — review pass (Roi + agent)
Folded in during the spec review:
- **Reframed the whole suite as a stress-and-learn instrument**, not a trophy case (new Purpose para).
  Roi: "i never want you to go the easy way to please me. i want to actually, objectively, test and learn."
  Captured as a durable principle in root `AGENTS.md` ("Testing Honesty — Objective, Not Flattering").
- **`PARTIAL` is now a first-class outcome** carrying a recorded lesson — fallback firing / baseline-passed-
  stretch-failed is a *successful* test.
- **Proof/capture split:** headed (H1–H4) → screen recording; headless (E1–M3) → saved artifact
  (screenshot + extracted text + `results.md`). Every task leaves evidence.
- **M1:** run the normal JS DuckDuckGo *first on purpose*; bot-block → fall back to `html.duckduckgo.com/html`
  and record which path worked (deliberate fallback lesson).
- **H1:** calendar-write kept as the deliberate fragile step; holiday-extract+screenshot = baseline PASS,
  event-creation = stretch; breakage = `PARTIAL` + lesson.
- **H2/H4:** clarified the bash assertion sits on the *extraction* (what a script can self-verify); the
  summary/comparison is the agent-synthesis payoff, graded by human/recording.
- **E3:** noted GitHub star count renders as `65.2k`-style text — assertion must normalize the suffix.
- Fixed stray `H6` reference (→ `H4`).

### Resolved
- **Recording tool:** `wf-recorder` (Wayland) — installed on Roi's box. Use it to film the headed tier.
- **Approval:** approved by Roi 2026-06-09 after the review pass. Next step = `writing-plans`.
