# Archived `/next` buffer — consumed at 2026-06-10 ~01:42 STOP

Single pending entry, carried from the 2026-06-09 prior chat into this session and resolved here
(daily-driver wrapper committed `61fe677` + `primary` re-warmed). Full handoff:
`journal/ops/sessions/daily-driver-background-launch-primary-rewarmed-20260610-0142.md`.

---

2026-06-09 | NEXT | Daily-driver launch convenience + profile-state correction. User wanted to use Feather as
plain Chromium for Cookie Mine, no automation. Added uncommitted wrapper `scripts/start-daily-driver.sh` plus npm
aliases: `npm run daily` -> `primary`, `npm run daily:scratch` -> `scratch`; verified with `bash -n` and
`npm run typecheck`. Important finding: `primary` really is selected by `npm run daily`, but it is basically fresh
(~7MB, tiny Cookies DB); the warmed cookies/logins are currently in `scratch` (~150MB, larger Cookies/History).
Recommended use now: `npm run daily:scratch` for already-warmed state, or log into `primary` once and close cleanly
to warm it. If Roi wants primary to inherit scratch, do a backed-up copy/migration explicitly; do not silently merge
profiles.

---

**Resolution this session (2026-06-10):** wrapper rewritten to launch detached/background + `daily:stop` helper added
(commit `61fe677`, pushed). Profile-state correction landed: the empty `primary` was traced to a deliberate
2026-06-08 delete (at Roi's request, no backup); Roi then re-warmed `primary` with his REAL personal Google
(438MB / 306 cookies / full auth set). `primary` is now Roi's live daily-driver Cookie-Mine identity; `scratch`
stays the test identity. No silent merge performed.
