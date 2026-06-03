# Session Command Context File Concern

Date: 2026-06-03

## User Concern

Original request:

> read AGENTS.md docs/commands and find out if anything updates work/*/context.md files. as well as context/active.md, which i think i know is updated correctly. and context should /start read when we open a session and when does /stop updates the relevant context docs
>
> dont edit anything at all yet

Core concern:

- Confirm whether any documented workflow updates `work/*/context.md`.
- Confirm that `/start` reads `context/active.md` at session open.
- Confirm when `/stop` updates `context/active.md` and other context/tracking docs.
- Identify mismatches between documented command behavior and local command/skill behavior.

## Findings

`/start` is read-only.

- `docs/commands/start.md` says `/start` reads `README.md`, `ROADMAP.md`, `PROGRESS.md`, `schema.md`, `ops/tasks.md`, `ops/phase.md`, `context/active.md`, and the last 20 lines of `log.md`.
- `docs/commands/start.md` says to ask before loading `work/<desk>/context.md`.
- `docs/commands/start.md` has `Writes: None`.
- `.claude/commands/start.md` mirrors this behavior: it reads the same core files, asks before loading `work/<desk>/context.md`, and says not to begin work until user confirmation.

`/stop` updates `context/active.md`.

- `docs/commands/stop.md` writes a new session file first: `ops/sessions/<nickname>-<timestamp>.md`.
- Then it updates `context/active.md`.
- Then it updates `ops/phase.md`, archives and rewrites `ops/tasks.md`, appends to `log.md`, writes `.remember/remember.md`, and commits tracking files.
- `.claude/commands/stop.md` and `skills/fb-stop/SKILL.md` also list `context/active.md` as a `/stop` update target.

No command currently documents automatic updates to `work/*/context.md`.

- `docs/docs-map.md` defines `work/<desk>/context.md` as desk-specific working context for browser/product/automation/general.
- `/start` may load the relevant desk context after asking.
- `/stop` does not list any `work/*/context.md` file in its write targets.
- `skills/fb-stop/SKILL.md` also does not mention `work/*/context.md`.

## Noted Mismatches

- `docs/commands/stop.md` includes a blog check step, but `.claude/commands/stop.md` and `skills/fb-stop/SKILL.md` do not.
- `docs/commands/stop.md` lists `docs/commands/stop.md` behavior as canonical documentation, but `docs/commands/stop.md` itself is git-ignored locally.
- Most workflow/context files are git-ignored locally, including `context/`, `work/`, `.claude/`, `skills/`, `.remember/`, `ops/`, `log.md`, `raw/`, and `docs/commands/`.

## Current Inference

The intended model appears to be:

- `/start`: read `context/active.md`; optionally read one relevant `work/<desk>/context.md`; write nothing.
- `/stop`: update session handoff and global tracking state, including `context/active.md`; do not automatically update desk context files.
- `work/*/context.md`: maintained manually or by explicit task-specific instruction, not by the standard `/start` or `/stop` flow.

## Follow-Up Question

Decide whether `/stop` should also update the relevant `work/<desk>/context.md` when desk-specific context changed during the session. If yes, update all relevant command surfaces consistently:

- `docs/commands/stop.md`
- `.claude/commands/stop.md`
- `skills/fb-stop/SKILL.md`
- possibly `docs/docs-map.md`
