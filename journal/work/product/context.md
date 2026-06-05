# Product Desk

Use this desk for product definition, non-goals, workflow design, UX direction, and roadmap decisions.

Current focus: preserve the original intent while narrowing the first buildable shape.

## Standing design lenses

- **Public positioning — "Core first, Shell later"** (`docs/public-positioning.md`, 2026-06-05).
  Lead with **Feather Core = "a local Chromium runtime for AI agents"** (the adoptable, near-term
  OSS surface); the visual Shell + Cookie Mine are the larger, more platform-specific vision that
  comes later. Honest Linux-first/Fedora/Wayland limits stated up front. Make Feather look
  **sharper, not broader.** Feather is the browser-native execution layer agent ecosystems need when
  APIs aren't enough — NOT a Composio-style integration platform (memory:
  `project_feather_agent_runtime_direction`).
- **ADR-0006 — agent-facing interface neutrality** (on `dev`). Three layers stay separate:
  orchestrator (Hermes leading / OpenClaw challenger), agent client (Claude Code + Codex as
  required targets), model provider (neutral) — unified by a standard MCP-compatible seam.
  Selection deferred to Phase 5 Step 0; this is a constraint, not a build instruction.

## North-Star behavioral objectives (Phase 5+; defined sharply — `journal/ops/archive/roadmap-future.md`)

Defined so a passive, lesser version is never mistaken for the milestone:

- **Active Anti-Bot Self-Detection** — NOT a passive telemetry recorder. The destination is an
  active, real-time self-monitoring system running alongside the agent that analyzes its own behavior
  (cadence/timing/signature) against live detection heuristics (Cloudflare et al.) and **warns or
  corrects the agent in real time** when it trends robotic. The recorder *feeds* this; it isn't it.
- **True Perception & Generalized Workflows** — NOT just a token-saving DOM stripper. The destination
  is a core perception layer that lets the agent **reason about, adapt to, and execute repeatable
  workflows on completely unfamiliar websites** it has never seen. The context-shrinker is one
  component, not the goal.

