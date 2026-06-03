# Journal — Feather's Operating Process

This directory is Feather's build-in-public **operating process and running state** — the
living workflow that drives the project session to session. It's kept visible on purpose:
the way the work is run is part of the story.

For the polished narrative of *why* things happened, see `blog/`. This is the machinery
behind it.

## What lives here

- `context/active.md` — resume context for `/start` (where we are, what's next).
- `ops/phase.md` — machine-readable current phase state.
- `ops/tasks.md` — source of truth for the *current* phase's tasks.
- `ops/sessions/` — `/stop` handoff files (history, one per session).
- `ops/archive/` — superseded task lists.
- `work/<desk>/context.md` — desk-specific working context (browser / product / automation).
- `raw/_inbox/` — rough notes, dropped links, research intake, session checkpoints.
- `log.md` — append-only work log with timestamps.
- `docs-map.md` — source-of-truth table: which doc surface is authoritative for what.

Related surfaces outside this directory:

- `ROADMAP.md` — destination, phase milestones, exit criteria.
- `PROGRESS.md` — current state, decisions, open questions, next action.
- `.remember/remember.md` — short handoff for the very next session.

## Rule

Only the current phase gets detailed tasks. Future phases stay in `ROADMAP.md` until the
prior phase is complete.
