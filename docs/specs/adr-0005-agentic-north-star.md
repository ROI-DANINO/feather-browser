# ADR-0005 — Agentic North Star: Token & Context Efficiency (Constraint + Deferral)

- **Date:** 2026-06-03
- **Status:** Accepted (constraint); tool selection deferred
- **Context phase:** Stabilization & Linux-Readiness program, S1

## Context

Feather's vision is an agentic-AI-native + human daily-driver browser (Cookie Mine
model, ADR-0003): local AI agents open tabs inside the human's running session and
piggyback on its accumulated trust context. For that to be good, agents must use
two scarce resources efficiently:

1. **The browser's API auth token** — agents reuse the human session's token and
   live context rather than launching isolated, re-authenticated contexts.
2. **Their own LLM context window** — how browser state is fed to the model must be
   compact.

Research informing this:
- Microsoft's Playwright MCP server (~30K stars) feeds pages to non-vision models as
  **ARIA accessibility snapshots** (YAML), not screenshots.
- Token cost differs sharply by interface: Playwright **MCP ≈ 114K tokens** vs.
  **CLI ≈ 27K tokens** for the same task. CLI is ~4× cheaper but is task-focused and
  loses persistent state.
- The Cookie Mine model needs **persistent state**, which favors MCP over CLI.
- The MCP spec is in a release candidate; **final 2026-07-28** with major changes
  (stateless core, Tasks-as-extension). Designing the hub before then risks rework.

## Decision

- Record **token & context efficiency as a standing design constraint** for all
  agent-facing work.
- **Defer the tool-selection decision** (build on Playwright MCP vs. a Feather hub
  vs. Playwright CLI vs. a hybrid) to **ROADMAP Phase 5 Step 0**, after the
  2026-07-28 MCP spec is final.
- Until then, treat this as a **design lens, not a build task.** Specifically: the
  S2 observability work (tab events, tracing, any future page/context snapshot)
  should produce data that is compact and agent-friendly, so we are not forced into
  a wasteful representation later.

## Consequences

- No agent tooling is built during the stabilization program.
- S2 design reviews check event/context payloads for compactness.
- Phase 5 Step 0 inherits a clear, pre-recorded requirement and the research above.
- Related: ADR-0006 records agent-facing *interface* neutrality (orchestrator/client/model), deferred to the same Phase 5 Step 0 gate.
