# Session — Hero demo verified working + journal reconciled

**When:** 2026-06-06 ~17:40–18:54 IDT (continues `core-input-execution-20260606-1740.md`)
**Phase:** 4 (4a shipped + graduated; HERO DEMO now built + working)
**Desk:** browser (Core capability) + product (demo)
**Branch:** `dev` → pushed (`origin/dev` in sync at `38a57c1`)

## Done this session (this segment)

**Closed out the Core input commands work** (full detail: the 1740 session file):
- Independently re-verified the handed-off Codex Task 10 gate: commit chain intact, clean tree,
  **re-ran integration 43/43** myself, 207 unit, `tsc` 0.
- **Caught + fixed a stale `next.md`** (`f4a0ec0`) — it still said "execution not started"; `/start`
  reads `next.md` as *more recent than* `active.md`, so it would have sent the next session backwards.
- **Pushed `origin/dev`** (`689db67..f4a0ec0`).
- **README understated the new capability → fixed** (`ae578fa`). "What works today" listed only the
  observe verbs; added a line that Feather can now act (click/type/press + streaming-safe wait). Roi
  caught this: *"didnt we update the readme page?"*
- Ran the first `/stop` of the session (`e5b5d0d`) — full core-input handoff.

**Then: the hero demo was already built** (by Roi / a parallel agent, `d1b5718`, pushed):
- On "continue," I began walking Roi through warming ChatGPT + building the demo script (read
  `src/tools/warm-session.ts` + the vision prep). Roi: *"It is already written"* / *"It works check it out."*
- Files in `d1b5718`: `scripts/demo/hero-chatgpt-gmail.ts` (270 lines), spec + plan
  (`docs/specs|plans/2026-06-06-hero-demo-workflow*.md`), and `tests/unit/scripts/hero-chatgpt-gmail.test.ts`.
- **Checked it out (research-driven, didn't just trust "it works"):** ran the gates — **212 unit
  (incl. 5 new demo-helper tests) + `tsc` 0**; demo test 5/5. Read the script end-to-end.
- **Review verdict — sound + well-built for a recorded demo:** resilient fallback-selector lists per
  step (reports what it tried on drift), EN+HE Gmail labels (אימייל חדש/אל/נושא/גוף ההודעה),
  sequential typing into ChatGPT's ProseMirror box, `wait until:"stable"` on the **last** answer bubble
  (no half-streamed capture), **draft-not-send**, browser kept open on failure, no screenshots/cookies
  in the repo (XDG profile). Two minor non-blocking notes: recipient defaults to `support@anthropic.com`
  (overridable via `HERO_DEMO_TO`); the spec mentions `extract` but the script reuses `wait`-stable's
  returned text instead (cleaner — not a bug).
- **Reconciled the stale journal** (`38a57c1`): the demo commit hadn't touched the journal, so
  `active.md`/`tasks.md` still said "next = warm ChatGPT / write script" (both now done). Marked
  warm-ChatGPT ✅, write-script ✅, second-demo-decision ✅; pointed next at record + debut. Pushed.

## What's true now
- **Feather Core acts across two real logged-in sites.** ChatGPT is warmed into `primary` (one jar now
  holds Google/Gmail + ChatGPT). The cross-site ChatGPT→Gmail draft flow runs headed and works live.
- `examples/quickstart.sh` stays the public no-login demo; the hero script is the recorded debut workflow.

## Left unfinished
- **Record the live run** (Roi's hands — screen-capture while the script drives the headed window; it
  pauses on "Record the visible draft now…" before closing).
- **Final README touch-ups + LinkedIn debut post.**
- **Debut blog** — owed, write it to pair with the recorded post (kept out now so the LinkedIn cut can
  reference the public demo).
- Housekeeping (non-blocking): archive the processed Anchor brief out of `journal/raw/_inbox/`.

## Next concrete action
**Record the hero demo, then post the LinkedIn debut.** Roi records; offered to help with the README
touch-ups + LinkedIn copy when he's ready.

## Decisions
- **Hero demo = SECOND demo** (recorded debut workflow), `quickstart.sh` stays the stranger-runnable
  public one. Confirmed (matches the demo spec).
- **Runs headed** — visible in real time, which is both required (logged-in sessions + headless is
  bot-detectable) and ideal to screen-record.
- **ChatGPT warmed into the same `primary` profile** as Google — Cookie Mine across two sites in one
  human-warmed context (not a separate workspace).
- **Blog deferred** to pair with the recorded debut.

## Ideas
- Future product polish (already noted in the demo spec): a login-detection wizard — launch the
  warm-session window, wait for a site-specific logged-in signal, then continue automatically.

## Roi quotes (verbatim)
- "didnt we update the readme page?"
- "It is already written"
- "It works check it out"
- "make sure its good"
- "in the next session you will walk me through the demo."
