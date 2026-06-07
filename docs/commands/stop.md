# /stop — Pause Feather Browser Work

## Purpose

Pause the session, write a durable handoff, update project state, and commit the tracking files.

## Steps

1. Check `journal/context/next.md`. If it exists and contains pending `/next` entries, read all accumulated entries and fold them into the analysis below as prior-chat context. Ignore header-only or already-reset buffers.
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
11. Update `.remember/remember.md` if the current stop flow uses it as a short immediate handoff.
12. Append one line to `journal/log.md`.
13. If `journal/context/next.md` had pending entries, archive the consumed buffer instead of deleting it:
    - Single entry: `journal/archive/next/YYYY-MM-DD/HHMM-<short-session-name>.md`
    - Multiple entries: `journal/archive/next/YYYY-MM-DD/HHMM-stop-bundle-<short-session-name>.md`
14. Reset `journal/context/next.md` to an empty active buffer after archiving consumed entries. Leave no stale pending content behind.
15. If any temporary stop draft, next-bundle draft, or other project-memory scratch file would otherwise be overwritten or removed, move it into `journal/archive/handoffs/YYYY-MM-DD/HHMM-<short-name>.md` first. Durable session files in `journal/ops/sessions/` are append-only history and should not be overwritten.
16. Commit the changed tracking files.

## Writes

- `journal/ops/sessions/`
- `journal/context/active.md`
- `journal/work/<desk>/context.md` (only desks advanced this session, only when a durable fact changed)
- `journal/ops/phase.md`
- `journal/ops/tasks.md`
- `journal/ops/archive/`
- `.remember/remember.md` (when used by the active stop flow)
- `journal/log.md`
- `journal/archive/next/` (when `/stop` consumes pending `/next` entries)
- `journal/archive/handoffs/` (when superseded temporary handoff material must be preserved)
- `journal/context/next.md` is reset after archive; it is not deleted for lifecycle cleanup
