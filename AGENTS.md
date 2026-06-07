# AGENTS.md

This file is a constraint and guide for all contributors and AI sessions working in this repository. Read it before making any changes.

## Project Identity

Feather Browser is a minimalist, stability-first browser project. The current goal is a reliable headless browser core with a clean HTTP API. It is not an agent platform, a desktop application, or a production service yet.

Long-term vision: a Hybrid Browser — a hyper-lightweight Chromium-compatible daily driver with a Zen-inspired shell, and a "Cookie Mine" where human browsing builds a shared persistent trust context that local AI agents piggyback on via the Fastify MCP-compatible hub. The human browser (Phase 4) is the trust foundation that Phase 5+ agent automation depends on.

## Mission And Role

Act as a Senior Software Architect and elite pair programmer. Focus on production-ready code, technical research, architecture decisions, and implementation plans. Keep work centered on technical design and practical build progress.

## Technical Vision

- Build a hyper-lightweight Chromium-compatible browser/control system.
- Do not compile standard Chromium from scratch unless a future research phase proves it necessary.
- Prefer practical foundations: Playwright-managed Chromium, Tauri/WebView, CEF, or Rust/C++ control layers — based on research and measurable tradeoffs.
- Do not depend on Chrome extensions as core product strategy.
- Build critical capabilities as native Feather-owned features behind clean internal interfaces.
- Prioritize low RAM/CPU use, modularity, scraping reliability, profile/session isolation, and agent-friendly control.
- The Phase 4 human browser session is the trust foundation for Phase 5+ agent automation (Cookie Mine model). Phase 4 is a prerequisite for Phase 5+, not a sequentially deferred layer.
- Keep all code, documentation, and technical discussion in English.
- Runtime target is **host-primary**; Flatpak is the eventual distribution sandbox; Podman is optional for headless/CI only (ADR-0004, `docs/specs/adr-0004-runtime-target.md`).
- Agents must use the browser's API auth token and their LLM context efficiently — a standing design constraint; tool selection deferred to Phase 5 Step 0 (ADR-0005, `docs/specs/adr-0005-agentic-north-star.md`).

## Current Phase

**Phase 4 — Visual Desktop Shell.** Phases 0–3 are complete (Phase 3 merged to `master`); the
Stabilization & Linux-Readiness bridge (S1 + S2 + S3) is closed. Feather targets **Linux (Fedora)**;
runtime is **host-primary** (ADR-0004).

This file does not narrate live state (that drifts). Read the owners instead:

- **Current state + next action:** `journal/context/active.md` *(the single owner)*
- Machine phase pointer: `journal/ops/phase.md`
- Full roadmap + exit criteria: `ROADMAP.md`
- Stabilization program spec: `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`

Do not reopen earlier phases unless there is a critical correctness issue.
When a phase is complete, do not jump straight into implementation of the next one; do the planning/reconciliation pass first.

## Branch Rules

```
master  ← stable source of truth, never broken
  └─ dev  ← trunk; everything merges back here
       ├─ <workstream branches>  ← one per unrelated piece of work, each in its own worktree
       └─ ui-playground          ← headed browser sandbox, never merges to master directly
```

- Target `dev` for all work. Never commit directly to `master`.
- AI-generated branches merge into `dev` for human review before graduating to `master`.
- `ui-playground` is a one-way sandbox. Experiments that graduate are cherry-picked to `dev` — not merged directly.

### Parallel workstreams via git worktrees

When two or more **unrelated** pieces of work are in flight (e.g. the Phase-4 GUI, a
cookie-isolation spike, the vault backend), give each its own **branch in its own git
worktree** — a separate folder checked out to that branch. This lets a **separate chat /
Claude session drive each one** while reading only that workstream's files, which keeps each
session's context small and cheap and stops unrelated work from colliding.

Rules:

- Branch off `dev`, named for the workstream (e.g. `shell-gui`, `spike-cookie-primary`,
  `vault-backend`). Keep branches short-lived and merge back to `dev` when green.
- One worktree = one workstream = one session. Don't mix unrelated work in a worktree.
- Create a worktree only when you actually start that workstream (don't pre-create idle
  desks). A fresh chat resuming a workstream should set up / re-enter its worktree first.
- Anything touching core session/profile/security stays short-lived and heavily reviewed —
  do not let it drift in a long-lived worktree (see the domain-risk note in
  `journal/raw/archive/2026-06-03-branching-strategy-domain-research-intake.md`).
- `dev` → `master` graduation is unchanged (stable-milestone only; human call).
- Native worktree tooling and the `using-git-worktrees` skill are available; prefer them
  over manual `git worktree` plumbing.

## Required Startup Order

When a fresh session receives a project goal:

1. Read this file.
2. Read `journal/context/active.md` (the state owner) and `ROADMAP.md` to understand current state.
3. Run `/init` or `/start` if available.
4. Only after orientation, begin research or planning work.

Do not start web research, architecture comparison, or implementation before the orientation step.

## When To Use Each Command

- **`/start`** — at the beginning of *every* session. Always. Loads context and reports state (read-only). Also reads `journal/context/next.md` if present.
- **`/next`** — when you need a fresh context window mid-work but are *not* at a real stopping point. Work happens in sessions, and `/next` is the short bridge between them: it appends a lightweight structured snapshot to `journal/context/next.md`, then does only a light touch to `tasks.md` / `active.md` (tick completed boxes, refresh **Now** / **Recommend next**) so the next `/start` boots on current state. No commit, no session file, no task archive. Use this instead of `/stop` when you intend to keep going in a new chat.
- **`/stop`** — at the end of a *real* stopping point (end of work block, workday, phase milestone, significant decision). It consumes the accumulated `/next` buffer plus the current session, writes the durable handoff/state, archives the consumed `next.md` bundle, resets the active `journal/context/next.md` buffer, and then commits the tracking files.
- **`/init`** — only when you arrive with a *new goal* you want gate-checked against the current phase before any work. It overlaps with `/start` for normal continuation, so it is optional day-to-day.

## Session Memory Rules

- Work is organized as sessions.
- `journal/context/active.md` stays the live current-state pointer.
- `journal/context/next.md` is the active short-term bridge that accumulates `/next` entries until `/stop`.
- Historical material must be archived, not deleted, when lifecycle files are consumed or superseded.
- Keep active context files short for token/context efficiency.
- Archive files are preserved history and should not be read by default unless the active docs explicitly require them.

## Tech Stack

TypeScript 5.4 / Node.js 20 / Fastify 5.8 / Playwright 1.60 / Zod 3.x / Vitest

> Fastify 4 → 5 and Playwright 1.50 → 1.60 were completed in program phase S3 (2026-06-03). The Fastify v5 migration required zero source changes.

Before implementing anything non-trivial: **research the official docs first**. APIs change between major versions. See `docs/tech-stack-guidelines.md` for the full guide and decision checklist.

## Change Classification

Every proposed change must be classified before implementation:

- **Core browser stability** — fix correctness, reliability, or safety issues in existing behavior
- **UI readiness** — infrastructure for a future UI (event stream, stable API contracts)
- **Future agent layer** — deferred; do not implement without explicit approval
- **Do not implement yet** — out of scope for Phase 3

When in doubt: write a doc, ask for approval. Do not add code, dependencies, or new top-level modules without explicit classification.

## Research Rules

- Use current web research where facts may have changed.
- Prefer primary sources and official docs.
- For browser technology, prioritize official docs and active repositories.
- Record research findings in `journal/raw/_inbox/` (the project's research inbox) and decisions/specs in `docs/specs/`.

## Prior Security Audit

A codebase audit was performed on 2026-05-31. Findings and architecture verdict are in `docs/tech-stack-analysis-report.md`. The 5 critical bugs identified in that report have been fixed. Consult the report before touching auth, session lifecycle, file locking, or browser evaluation code.

## Commands

- `/init`: confirm project orientation after reading context and before research.
- `/start`: resume a session and ask before doing work.
- `/next`: append a lightweight structured bridge entry before a fresh chat — updates `next.md` + a light touch to `tasks.md`/`active.md`, no commit/session file.
- `/stop`: pause a session, consume the accumulated `next.md` bridge, archive it, reset the active bridge buffer, and write the full handoff.
