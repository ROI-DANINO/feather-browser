# /stop — Pause Feather Browser Work

## Purpose

Pause the session, write a durable handoff, update project state, and commit the tracking files.

## Steps

1. Analyze the conversation for completed work, unfinished work, decisions, ideas, and next action.
2. Ask three questions:
   - Is that right — anything to add or correct?
   - What should the next session focus on?
   - Anything specific to flag?
3. **Blog check:** did a phase complete, or did a significant decision land this session? If yes, write or update a `blog/NNNN-slug.md` entry (first-person, hero's-journey, ends with a LinkedIn cut) and update `blog/README.md` index. If no, skip.
4. Write a new session file at `ops/sessions/<nickname>-<timestamp>.md`.
5. Update `context/active.md`.
6. **Reconcile desk context.** Determine which desk(s) this session advanced (`browser` / `product` / `automation` / `general`). For *those desks only*, if a **durable** desk-level fact changed — a new architecture decision, a spike result, or a corrected fact — update `work/<desk>/context.md`. Do not touch desks the session did not advance. Do not copy volatile next-action state here; that lives in `context/active.md`.
7. Update `ops/phase.md`.
8. Archive `ops/tasks.md` to `ops/archive/tasks-<timestamp>.md`.
9. Update `ops/tasks.md` with in-progress, active, and done items.
10. Append one line to `log.md`.
11. Write `.remember/remember.md`.
12. Commit the changed tracking files.

## Writes

- `ops/sessions/`
- `context/active.md`
- `work/<desk>/context.md` (only desks advanced this session, only when a durable fact changed)
- `ops/phase.md`
- `ops/tasks.md`
- `ops/archive/`
- `log.md`
- `.remember/remember.md`

