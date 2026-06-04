# Phase 5+ — Agent Perception Layer (Parked Concept)

**Status:** Parked. Exploratory idea, NOT a decision. Do not implement before Phase 5 Step 0.
**Date captured:** 2026-06-03
**Governing decision:** ADR-0005 (agentic North Star) — tool/protocol choice deferred to Phase 5
Step 0, after the MCP spec finalizes 2026-07-28.
**Why parked:** Belongs to the Phase 5+ agent runtime. We are currently in the S2 stabilization
sub-phase and are deliberately not skipping ahead. The technical claims below are **unvalidated** —
they need a real research pass (Playwright/CDP behavior, how current browser agents actually work,
known failure modes) before any of this is trusted.

---

## The core idea

How should an autonomous agent "see" and operate the browser, given three standing constraints
(all consistent with ADR-0005's token/context efficiency North Star)?

1. **Token efficiency** — never feed the model raw HTML, full DOM, or heavy text dumps; they burn
   the context window.
2. **Resilience** — actions should not depend on brittle CSS selectors or fixed X/Y coordinates
   that break on minor UI changes.
3. **Stealth / low profile** — minimize JS injection; keep a low signature against anti-bot
   systems. (Note: framed within Feather's positioning — "operating inside explicit user-authorized
   session state with human approval checkpoints," not evasion for unauthorized access.)

### Proposed approach: an "Actionable Tree" derived from the Accessibility Tree

- Extract (via Playwright/CDP) only the **interactive, semantically meaningful** elements —
  buttons, links, inputs — rather than the full DOM.
- Map each element to a **short numeric ID** unique to the current session/snapshot.
- The agent receives the distilled tree and replies with simple commands: `click(ID)`,
  `type(ID, "text")`. Feather resolves the ID back to the real element handle and executes the
  action server-side.

This is conceptually the `snapshot` + `extract` commands, but built on the accessibility tree
instead of the DOM.

---

## Open questions to research at Phase 5 Step 0 (NOT answered yet)

1. **Is this current best practice?** Validate against how today's real browser agents work
   (Playwright MCP's accessibility snapshot, browser-use, and similar). Microsoft's Playwright MCP
   is already on our radar (ROADMAP Phase 5+ planning notes) and reportedly uses an accessibility
   snapshot model — confirm before reinventing.
2. **Accessibility Tree vs. alternatives** — pros/cons against: DOM-pruning/heuristic distillation,
   set-of-marks / vision (screenshot + numbered overlays), and hybrid approaches. What does each
   cost in tokens, robustness, and stealth?
3. **Edge cases / "fake" elements** — elements critical for interaction that DON'T appear in the
   accessibility tree (e.g. `div`/`span` click handlers with no ARIA role, canvas/WebGL UIs,
   custom widgets, `aria-hidden` traps, off-screen but clickable nodes). How are these handled?
4. **ID mapping stability** — how to keep IDs stable across re-renders, partial loads, and SPA
   navigations so the agent's `click(ID)` doesn't resolve to the wrong element after a DOM change.
   Candidates to evaluate: backend node IDs (CDP), stable hashing of role+name+path, snapshot-scoped
   IDs that are explicitly invalidated on navigation, etc.
5. **Stealth reality check** — does an accessibility-tree extraction actually inject less / leave a
   smaller signature than DOM querying? Verify rather than assume.

## Relationship to existing Feather surfaces

- Feather already has `snapshot` and `extract` commands (DOM-based today) — this concept would be
  their agent-optimized evolution, likely a new command shape rather than a rewrite of the existing
  HTTP API.
- Raw CDP is already designated an internal escape hatch (PROGRESS.md, Architecture Decisions) —
  this is exactly the kind of targeted gap it exists for.
- Must slot under the planned Fastify MCP-compatible hub (ROADMAP Phase 5+), not bypass it.

## Provenance

Concept seeded in a brainstorming exchange (user + Gemini), flagged during S2 `/start` as
out-of-scope-for-now and parked here intentionally so it isn't lost. Revisit at Phase 5 Step 0.
