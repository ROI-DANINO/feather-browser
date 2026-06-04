# /start — Resume Feather Browser Work

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Run each step before doing anything else.

1. Read in parallel:
   - `README.md`
   - `ROADMAP.md`
   - `journal/context/active.md` — **the state owner** (where we are, what's next)
   - `journal/context/next.md` — **if it exists**, more recent than `active.md`; holds snapshots from prior chats
   - `journal/ops/tasks.md`
   - `journal/ops/phase.md`
   - last 15 lines of `journal/log.md`

   Warm (load on demand, not at `/start`): `PROGRESS.md` (pointer), `journal/README.md`,
   `journal/docs-map.md`, `journal/ops/archive/`.
2. Check `journal/raw/_inbox/` for files other than `README.md`. If any exist, report the count and ask whether to process them now or continue.
3. Report:
   - Last known phase
   - Current in-progress or active task
   - Next concrete action
   - Relevant desk: `product`, `browser`, `automation`, or `general`
4. Ask before loading desk context from `journal/work/<desk>/context.md`.
5. Ask: "Ready to continue, or do you want to start somewhere else?"

Do not begin work until the user confirms.
