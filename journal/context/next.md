# Next — Context Bridge

_Empty buffer. The last bundle (08:17–11:55, 2026-06-09 — showcase Stage 3 → re-warm → M+H discovery →
hard-tier pass → close-tab) was consumed at the 2026-06-09 ~11:48 `/stop` and archived to
`journal/archive/next/2026-06-09/1148-stop-bundle-hard-tier-close-tab.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

2026-06-09 | NEXT | Daily-driver launch convenience + profile-state correction. User wanted to use Feather as
plain Chromium for Cookie Mine, no automation. Added uncommitted wrapper `scripts/start-daily-driver.sh` plus npm
aliases: `npm run daily` -> `primary`, `npm run daily:scratch` -> `scratch`; verified with `bash -n` and
`npm run typecheck`. Important finding: `primary` really is selected by `npm run daily`, but it is basically fresh
(~7MB, tiny Cookies DB); the warmed cookies/logins are currently in `scratch` (~150MB, larger Cookies/History).
Recommended use now: `npm run daily:scratch` for already-warmed state, or log into `primary` once and close cleanly
to warm it. If Roi wants primary to inherit scratch, do a backed-up copy/migration explicitly; do not silently merge
profiles.
