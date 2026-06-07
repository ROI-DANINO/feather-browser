# /next — Context Bridge Before Fresh Chat

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Snapshot this conversation before switching to a fresh chat. Lighter than /stop — no session file, no commit, no blog check, no task archive.

1. Analyze the conversation:
   - Current work thread / short session name
   - Current roadmap or session pointer, if known
   - Done this session
   - Left unfinished / open threads
   - User decisions and exact quotes worth preserving
   - Agent decisions, assumptions, and rationale
   - Files read or touched
   - Exact next action
   - Files the next session should read
   - Risks / blockers

2. Append a timestamped section to `journal/context/next.md`. If the file doesn't exist, create it with a `# Next — Context Bridge` header first. Keep it compact and structured:

   ```
   ---
   ## <YYYY-MM-DD HH:MM> — <one-line session topic>

   ### Session pointer
   - Roadmap/session pointer: <pointer or "unknown">

   ### Summary
   - <1-3 bullets max>

   ### Completed
   - <bullet list>

   ### User decisions / quotes
   - Decision: <decision or "none">
   - Quote: "<verbatim quote>" or "none"

   ### Agent decisions / assumptions / rationale
   - <bullet list or "none">

   ### Files read or touched
   - Read: `<path>`
   - Touched: `<path>`

   ### Open threads / unresolved questions
   - <bullet list or "none">

   ### Next action
   - <single concrete next step>

   ### Next session should read
   - `<path>` or "none"

   ### Risks / blockers
   - <bullet list or "none">
   ```

3. Append one line to `journal/log.md`:
   `<YYYY-MM-DD> | NEXT | -> journal/context/next.md | <one-liner>`

4. Light tracker touch — keeps `active.md` usable as the state owner for the next `/start`:
   - `journal/ops/tasks.md`: tick any checkboxes the session completed (`[ ]` → `[x]`) with a one-line note; move clearly-finished items into the Done section.
   - `journal/context/active.md`: refresh the **Now** and **Recommend next** sections to the current state + next action. Concise — not the full `/stop` handoff.

Done. Do not commit, write a session file, archive tasks, update `journal/ops/phase.md`, update desk context, or touch the blog. `/stop` later consumes all pending entries, archives the consumed buffer under `journal/archive/next/YYYY-MM-DD/`, and resets `journal/context/next.md` to an empty active buffer.
