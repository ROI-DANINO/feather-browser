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

## Current Phase

**Phase 3 — Browser Core Stabilization & UI Readiness** (active as of 2026-05-31)

Scope: session and page lifecycle, lifecycle event logging, API contract cleanup, and a minimal SSE event stream for a future UI. No agent runtime. No desktop shell yet.

- Scope definition: `docs/specs/phase-3-browser-stability-first-brief.md`
- Current progress: `PROGRESS.md`
- Full roadmap: `ROADMAP.md`

Phase 2 (Headless Core Prototype) is complete. Do not reopen it unless there is a critical correctness issue.

## Branch Rules

```
master  ← stable source of truth, never broken
  └─ dev  ← all Phase 3 work, bug fixes, new features
       └─ ui-playground  ← headed browser sandbox, never merges to master directly
```

- Target `dev` for all work. Never commit directly to `master`.
- AI-generated branches merge into `dev` for human review before graduating to `master`.
- `ui-playground` is a one-way sandbox. Experiments that graduate are cherry-picked to `dev` — not merged directly.

## Required Startup Order

When a fresh session receives a project goal:

1. Read this file.
2. Read `PROGRESS.md` and `ROADMAP.md` to understand current state.
3. Run `/init` or `/start` if available.
4. Only after orientation, begin research or planning work.

Do not start web research, architecture comparison, or implementation before the orientation step.

## Tech Stack

TypeScript 5.4 / Node.js 20 / Fastify 4.x / Playwright 1.50 / Zod 3.x / Vitest

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
- Record findings in `research/` and decisions/specs in `docs/specs/`.

## Prior Security Audit

A codebase audit was performed on 2026-05-31. Findings and architecture verdict are in `docs/tech-stack-analysis-report.md`. The 5 critical bugs identified in that report have been fixed. Consult the report before touching auth, session lifecycle, file locking, or browser evaluation code.

## Commands

- `/init`: confirm project orientation after reading context and before research.
- `/start`: resume a session and ask before doing work.
- `/stop`: pause a session and write a handoff.
