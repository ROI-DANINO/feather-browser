# Gym Step 1 — Live Recon Findings (bot.incolumitas.com)

**Date:** 2026-06-26 · **Method:** `npm run gym:behavioral` (recon mode), headed `chromium-headed-cdp`,
disposable profile, no login. Session `ses_1bf7fe98f3`. Evidence: `gym/runs/recon-2026-06-26T19-21-17-733Z.png`.

These findings calibrate Task 4. Confirmed live, not guessed.

## 1. Score field

The behavioral score is rendered as labelled text in the page body:

```
Your Behavioral Score: ...
```

It sits in the "### Behavioral Bot Classification" section and is returned by Feather's `snapshot`
(markdown) — it appeared in the recon dump. **No fragile DOM-id selector is needed; parse the
snapshot text after `Your Behavioral Score:` instead.** (This refines the plan's `SCORE_SELECTOR`/
`extract` approach — recon showed snapshot-parsing is more robust.)

## 2. Scored vs. unscored shape

- **Unscored:** the value reads `...` (literal ellipsis, no digit). This is what Feather got.
- **Scored:** a number between 0 and 1 (e.g. `0.83`) replaces the `...`.
- Parsing rule: pull the first number out of the captured value; if there is none, it is UNSCORED.

## 3. Direction + threshold (from the page's own legend)

> "The test `behavioralClassificationScore` gives a rating between **0 (Bot)** and **1 (Human)** …
> A **score below 0.5** means that you are most likely a bot."

→ `direction: "higherIsHuman"`, `humanThreshold: 0.5`.

## 4. Interaction needed

**None for the diagnostic.** The score auto-computes from browsing, updating at 1.5 / 4 / 7 / 10 / 15s.
The honest test is: navigate, wait past 15s, read. (5d.2 additionally filled the "Bot Challenge" form
and still got `...`, so interaction does not change the outcome — the missing signal is cursor motion,
which Feather does not produce.)

## 5. Outcome confirmed live

Feather reads **UNSCORED → FAIL** — the detector cannot score a session with no cursor path. This is
the diagnostic working: **the upgrade to focus on is mouse-motion.**
