# /start — Resume Feather Browser Work

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Run each step before doing anything else.

1. Read in parallel:
   - `README.md`
   - `ROADMAP.md`
   - `journal/context/active.md` — **the state owner** (where we are, what's next)
   - `journal/ops/tasks.md`
   - `journal/ops/phase.md`
   - last 15 lines of `journal/log.md`

   Then read `journal/context/next.md` **if it exists and contains pending entries**. Treat it as the
   freshest short-term bridge, not as an automatic override.

   Warm (load on demand, not at `/start`): `PROGRESS.md` (pointer), `journal/README.md`,
   `journal/docs-map.md`, `journal/ops/archive/`, `journal/archive/`, `journal/raw/archive/`.
2. Check `journal/raw/_inbox/` for files other than `README.md`. If any exist, report the count and ask whether to process them now or continue.
3. Compare `journal/context/next.md` against `journal/context/active.md` when both point at current work:
   - if aligned, say so
   - if `next.md` advances the same thread, call it the fresher bridge
   - if they conflict, report the conflict and ask which state to continue from
4. Report:
   - Last known phase
   - Current in-progress or active task
   - Next concrete action
   - Whether `next.md` has pending bridge material
   - Relevant desk you'd suggest: `product`, `browser`, `automation`, or `general` (suggest only —
     do NOT read its context yet)
5. Ask: "Ready to continue, or do you want to start somewhere else?" Let the user settle the desk /
   task for this session.
6. Only AFTER the desk/task is chosen, ask before loading `journal/work/<desk>/context.md`.
   The rule is timing and explicitness — never read desk context before the choice is made,
   and do not assume the user wants the extra context loaded.

Do not begin work until the user confirms.
