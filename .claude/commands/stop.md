# /stop — Pause Feather Browser Work

Pause and write a handoff.

1. Analyze the conversation:
   - Done this session
   - Left unfinished
   - Next concrete action
   - Decisions
   - Ideas
   - 3-5 verbatim Roi quotes
2. Ask:
   - Is that right — anything to add or correct?
   - What should the next session focus on?
   - Anything specific to flag?
3. **Blog check:** did a phase complete, or did a significant decision land this session? If yes, write or update a `blog/NNNN-slug.md` entry (first-person, hero's-journey, ends with a LinkedIn cut) and update `blog/README.md` index. If no, skip.
4. Write `ops/sessions/<nickname>-<timestamp>.md`.
5. Update `context/active.md`.
6. **Reconcile desk context.** Identify which desk(s) this session advanced (`browser` / `product` / `automation` / `general`). For those desks only, if a durable desk-level fact changed (architecture decision, spike result, corrected fact), update `work/<desk>/context.md`. Skip untouched desks; do not copy volatile next-action state (that lives in `context/active.md`).
7. Update `ops/phase.md`.
8. Archive `ops/tasks.md` to `ops/archive/tasks-<timestamp>.md`.
9. Update `ops/tasks.md`.
10. Append a `STOP` line to `log.md`.
11. Write `.remember/remember.md`.
12. Commit the changed tracking files.

