# Next — Context Bridge

---
## 2026-06-04 21:56 — Ritual desk-context fix + `.remember` plugin clean

### Done
- **`/start` desk-context behavior corrected (two passes).** (1) Stop asking permission to load
  desk context — it's always wanted. (2) Timing rule: *suggest* the desk, wait for the user to
  settle the desk/task, **then** auto-load `journal/work/<desk>/context.md` — never guess-and-load
  before the choice. Edited `.claude/commands/start.md` (steps 3–5 restructured) and updated memory
  `feedback_load_desk_context.md` to capture the timing nuance.
- **`.remember` plugin cleaned from the project.** Deleted the `.remember/` data dir (archive,
  core-memories, now, recent, today-*, logs/, tmp/); `git rm --cached` the one tracked empty file
  `.remember/remember.md` (then removed from disk); stripped the vestigial "Write
  `.remember/remember.md`" step from both `/stop` ritual files (`.claude/commands/stop.md` +
  `docs/commands/stop.md` mirror, incl. its "Writes" list) and renumbered steps. `.remember/` was
  already in root `.gitignore` (line 2).

### Unfinished / open threads
- **Working tree uncommitted** (decision deferred — `/next` doesn't commit):
  `M .claude/commands/start.md`, `M .claude/commands/stop.md`, `M docs/commands/stop.md`,
  `D .remember/remember.md`. Suggested split: one commit for the `.remember` clean, one for the
  `/start` ritual fix (or one combined `chore(ritual)`).
- **Review-first plan never started** — this session detoured into ritual/cleanup. Still owed:
  review the overnight autonomous work, 4 commits `e85ace2..8884e7a` on `dev`.
- **5 inbox files** still unprocessed in `journal/raw/_inbox/`.
- **Pre-shell #4 (warmed Google session)** remains the next substantive task (needs Roi login +
  cookie-isolation spike first).

### Decisions
- Keep `.remember` **disabled** via the `settings.local.json` flag — do **not** uninstall globally.
- **Leave** all ~25 historical `.remember` mentions in journal/docs/research — audit trail stays.
- `/start` loads desk context **after** the desk/task is chosen, never before; never asks permission.

### Next action
Commit the working-tree changes on `dev` (the `.remember` clean + the `/start` ritual fix), then
resume the review-first plan: review overnight autonomous commits `e85ace2..8884e7a`.
