---
name: fb-stop
description: Feather Browser /stop command. Pauses a session and writes handoff state.
---

# Feather Browser: /stop

When the user invokes `/stop` inside this project:

1. Read `journal/context/next.md` if it contains pending `/next` entries, and fold them into the current stop analysis.
2. Summarize done work, unfinished work, next action, decisions, ideas, and 3-5 verbatim user quotes.
3. Ask the three stop questions and wait for answers.
4. Blog check (with backlog so a skipped entry is never lost):
   - First read `blog/_pending.md` if it exists — this is the blog backlog: a buffer of past sessions that had blog-worthy material but were not written up yet.
   - This session is **blog-worthy** if a phase completed, a significant decision landed, OR `blog/_pending.md` lists owed sessions.
   - **If you write a blog entry:** fold in every session listed in `blog/_pending.md` so the narrative covers the deferred work too, write/update the `blog/NNNN-slug.md` entry and the `blog/README.md` index, then clear `blog/_pending.md` back to an empty buffer.
   - **If this session was blog-worthy but the user chose not to blog:** append a pointer to `blog/_pending.md` — the session file from step 5 (path), a one-line hook, and the date — so the next blog write reaches back and includes it.
   - **If nothing was blog-worthy and the backlog is empty:** skip cleanly.
5. Write `journal/ops/sessions/<nickname>-<timestamp>.md`.
6. Update `journal/context/active.md`, `journal/ops/phase.md`, `journal/ops/tasks.md`, `journal/log.md`, and `.remember/remember.md` when that short handoff surface is still in use.
7. Reconcile desk context: for the desk(s) this session actually advanced (`browser` / `product` / `automation` / `general`), update `journal/work/<desk>/context.md` only when a durable desk-level fact changed (architecture decision, spike result, corrected fact). Skip untouched desks; keep volatile next-action state in `journal/context/active.md`, not here.
8. Archive the previous `journal/ops/tasks.md` to `journal/ops/archive/tasks-<timestamp>.md`.
9. If `journal/context/next.md` had pending entries, archive the consumed buffer under `journal/archive/next/YYYY-MM-DD/HHMM-<short-name>.md` (or `HHMM-stop-bundle-<short-name>.md` for multi-entry bundles), then reset `journal/context/next.md` to an empty active buffer.
10. If any temporary stop draft or other project-memory scratch file would otherwise be overwritten or removed, move it into `journal/archive/handoffs/YYYY-MM-DD/HHMM-<short-name>.md` first.
11. Commit the tracking changes.
