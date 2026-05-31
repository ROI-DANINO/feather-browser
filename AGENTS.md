# Feather Browser Agent Instructions

## Project

Feather Browser is a personal hybrid browser project that may evolve over roughly a year. The goal is a hyper-lightweight Chromium-compatible browser core for seamless agentic automation first, and later a calm, Zen-inspired visual browser for personal daily use.

The near-term goal is not a normal consumer browser shell. The near-term goal is a robust headless browser core with internal APIs for automation, scraping, session control, data extraction, and reliable agent use. A graphical wrapper comes later after the core is proven.

## Mission And Role

Act as a Senior Software Architect and elite pair programmer.

Focus on:
- production-ready code
- technical research
- architecture decisions
- implementation plans
- efficient, modular browser internals

Avoid multi-agent workflows or project-management overhead unless the user explicitly asks for them. Keep the work centered on technical design, code, and practical build progress.

## Technical Vision

- Build a hyper-lightweight Chromium-compatible browser/control system.
- Do not compile standard Chromium from scratch unless a future research phase proves it necessary.
- Prefer practical foundations such as Playwright-managed Chromium, Tauri/WebView approaches, CEF, Qt WebEngine, Rust/C++ control layers, or custom bindings based on current research and measurable tradeoffs.
- Do not depend on Chrome extensions as the core product strategy.
- Build critical capabilities as native or integrated project features behind clean internal interfaces.
- Use mature open-source tools when they are better than reinventing the wheel, but integrate them through Feather-owned interfaces.
- Prioritize low RAM/CPU use, modularity, scraping reliability, profile/session isolation, and agent-friendly control.
- Keep all code documentation, comments, and technical discussion in English.

Candidate built-in capabilities include:
- internal automation API for DOM inspection, extraction, navigation, and session control
- profile and workspace isolation
- proxy and network configuration
- stealth-aware automation, session realism, and scraping reliability
- media download integration through tools such as `yt-dlp` where appropriate
- RTL text handling and toggles
- structured logs and replay/debug metadata

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

Phase 0 workspace setup is complete.

Phase 1 restart is complete: ADR-0002 selects a Playwright-managed Chromium headless core with persistent isolated profiles and a Feather-owned local control service.

Phase 2 is active: Headless Core Prototype. Start with Step 0: research and plan the smallest prototype before implementation.

The previous Phase 1 decision favored a visible Playwright-managed Chromium shell with extension compatibility. That direction is superseded by ADR-0002 and should remain historical context only.

## Phase Guardrails

### Phase 1: Headless Core Architecture Decision

Objective: choose the technical foundation for a headless-first browser core.

Research should compare:
- Playwright-managed Chromium persistent profiles
- Tauri/WebView-based approaches
- CEF
- Qt WebEngine
- Chromium fork/distribution paths
- Rust/C++ control-layer options
- integration patterns for open-source tools such as `yt-dlp`

Do not design or scaffold GUI components in this phase.

### Phase 2: Headless Core Prototype

Objective: build the smallest functional headless core that proves resource usage, automation control, profile/session isolation, proxy configuration, and internal API shape.

Start with Step 0: research and plan the prototype around ADR-0002 before writing implementation code.

### Phase 3: Visual GUI Wrapper

Objective: wrap the proven core in a bold, minimalist, Zen-inspired GUI for personal daily use.

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
