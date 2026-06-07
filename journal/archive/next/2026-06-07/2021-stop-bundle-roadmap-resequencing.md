# Archived Next Bundle — 2026-06-07 20:21

Archived during pre-roadmap cleanup so the active `/next` buffer could be safely reset before the
roadmap re-sequencing pass. Entries are kept in chronological order. The first entry was legacy
format when found in `journal/context/next.md`; it is normalized below without dropping content.

---
## 2026-06-07 20:12 — Repo alignment and branch cleanup

### Session pointer
- Roadmap/session pointer: roadmap re-sequencing pass prep

### Summary
- Local and remote branches were cleaned up and aligned on `dev`.
- The project next step remained the roadmap re-sequencing pass.

### Completed
- Pulled latest `origin/dev` into local `dev`.
- Deleted redundant local/remote branches; only `dev` and `master` remain locally and on `origin`.
- Committed `.gitignore` council infrastructure ignores as `21a7c7c chore(gitignore): ignore council infrastructure`.
- Pushed `dev`; local `dev` and `origin/dev` are aligned at `21a7c7c`.

### User decisions / quotes
- Decision: keep only `dev` and `master` branches locally and remotely.
- Quote: not captured in the original legacy entry.

### Agent decisions / assumptions / rationale
- Keep Claude Council infrastructure ignored while preserving output artifacts policy.

### Files read or touched
- Touched: `.gitignore`
- Touched: local/remote git branch state

### Open threads / unresolved questions
- Roadmap re-sequencing pass is still the recommended next project work.
- Hero demo recording still waits on a Niri/Wayland screen recorder.
- Social research inbox stubs remain unprocessed.

### Next action
- Start the roadmap re-sequencing pass: read all 3 Agent Browsing Stack plans plus integration research constraints, then update `ROADMAP.md` and `journal/ops/tasks.md`.

### Next session should read
- `journal/context/active.md`
- `journal/ops/tasks.md`

### Risks / blockers
- Blocker: hero demo recording still depends on a Niri/Wayland screen recorder.

---
## 2026-06-07 20:21 — Command workflow stabilization pass

### Session pointer
- Roadmap/session pointer: pre-roadmap command workflow cleanup for `/start`, `/next`, `/stop`

### Summary
- Audited the current command lifecycle across docs, mirrored prompts, and journal ownership files.
- Aligned the repo on an archive-first `journal/context/next.md` lifecycle without touching `ROADMAP.md`.

### Completed
- Updated canonical command docs for `/start`, `/next`, and `/stop`.
- Synced mirrored `.claude` command prompts and `fb-start` / `fb-stop` skills with the canonical docs.
- Updated `AGENTS.md`, `journal/docs-map.md`, and `journal/README.md` to describe session-based work, short active context, and archive-by-default exclusions.
- Added `journal/archive/README.md`, `journal/archive/next/README.md`, and `journal/archive/handoffs/README.md`.

### User decisions / quotes
- Decision: keep this task scoped to command lifecycle, documentation flow, and archive behavior.
- Quote: "Do not restructure `ROADMAP.md` in this task."

### Agent decisions / assumptions / rationale
- Updated mirrored command surfaces too, so the executable prompts do not drift from the canonical docs.
- Left the existing dirty tracker files and live bridge buffer in place; the next real `/stop` should archive/reset them using the new convention instead of rewriting history manually.

### Files read or touched
- Read: `AGENTS.md`, `docs/commands/{start,next,stop}.md`, `journal/context/{active,next}.md`, `journal/ops/{tasks,phase}.md`, `journal/docs-map.md`
- Touched: `AGENTS.md`, `docs/commands/{README,start,next,stop}.md`, `.claude/commands/{start,next,stop}.md`, `skills/fb-{start,stop}/SKILL.md`, `journal/{README,docs-map}.md`, `journal/archive/**`

### Open threads / unresolved questions
- Commit/staging decision for the command-workflow doc pass is still open.
- The first `/stop` after this change should prove the new archive/reset convention against the live `next.md` buffer.

### Next action
- In the next session, either review/stage/commit the command-workflow doc pass or move straight into the roadmap re-sequencing pass if this docs work is accepted as-is.

### Next session should read
- `AGENTS.md`
- `docs/commands/start.md`
- `docs/commands/next.md`
- `docs/commands/stop.md`
- `journal/context/active.md`
- `journal/context/next.md`

### Risks / blockers
- Risk: the original active `journal/context/next.md` buffer mixed one legacy-format entry with one current-format entry.
- Risk: `journal/context/active.md`, `journal/log.md`, and `journal/ops/tasks.md` were already dirty before this bridge cleanup; future cleanup should preserve that history carefully.
