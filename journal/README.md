# Journal — Feather's Operating Process

This directory is Feather's build-in-public **operating process and running state** — the
living workflow that drives the project session to session. It's kept visible on purpose:
the way the work is run is part of the story.

For the polished narrative of *why* things happened, see `blog/`. This is the machinery
behind it.

> **Warm doc** (not auto-loaded at `/start`; read on demand). Single-owner map below.

## What lives here

- `context/active.md` — **the single owner of current state + next action** (resume context for `/start`).
- `context/next.md` — active short-term `/next` bridge buffer; accumulates pending session snapshots until `/stop`.
- `ops/phase.md` — machine-readable current phase pointer (frontmatter only).
- `ops/tasks.md` — current-phase task checklist (checkboxes only, no state narration).
- `ops/sessions/` — `/stop` handoff files (history, one per session).
- `ops/archive/` — superseded task lists; rotated-out history (`log-archive.md`, `phase-3-progress.md`, `roadmap-phases-0-3.md`).
- `archive/` — archived `/next` bundles and other superseded temporary handoff material. Historical only; not auto-loaded at `/start`.
- `work/<desk>/context.md` — desk-specific working context (browser / product / automation).
- `raw/_inbox/` — rough notes, dropped links, research intake, session checkpoints.
- `log.md` — append-only work log (≤140-char lines; holds only the current phase; older → `ops/archive/log-archive.md`).
- `docs-map.md` — source-of-truth table: which doc surface is authoritative for what.

Related surfaces outside this directory:

- `ROADMAP.md` — destination, phase milestones, exit criteria.
- `PROGRESS.md` — **thin pointer** to the single owners (no longer holds state).
- `.remember/remember.md` — short handoff for the very next session.

## Rule

Only the current phase gets detailed tasks. Future phases stay in `ROADMAP.md` until the
prior phase is complete.

Keep active context files short. Archives preserve history, but they are not part of the default `/start` read path.
