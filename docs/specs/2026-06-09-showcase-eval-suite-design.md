# Feather v1 Showcase & Eval Suite — Design

**Date:** 2026-06-09  
**Phase:** 4a (Feather v1 wrap)  
**Status:** Approved, ready for implementation plan

---

## Purpose

A 10-task agent-driven suite that measures and shows off Feather's breadth before wrapping v1.
Two goals at once: internal measurement (find remaining gaps), and a polished external artifact
(shell script + results table + screenshots) for the GitHub repo and LinkedIn.

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
| M1 | Search DuckDuckGo for "Feather Browser" → return first result title | duckduckgo.com | navigate, type, press Enter, wait, snapshot | Non-empty first result title extracted |
| M2 | Fill + submit a web form | httpbin.org/forms/post | navigate, type, click, screenshot | Confirmation page shown; screenshot saved |
| M3 | Extract a specific fact from Wikipedia (multi-step: search → click → extract) | en.wikipedia.org | navigate, type, click, wait, extract | Target fact string present in extracted output |

### Hard — where Feather is special

| # | Errand | Site | Commands | Pass criterion |
|---|--------|------|----------|----------------|
| H1 | Find the next Israeli public holiday → create a Google Calendar reminder | timeanddate.com → calendar.google.com (warmed) | navigate, extract, navigate (warmed), click, type, screenshot | Event appears in Calendar; screenshot confirms creation |
| H2 | Google search a topic → navigate to first result → extract + write a 3-bullet summary | google.com (warmed) | navigate, click, wait, markdown snapshot, extract | 3 non-empty bullet points returned |
| H3 | IG Explore → find a post → read comments → like + post a reply | instagram.com (warmed, feather_test_roi) | navigate (warmed), click, extract, click, type, click | Comment posted; screenshot confirms |
| H4 | Multi-tab research: open 3 tabs (3 different sites), extract one fact from each, return a comparative answer | 3 public sites | POST /tabs ×3, navigate ×3, extract ×3, screenshot | 3 facts extracted; agent synthesizes a one-line comparison |

---

## Measurement schema

Each task produces:
- **Status:** `PASS` / `FAIL` / `PARTIAL`
- **Assertion:** the programmatic check (string match, non-empty, count > 0)
- **Screenshot:** saved to `examples/showcase-output/<task-id>-<timestamp>.png` where relevant
- **Notes:** one line — what worked, what was surprising, what broke

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
- **Google Calendar creation (H1):** Creating events via UI automation is fragile (date pickers, dialog flows). If it proves too brittle in Pass 1, fall back to just extracting the holiday and screenshotting it without the Calendar creation step.
- **Multi-tab (H4):** `POST /tabs` creates a blank tab; must follow with explicit `/navigate`. Session must remain open across all 3 tab operations.
- **Headless public tasks (E1–M3):** These are the safest but may hit bot-detection on some sites (DuckDuckGo in particular). If M1 fails headless, try a different search engine.
- **Recording:** Pass 2 (the script) is the filmable artifact. Pass 1 is not filmed — it's a working session.

---

## What this tells us about v1 gaps

After Pass 1, the results feed the v1 gap decision:
- **If headless tasks hit bot-detection** → act-human typing cadence is a v1 ship, not a defer.
- **If warmed-session tasks work cleanly** → cookie mine story is proven beyond the IG test.
- **If H6 (multi-tab) is rough** → tab API docs need a clearer recipe in the agent playbook.
- **Any new selector-discovery friction** → feeds into the a11y/DOM snapshot idea from the IG test learnings.

---

## Out of scope (v2)

- Navigation-survivable resume banner (re-inject on `framenavigated`) — v2 MFA Handler
- Act-human typing cadence (kinematic input) — v2 stealth (5d)
- Bot self-check diagnostic — v2 stealth (5d)
