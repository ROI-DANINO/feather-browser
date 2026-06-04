# /start — Resume Feather Browser Work

## Purpose

Orient the agent at the beginning of a Feather Browser session. `/start` is read-only: it loads context, reports state, and asks before doing work.

## Steps

1. Read `README.md`, `ROADMAP.md`, `PROGRESS.md`, `journal/README.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/context/active.md`, and the last 20 lines of `journal/log.md`. If `journal/context/next.md` exists, read it too — it is more recent than `active.md` and holds snapshots from prior `/next` chats.
2. Check `journal/raw/_inbox/` for unprocessed files. If files exist, report the count and ask whether to process them or continue.
3. Report the last known phase, active task, next action, and relevant desk.
4. If a desk is relevant, ask before loading `journal/work/<desk>/context.md`.
5. Ask: "Ready to continue, or do you want to start somewhere else?"

> Source-of-truth for each doc surface: see `journal/docs-map.md`.

## Writes

None.

