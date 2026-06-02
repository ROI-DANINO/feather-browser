# /start — Resume Feather Browser Work

## Purpose

Orient the agent at the beginning of a Feather Browser session. `/start` is read-only: it loads context, reports state, and asks before doing work.

## Steps

1. Read `README.md`, `ROADMAP.md`, `PROGRESS.md`, `schema.md`, `ops/tasks.md`, `ops/phase.md`, `context/active.md`, and the last 20 lines of `log.md`.
2. Check `raw/_inbox/` for unprocessed files. If files exist, report the count and ask whether to process them or continue.
3. Report the last known phase, active task, next action, and relevant desk.
4. If a desk is relevant, ask before loading `work/<desk>/context.md`.
5. Ask: "Ready to continue, or do you want to start somewhere else?"

> Source-of-truth for each doc surface: see `docs/docs-map.md`.

## Writes

None.

