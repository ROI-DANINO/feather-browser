# /stop — Pause Feather Browser Work

## Purpose

Pause the session, write a durable handoff, update project state, and commit the tracking files.

## Steps

1. Analyze the conversation for completed work, unfinished work, decisions, ideas, and next action.
2. Ask three questions:
   - Is that right — anything to add or correct?
   - What should the next session focus on?
   - Anything specific to flag?
3. Write a new session file at `ops/sessions/<nickname>-<timestamp>.md`.
4. Update `context/active.md`.
5. Update `ops/phase.md`.
6. Archive `ops/tasks.md` to `ops/archive/tasks-<timestamp>.md`.
7. Update `ops/tasks.md` with in-progress, active, and done items.
8. Append one line to `log.md`.
9. Write `.remember/remember.md`.
10. Commit the changed tracking files.

## Writes

- `ops/sessions/`
- `context/active.md`
- `ops/phase.md`
- `ops/tasks.md`
- `ops/archive/`
- `log.md`
- `.remember/remember.md`

