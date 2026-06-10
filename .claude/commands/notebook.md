# /notebook — Refresh The NotebookLM Project Brain

If slash commands are not natively supported by the current agent, open this file and execute the checklist manually.

Bring `docs/feather_notebooklm_pack/` back to current truth and tell Roi what to re-upload.
The upload itself is manual — do not drive notebooklm.google.com.

1. Read `docs/feather_notebooklm_pack/README.md`: the upload list (`01`–`11`), the human-only list
   (`README`, `12`, `13`), and the maintenance rule (preserve per-file RAG boilerplate; never blur
   current state with future plans).
2. Read current truth: `journal/context/active.md`, `feather.md`, `ROADMAP.md`,
   `journal/ops/tasks.md`, and any ADR/spec in `docs/specs/` newer than the pack's
   "current as of" date.
3. For each uploadable file `01`–`11`, decide whether project truth moved out from under it
   (shipped features, API surface, roadmap shifts, safety model, test evidence). Present the
   verdicts (fresh / stale + one-line why) BEFORE editing anything.
4. Rewrite ONLY the stale files, preserving each file's boilerplate and the current/future
   separation. Touch `README`/`12`/`13` only if their own content went stale.
5. Update the pack README's "current truth as of" date.
6. Commit the changes.
7. Finish with the manual checklist: "Replace these N sources in NotebookLM: …" — and say whether
   `12_notebooklm_system_instructions.md` changed and needs re-pasting into NotebookLM's custom
   instructions field.
