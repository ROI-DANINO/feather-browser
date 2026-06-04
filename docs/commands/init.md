# /init — Confirm Project Orientation

## Purpose

Run after the agent has read the core files and before it starts research, planning, or implementation.

`/init` is the bridge between "I read the project" and "I am ready to work."

## Steps

1. Confirm the project path.
2. Read or confirm already-read state from:
   - `README.md`
   - `ROADMAP.md`
   - `PROGRESS.md`
   - `journal/README.md`
   - `journal/ops/tasks.md`
   - `journal/ops/phase.md`
   - `journal/context/active.md`
   - `journal/log.md`
3. Report:
   - Current phase
   - Current milestone target
   - Active task
   - Next concrete action
   - Files that will be changed
4. Check whether the requested goal conflicts with the phase-gated workflow.
5. If the goal is valid, state the next action and proceed.
6. If the goal would skip a phase, stop and ask for confirmation.

> Source-of-truth for each doc surface: see `journal/docs-map.md`.

## Writes

None by default. `/init` is an orientation checkpoint.

