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
  **EXECUTED (Phase 4a, 2026-06-05):** this stopped being a lens and became the public artifact —
  artifact-forward `README.md` + a verified `examples/quickstart.sh` demo + ROADMAP Core-vs-Shell
  split, shipped live to the default branch (`dev`). The README's structure (what it is / who it's
  for / see it work / honest "what it doesn't do yet" / built-in-the-open) is the canonical public
  framing; reuse it. Phase 4 splits **4a (Core, done) → 4b (Shell, next)**.
- **ADR-0006 — agent-facing interface neutrality** (on `dev`). Three layers stay separate:
  orchestrator (Hermes leading / OpenClaw challenger), agent client (Claude Code + Codex as
  required targets), model provider (neutral) — unified by a standard MCP-compatible seam.
  Selection deferred to Phase 5 Step 0; this is a constraint, not a build instruction.

## Agent Browsing Stack — Phase 5 input (locked 2026-06-07)

Three-feature plan for making agents work on every site without being blocked.
Master brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`.

**Feature 1 — Stealth Stack:** Browser fingerprint indistinguishable from a real human.
Graduated layers: CDP surface minimization (cheap) → consistent environment → behavioral timing
→ active fingerprint hardening (canvas/WebGL). Goal: "as deep as legal." Tier C target:
LinkedIn, Instagram, insurance portals. Foundation already right (headful system Chromium +
human-warmed sessions). Three spec sessions planned; this is first.

**Feature 2 — MFA Handler:** Human-in-the-loop auth. Agent hits a login wall → Feather pauses
→ phone notification (Telegram likely) → human approves/enters code → agent resumes. Agent
never holds raw credentials. Handles: TOTP, SMS OTP, push approval, passkey.

**Feature 3 — Identity Model:** Formalize Cookie Mine into named Identities. An Identity =
name + profile + site list + optional Vault reference. Agent attaches by name, starts
pre-authenticated. Wraps Features 1+2. Formalizes what's already half-built.

**Build order:** Stealth → MFA Handler → Identity Model.
**Guiding constraints:** local-first, lightweight (no cloud relay), legal (own accounts only).
**Anchor Browser research reference:** `research/2026-06-06-anchor-browser-product-reference.md`
— confirms architecture is correct (same CDP-attach pattern); Cookie Mine parallel confirmed;
stealth claims are mostly marketing — concrete ideas are minimal-CDP-surface + declared-bot path.

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

