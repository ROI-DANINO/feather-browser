# /stop — Pause Feather Browser Work

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Pause and write a handoff.

1. Check for `journal/context/next.md`. If it exists, read it and fold all its timestamped sections into the analysis below as prior-chat context.
2. Analyze the conversation:
   - Done this session (including any prior-chat sections from `next.md`)
   - Left unfinished
   - Next concrete action
   - Decisions
   - Ideas
   - 3-5 verbatim Roi quotes
3. Ask:
   - Is that right — anything to add or correct?
   - What should the next session focus on?
   - Anything specific to flag?
4. **Blog check:** did a phase complete, or did a significant decision land this session? If yes, write or update a `blog/NNNN-slug.md` entry (first-person, hero's-journey, ends with a LinkedIn cut) and update `blog/README.md` index. If no, skip.
5. Write `journal/ops/sessions/<nickname>-<timestamp>.md`.
6. Update `journal/context/active.md`.
7. **Reconcile desk context.** Identify which desk(s) this session advanced (`browser` / `product` / `automation` / `general`). For those desks only, if a durable desk-level fact changed (architecture decision, spike result, corrected fact), update `journal/work/<desk>/context.md`. Skip untouched desks; do not copy volatile next-action state (that lives in `journal/context/active.md`).
8. Update `journal/ops/phase.md`.
9. Archive `journal/ops/tasks.md` to `journal/ops/archive/tasks-<timestamp>.md`.
10. Update `journal/ops/tasks.md`.
11. Append a `STOP` line to `journal/log.md`.
12. If `journal/context/next.md` existed (step 1), delete it.
13. Commit the changed tracking files.
