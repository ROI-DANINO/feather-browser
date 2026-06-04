# Next — Context Bridge

---
## 2026-06-04 — /next command design and implementation

### Done
- Designed `/next` command: append-to-one-file approach, lighter than `/stop`, no commit/session file/blog/task archive
- Verified design against `AGENTS.md` — found two conflicts ("`/stop` every session" rule; `/next` absent from Commands section) and resolved them
- Created `.claude/commands/next.md` (executable skill — live immediately)
- Created `docs/commands/next.md` (spec doc)
- Updated `AGENTS.md`: "When To Use Each Command" distinguishes `/next` vs `/stop`; "Commands" section adds `/next`
- Updated `.claude/commands/start.md` + `docs/commands/start.md`: step 1 reads `next.md` if present
- Updated `.claude/commands/stop.md` + `docs/commands/stop.md`: step 1 folds `next.md`; step 12/14 deletes it
- Updated `docs/commands/README.md`: `/next` listed

### Unfinished / open threads
- none

### Decisions
- `/next` appends timestamped sections to one rolling file (`journal/context/next.md`) — not per-session files
- `/start` reads `next.md` when present as more recent context than `active.md`
- `/stop` folds all sections into the full handoff then deletes `next.md`
- AGENTS.md rule updated: `/stop` is for real stopping points only; `/next` is for mid-work context bridges

### Next action
Storage-isolation fix (task 1, CRITICAL): relocate `featherDir` from repo-relative `.feather` to `~/.config`/`~/.local/share` in `src/config.ts`
