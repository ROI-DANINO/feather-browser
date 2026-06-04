# Product Desk

Use this desk for product definition, non-goals, workflow design, UX direction, and roadmap decisions.

Current focus: preserve the original intent while narrowing the first buildable shape.

## Standing design lenses

- **ADR-0006 — agent-facing interface neutrality** (on `dev`). Three layers stay separate:
  orchestrator (Hermes leading / OpenClaw challenger), agent client (Claude Code + Codex as
  required targets), model provider (neutral) — unified by a standard MCP-compatible seam.
  Selection deferred to Phase 5 Step 0; this is a constraint, not a build instruction.

