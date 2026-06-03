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

**Stabilization & Linux-Readiness program — S1 (Foundation)** (active as of 2026-06-03).

Phase 3 (Browser Core Stabilization & UI Readiness) is complete and merged to `master`. A short bridge program now hardens the core before Phase 4 (the visual shell). Feather targets **Linux (Fedora)**; runtime is **host-primary** (ADR-0004).

- Program spec: `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
- Current S1 plan: `docs/plans/2026-06-03-s1-foundation.md`
- Current progress: `PROGRESS.md`
- Full roadmap: `ROADMAP.md`

Do not reopen Phase 2 or Phase 3 unless there is a critical correctness issue.

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

## When To Use Each Command

- **`/start`** — at the beginning of *every* session. Always. Loads context and reports state (read-only).
- **`/stop`** — at the end of *every* session. Always. Writes the handoff and commits tracking files.
- **`/init`** — only when you arrive with a *new goal* you want gate-checked against the current phase before any work. It overlaps with `/start` for normal continuation, so it is optional day-to-day.

## Tech Stack

TypeScript 5.4 / Node.js 20 / Fastify 4.x / Playwright 1.50 / Zod 3.x / Vitest

> **Upgrade pending (program phase S3):** Fastify 4 → 5 (v4 LTS ended June 2025 — security) and Playwright 1.50 → latest 1.5x. Do not assume these are done until S3 closes.

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
- `/stop`: pause a session and write a handoff.
