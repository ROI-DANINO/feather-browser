---
name: fb-stop
description: Feather Browser /stop command. Pauses a session and writes handoff state.
---

# Feather Browser: /stop

When the user invokes `/stop` inside this project:

1. Summarize done work, unfinished work, next action, decisions, ideas, and 3-5 verbatim user quotes.
2. Ask the three stop questions and wait for answers.
3. Blog check: if a phase completed or a significant decision landed, write or update a `blog/NNNN-slug.md` entry and the `blog/README.md` index; otherwise skip.
4. Write `ops/sessions/<nickname>-<timestamp>.md`.
5. Update `context/active.md`, `ops/phase.md`, `ops/tasks.md`, `log.md`, and `.remember/remember.md`.
6. Reconcile desk context: for the desk(s) this session actually advanced (`browser` / `product` / `automation` / `general`), update `work/<desk>/context.md` only when a durable desk-level fact changed (architecture decision, spike result, corrected fact). Skip untouched desks; keep volatile next-action state in `context/active.md`, not here.
7. Archive the previous `ops/tasks.md` to `ops/archive/tasks-<timestamp>.md`.
8. Commit the tracking changes.

