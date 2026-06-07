# /next — Context Bridge Before Fresh Chat

## Purpose

Snapshot the current conversation before switching to a fresh chat, without the full `/stop` ceremony. Use when you need a new context window but are not at a real stopping point.

## When to use

- You need a fresh context window mid-work but aren't done.
- `/stop` is too heavy — no significant decision landed, no phase milestone, no real pause.
- You want to continue the same work thread across multiple short chats.

## Steps

1. Analyze the conversation for the current work thread, done work, unfinished threads, user decisions, agent decisions, and the next concrete action.
2. Append a timestamped section to `journal/context/next.md`. Create the file with a `# Next — Context Bridge` header if it doesn't exist yet. Keep it compact and structured. Every `/next` entry should include, when available:

   ```md
   ---
   ## <YYYY-MM-DD HH:MM> — <short session name>

   ### Session pointer
   - Roadmap/session pointer: <current roadmap item or "unknown">

   ### Summary
   - <1-3 bullets max>

   ### Completed
   - <completed work>

   ### User decisions / quotes
   - Decision: <decision>
   - Quote: "<verbatim user quote>"

   ### Agent decisions / assumptions / rationale
   - <decision, assumption, or rationale>

   ### Files read or touched
   - Read: `<path>`
   - Touched: `<path>`

   ### Open threads / unresolved questions
   - <open thread or "none">

   ### Next action
   - <single concrete next step>

   ### Next session should read
   - `<path>`

   ### Risks / blockers
   - <risk/blocker or "none">
   ```

   Keep sections terse. `/next` is a bridge, not a blog entry or full handoff.
3. Append a `NEXT` line to `journal/log.md`.
4. Light tracker touch: tick completed checkboxes in `journal/ops/tasks.md` and refresh the **Now** / **Recommend next** sections of `journal/context/active.md`. Minimal — not the full `/stop` handoff.

## What /stop does with it

When you eventually run `/stop`, it reads all accumulated `/next` entries, folds them into the full handoff, archives the consumed buffer under `journal/archive/next/YYYY-MM-DD/`, then resets `journal/context/next.md` to an empty active buffer.

## Writes

- `journal/context/next.md` (append)
- `journal/log.md` (append one line)
- `journal/ops/tasks.md` (light touch — tick completed checkboxes)
- `journal/context/active.md` (light touch — refresh **Now** / **Recommend next**)

## Does NOT write

- Session files (`journal/ops/sessions/`)
- Desk context files (`journal/work/<desk>/context.md`)
- `journal/ops/phase.md`
- Blog entries
- No git commit, no task archive (the full handoff is still `/stop`'s job)
