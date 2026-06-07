# /start — Resume Feather Browser Work

## Purpose

Orient the agent at the beginning of a Feather Browser session. `/start` is read-only: it loads context, reports state, and asks before doing work.

## Steps

1. Read `README.md`, `ROADMAP.md`, `PROGRESS.md`, `journal/README.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/context/active.md`, and the last 20 lines of `journal/log.md`.
2. If `journal/context/next.md` exists and contains pending `/next` entries, read it as the freshest short-term bridge between chats.
3. Compare `journal/context/next.md` with `journal/context/active.md` when both describe current work:
   - If they agree, treat `next.md` as the freshest confirmation.
   - If `next.md` cleanly advances the same thread, report that it is the newer bridge.
   - If they conflict, report the conflict explicitly and ask which thread/state to treat as current. Do not guess.
4. Check `journal/raw/_inbox/` for unprocessed files. If files exist, report the count and ask whether to process them or continue.
5. Report the last known phase, active task, next action, relevant desk, and whether `next.md` has pending bridge material.
6. If a desk is relevant, ask before loading `journal/work/<desk>/context.md`.
7. Ask: "Ready to continue, or do you want to start somewhere else?"

## Default exclusions

- Do not read `journal/archive/**` by default.
- Do not read `journal/ops/archive/**` by default unless the active docs explicitly point there.
- Do not read `journal/raw/archive/**` by default.

> Source-of-truth for each doc surface: see `journal/docs-map.md`.

## Writes

None.
