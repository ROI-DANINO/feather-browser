# Journal Archive

Historical session-memory material that should be preserved but not loaded by default.

## Purpose

- Keep consumed `/next` bridge bundles after `/stop`.
- Keep superseded temporary handoff material that would otherwise be overwritten or deleted.
- Preserve history without polluting the active `/start` context.

## Conventions

- Use dated directories: `YYYY-MM-DD/`.
- Use time-stamped filenames: `HHMM-<short-name>.md`.
- Keep names short and descriptive.
- Do not load this tree during `/start` unless an active document explicitly points here.

Current subtrees:

- `next/` — consumed `/next` buffers archived by `/stop`
- `handoffs/` — superseded temporary stop/next/handoff material that must be preserved
