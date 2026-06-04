# /next — Context Bridge Before Fresh Chat

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Snapshot this conversation before switching to a fresh chat. Lighter than /stop — no session file, no commit, no blog check, no task archive.

1. Analyze the conversation:
   - Done this session
   - Left unfinished / open threads
   - Decisions made
   - Exact next action

2. Append a timestamped section to `journal/context/next.md`. If the file doesn't exist, create it with a `# Next — Context Bridge` header first. Format:

   ```
   ---
   ## <YYYY-MM-DD HH:MM> — <one-line session topic>

   ### Done
   <bullet list>

   ### Unfinished / open threads
   <bullet list, or "none">

   ### Decisions
   <bullet list, or "none">

   ### Next action
   <single concrete next step>
   ```

3. Append one line to `journal/log.md`:
   `<YYYY-MM-DD> | NEXT | -> journal/context/next.md | <one-liner>`

4. Light tracker touch — keeps `active.md` usable as the state owner for the next `/start`:
   - `journal/ops/tasks.md`: tick any checkboxes the session completed (`[ ]` → `[x]`) with a one-line note; move clearly-finished items into the Done section.
   - `journal/context/active.md`: refresh the **Now** and **Recommend next** sections to the current state + next action. Concise — not the full `/stop` handoff.

Done. Do not commit, write a session file, archive tasks, update desk context, or touch the blog. The step-4 tracker touch is intentionally minimal — the full handoff still belongs to `/stop`.
