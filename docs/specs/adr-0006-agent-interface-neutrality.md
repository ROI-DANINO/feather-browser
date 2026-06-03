# ADR-0006 — Agent-Facing Interface Neutrality (Constraint + Deferral)

- **Date:** 2026-06-03
- **Status:** Accepted (constraint); orchestrator/client selection deferred
- **Context phase:** Stabilization & Linux-Readiness program, S2

## Context

A platform-agnostic vision intake
(`journal/raw/_inbox/2026-06-03-platform-agnostic-feather-vision.md`) raised the
risk of hardwiring Feather to a single orchestrator, agent client, or model
provider. Feather's agent value depends on the Cookie Mine model (ADR-0003) being
drivable by more than one tool.

The intake used the word "agnostic" broadly. That word is too blunt: this is not
"prefer nothing," it is **interface neutrality** — keep a standard seam so multiple
things can drive Feather while still having a leading candidate. Three distinct
layers were conflated under "agnostic" and are separated here:

| Layer | What it is | Stance |
|---|---|---|
| **Orchestrator** | Framework that runs multi-step agent work | Hermes is the leading candidate; OpenClaw is the challenger if better for this specifically. Not chosen now. |
| **Agent client / harness** | A tool that connects in and drives the browser | Must be drivable by external clients; **Claude Code and Codex** are explicit required targets. |
| **Model provider** | OpenAI / Anthropic / Gemini / local | Neutral; user-selected with user-supplied keys (Phase 5+ build). |

The mechanism that makes all three possible without choosing now is already in the
ROADMAP: a **standard, MCP-compatible agent-facing surface**. If the seam stays
standard, Hermes *or* OpenClaw can orchestrate it, Claude Code / Codex can drive it,
and the model behind any of them is swappable.

## Decision

- Record as a standing design constraint: the agent-facing seam stays **standard and
  MCP-compatible**, not hardwired to any single orchestrator, client, or model.
  Specifically:
  - **Orchestrator** — Hermes is the leading candidate; **OpenClaw is the challenger
    if it proves better for this specifically.** Not chosen now.
  - **Agent client / harness** — the surface must be drivable by external clients;
    **Claude Code and Codex are explicit required targets**, alongside any
    Hermes/OpenClaw path.
  - **Model provider** — no core code assumes OpenAI/Anthropic/Gemini/local; provider
    is user-selected with user-supplied keys (Phase 5+ build).
- **Defer the actual orchestrator/client selection to ROADMAP Phase 5 Step 0**, after
  the 2026-07-28 MCP spec is final (same gate as ADR-0005).
- Until then, treat this as a **design lens, not a build task.**

## Consequences

- No agent tooling is built during the stabilization program.
- Until Phase 5 Step 0, any agent-facing work (incl. S2 observability payloads) keeps
  a neutral, standard-shaped interface so no orchestrator, client, or model is
  privileged by accident.
- Phase 5 Step 0 inherits a pre-recorded interface-neutrality requirement and a named
  candidate set (Hermes / OpenClaw; Claude Code / Codex).
- Related: ADR-0005 records the *token & context efficiency* constraint at the same
  deferral gate.
