# Session — Core-first reorientation EXECUTED (Phase 4a) + shipped public

**When:** 2026-06-05 (~18:53 stop)
**Desk:** product (positioning → work order) + browser (demo touches the live API surface)
**Branch:** dev (working branch); pushed to origin/dev. Public default branch = `dev`.
**Prior-chat context folded in:** `journal/context/next.md` (2026-06-05 18:01 — spec+plan landed, not yet executed).

## Headline

Executed `docs/plans/2026-06-05-core-first-reorientation.md` end-to-end via
**subagent-driven-development** (fresh implementer + spec-compliance review + code-quality review
per task, then a final holistic pass). **Feather Core is now publicly runnable and live on the
default branch.** No `src/` feature changes — pure docs + one verified bash demo.

## What shipped (7 commits, `8d42aab`..`16f5ab7`; pushed `387d601..16f5ab7`)

1. **`8d42aab` + `b7d9469`** — `examples/quickstart.sh` + `examples/README.md`. Full session loop
   (health→launch→navigate→snapshot→extract→screenshot→debug-bundle→close) ran **green** against a
   live `npm run dev` (8/8, `state=closed`, exit 0). The plan's script matched `src/` reality
   exactly — no API corrections needed. Follow-up (`b7d9469`): friendly "is Feather running?" message
   on a non-JSON health/`field()` response instead of a raw Node stack trace (code-review polish).
2. **`d87e071` + `3aa1d9d`** — `README.md` artifact-forward launch rewrite (what it is / who it's for
   / see it work / honest limits / for-AI-agents / built-in-the-open). Fixed two stale doc bugs:
   server does **not** bind `:3000` (OS-assigned port via `endpoint.json`); token file is
   `<runtime>/feather/run/control-token`, not `.feather/token`. Follow-up (`3aa1d9d`): removed an
   unimplemented "screenshots" claim from the debug-bundle bullet (`opts.screenshots` is a no-op in
   `src/debug/capture.ts` — code-review caught the overclaim).
3. **`d921304`** — `ROADMAP.md`: public "Core vs. Shell" split + Phase 4 → 4a (Core, now) / 4b
   (Visual Desktop Shell, after).
4. **`c0137f3`** — steering files → Phase 4a (`tasks.md` active track swapped; `phase.md` sub_phase;
   `active.md` was already updated by the prior session — staged as-is, no duplicate).
5. **`16f5ab7`** — final gate: **184 unit tests pass**, `tsc --noEmit` exit 0, demo re-verified green
   against a fresh server; `journal/log.md` SHIP line.

## Verification (all fresh this session)

- `npm test` → **184 passed (25 files)**; `npm run typecheck` → exit 0.
- `examples/quickstart.sh` → green end-to-end, twice (Task 1 + Task 5 final gate).
- New error path tested: non-JSON health body → friendly message + exit 1, no stack trace.
- Final holistic review: **READY TO SHIP** — all 5 spec acceptance criteria MET; only 3 internal-only
  staleness notes (handled by this stop).

## Key facts the reviews surfaced

- Demo author audited every route/field against `src/` before writing — plan script was accurate.
- Two README doc-bugs were never code bugs — they were stale claims; only a *running* demo caught
  them. (This became the blog 0009 beat.)
- GitHub **default branch is `dev`** → pushing `dev` makes the public README + demo live; no
  `master` merge required for the LinkedIn debut. `master` is 33 behind (housekeeping, Roi's call).

## Decisions

- "Core first, Shell later" is now the **work order**, not just messaging.
- Phase 4 = **4a (Core readiness — DONE this session)** → **4b (Visual Desktop Shell — next track)**.
  No renumbering (Phase 5 = agent runtime).
- Execution stayed on `dev` directly (the working branch); public debut goes out on `dev`.
- Subagent-driven-development used as requested; each task double-reviewed (spec then quality).

## Roi's calls this stop

- Summary accurate → proceed.
- **Next focus = merge `dev`→`master`** ("but only if dev is stable" — it is, verified green this
  session), **then LinkedIn debut polish in a separate session** (demo GIF/asciinema). Phase 4b
  shell-stack follows.
- Write blog 0009 → done (`0009-the-demo-that-fact-checked-me.md`).

## Verbatim Roi quotes

- "i want to execute ... /subagent-driven-development"
- "set up your tasks"
- "what does the demo demonstrait?"
- (next focus) "3 but only if dev is stable, then 2 in a different session"

## Open / next

- **NEXT SESSION:** confirm `dev` stable (already green) → **merge `dev`→`master`** (milestone
  graduation; Roi's call, like PR #1). Then, separately, **LinkedIn debut polish** (optional demo
  GIF/asciinema; actually post).
- **After that:** Phase 4b — shell-stack joint call (ADR-0009 GTK4+Casilda; Casilda+Chromium
  latency/input spike) → Phase-4 GUI (`research/2026-06-05-phase4-gui-architecture-sketch.md`).
- Parked (unchanged): cookie-isolation on real `primary` (measure DBSC read-only first); vault
  backend (ADR-0008 frozen); sudo Xvfb WebGL table.
