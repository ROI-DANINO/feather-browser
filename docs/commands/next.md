# /next — Context Bridge Before Fresh Chat

## Purpose

Snapshot the current conversation before switching to a fresh chat, without the full `/stop` ceremony. Use when you need a new context window but are not at a real stopping point.

## When to use

- You need a fresh context window mid-work but aren't done.
- `/stop` is too heavy — no significant decision landed, no phase milestone, no real pause.
- You want to continue the same work thread across multiple short chats.

## Steps

1. Analyze the conversation for done work, unfinished threads, decisions, and the next concrete action.
2. Append a timestamped section to `journal/context/next.md`. Create the file with a `# Next — Context Bridge` header if it doesn't exist yet.
3. Append a `NEXT` line to `journal/log.md`.

## What /stop does with it

When you eventually run `/stop`, it reads `journal/context/next.md`, folds all accumulated sessions into the full handoff, then deletes the file.

## Writes

- `journal/context/next.md` (append)
- `journal/log.md` (append one line)

## Does NOT write

- Session files (`journal/ops/sessions/`)
- `journal/context/active.md`
- `journal/ops/tasks.md`
- Desk context files (`journal/work/<desk>/context.md`)
- Blog entries
- No git commit
