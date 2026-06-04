---
name: fb-start
description: Feather Browser /start command. Orients the agent to the current project state before work begins.
---

# Feather Browser: /start

When the user invokes `/start` inside this project:

1. Read `README.md`, `ROADMAP.md`, `PROGRESS.md`, `journal/README.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, `journal/context/active.md`, and recent `journal/log.md`.
2. Check `journal/raw/_inbox/` for unprocessed files.
3. Report last known phase, active task, next action, and relevant desk.
4. Ask before loading a desk context from `journal/work/<desk>/context.md`.
5. Ask whether to continue or start somewhere else.

Do not write files and do not begin work until the user confirms.

