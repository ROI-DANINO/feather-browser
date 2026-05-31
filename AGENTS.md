# Feather Browser Agent Instructions

## Project

Feather Browser is a hobby browser project that may evolve over roughly a year. The goal is a very light, highly configurable, Chromium-compatible browser with a calm Zen-inspired workflow feel and first-class Playwright support for agentic AI.

## Operating Model

- Research -> plan -> build -> iterate.
- Milestones are solid destination points.
- Phases are flexible placeholders until their time comes.
- Every phase starts with Step 0: research and plan that phase.
- Only the current phase gets detailed tasks in `ops/tasks.md`.
- Future phases stay high-level in `ROADMAP.md`.

## Required Startup Order

When a fresh chat receives a project goal:

1. Read the core project files:
   - `README.md`
   - `ROADMAP.md`
   - `PROGRESS.md`
   - `schema.md`
   - `ops/tasks.md`
   - `ops/phase.md`
   - `context/active.md`
   - `log.md`
2. Understand the current project state and active phase.
3. Run `/init` or follow `.claude/commands/init.md`.
4. Only after `/init`, begin research or planning work.

Do not start web research, architecture comparison, or implementation before the init step.

## Current Phase

Phase 0 is workspace setup. Phase 1 is Research and Architecture Decision.

## Research Rules

- Use current web research where facts may have changed.
- Prefer primary sources and official docs.
- For browser technology, prioritize official docs and active repositories.
- Record findings in `research/` and decisions/specs in `docs/specs/`.

## Tracking Rules

- `ops/tasks.md` is the source of truth for active work.
- `ops/phase.md` stores current phase state.
- `context/active.md` stores resume context.
- `PROGRESS.md` stores human-readable state, decisions, and open questions.
- `log.md` gets a concise event entry for meaningful changes.

## Commands

- `/init`: confirm project orientation after reading context and before research.
- `/start`: resume a session and ask before doing work.
- `/stop`: pause a session and write a handoff.

