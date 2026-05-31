---
name: fb-stop
description: Feather Browser /stop command. Pauses a session and writes handoff state.
---

# Feather Browser: /stop

When the user invokes `/stop` inside this project:

1. Summarize done work, unfinished work, next action, decisions, ideas, and 3-5 verbatim user quotes.
2. Ask the three stop questions and wait for answers.
3. Write `ops/sessions/<nickname>-<timestamp>.md`.
4. Update `context/active.md`, `ops/phase.md`, `ops/tasks.md`, `log.md`, and `.remember/remember.md`.
5. Archive the previous `ops/tasks.md` to `ops/archive/tasks-<timestamp>.md`.
6. Commit the tracking changes.

