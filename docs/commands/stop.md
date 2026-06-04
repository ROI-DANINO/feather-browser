# /stop — Pause Feather Browser Work

## Purpose

Pause the session, write a durable handoff, update project state, and commit the tracking files.

## Steps

1. Check for `journal/context/next.md`. If it exists, read it and fold all its timestamped sections into the analysis below as prior-chat context.
2. Analyze the conversation for completed work, unfinished work, decisions, ideas, and next action (including any prior-chat sections from `next.md`).
3. Ask three questions:
   - Is that right — anything to add or correct?
   - What should the next session focus on?
   - Anything specific to flag?
4. **Blog check:** did a phase complete, or did a significant decision land this session? If yes, write or update a `blog/NNNN-slug.md` entry (first-person, hero's-journey, ends with a LinkedIn cut) and update `blog/README.md` index. If no, skip.
5. Write a new session file at `journal/ops/sessions/<nickname>-<timestamp>.md`.
6. Update `journal/context/active.md`.
7. **Reconcile desk context.** Determine which desk(s) this session advanced (`browser` / `product` / `automation` / `general`). For *those desks only*, if a **durable** desk-level fact changed — a new architecture decision, a spike result, or a corrected fact — update `journal/work/<desk>/context.md`. Do not touch desks the session did not advance. Do not copy volatile next-action state here; that lives in `journal/context/active.md`.
8. Update `journal/ops/phase.md`.
9. Archive `journal/ops/tasks.md` to `journal/ops/archive/tasks-<timestamp>.md`.
10. Update `journal/ops/tasks.md` with in-progress, active, and done items.
11. Append one line to `journal/log.md`.
12. If `journal/context/next.md` existed (step 1), delete it.
13. Write `.remember/remember.md`.
14. Commit the changed tracking files.

## Writes

- `journal/ops/sessions/`
- `journal/context/active.md`
- `journal/work/<desk>/context.md` (only desks advanced this session, only when a durable fact changed)
- `journal/ops/phase.md`
- `journal/ops/tasks.md`
- `journal/ops/archive/`
- `journal/log.md`
- `.remember/remember.md`
- Deletes `journal/context/next.md` if present
