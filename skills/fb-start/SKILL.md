---
name: fb-start
description: Feather Browser /start command. Orients the agent to the current project state before work begins.
---

# Feather Browser: /start

When the user invokes `/start` inside this project:

1. Read `README.md`, `ROADMAP.md`, `PROGRESS.md`, `journal/README.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/context/active.md`, and recent `journal/log.md`.
2. If `journal/context/next.md` exists and contains pending `/next` entries, read it as the freshest short-term bridge.
3. Compare `journal/context/next.md` with `journal/context/active.md` when both describe current work. If they conflict, report the conflict and ask which state to continue from; do not guess.
4. Check `journal/raw/_inbox/` for unprocessed files.
5. Report last known phase, active task, next action, whether `next.md` has pending bridge material, and relevant desk.
6. Ask before loading a desk context from `journal/work/<desk>/context.md`.
7. Ask whether to continue or start somewhere else.

Do not read `journal/archive/**` by default.

Do not write files and do not begin work until the user confirms.
