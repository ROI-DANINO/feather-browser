# Research: MCP Spec 2026 + Playwright MCP Server
# Date: 2026-06-02 | Source: Web research pass

## Context

Phase 5+ milestone: "Local MCP-compatible hub routing." ROADMAP already says to evaluate
Playwright MCP before designing Feather's hub. This research confirms the timing and the
design direction.

---

## MCP Spec Current State

### Where It Is Now
- Spec RC: "2026-07-28 Release Candidate" — published, final spec due July 28, 2026
- Previous spec: November 2025 release

### What's in the RC (Major Changes)

**Stateless HTTP core**
Streamable HTTP (current) has stateful sessions that fight load balancers.
RC redesigns: stateless protocol core, sessions created/resumed/migrated explicitly.
Enables horizontal scaling on ordinary HTTP infrastructure.
Not relevant for local Feather use, but means hub design patterns from 2025 docs are outdated.

**Extensions framework**
New extension model. Tasks is now an extension, not core.

**Tasks extension (was SEP-1686, now an extension)**
Was experimental core in Nov 2025 spec. Reshaped as extension in RC.
Lifecycle: server answers tools/call with a task handle, client drives with tasks/get,
tasks/update, tasks/cancel. Retry semantics and expiry policies defined.
Relevant for Phase 5+ long-running agent tasks.

**MCP Apps**
Server-rendered UIs via MCP. Not relevant for Feather.

**Authorization hardening**
Updated auth model. Important for Phase 5+ hub security.

### Timing Constraint
**DO NOT design the Phase 5+ MCP hub before July 28, 2026.**
The spec is in RC with major architectural changes. Designing against current spec risks rework.
The ROADMAP already captures this. This research confirms it.

---

## Playwright MCP Server (Microsoft)

### Status
- Launched: March 2025
- GitHub stars: ~30,000 (second most popular MCP server on GitHub)
- Maintained by Microsoft
- Uses accessibility snapshots (ARIA tree as YAML), not screenshots
- Works with non-vision LLMs (no image processing needed)

### How It Works
Browser automation capabilities exposed via MCP tools.
LLM/agent calls tools like `browser_navigate`, `browser_click`, `browser_snapshot`.
Accessibility tree is returned as structured YAML, not raw HTML or images.
This is why Playwright added `toMatchAriaSnapshot()` in 1.49 — same underlying tech.

### NEW: Microsoft Recommends Playwright CLI Over MCP for Coding Agents
As of 2026, Microsoft recommends Playwright CLI instead of MCP for coding agents:
- MCP: ~114,000 tokens for a typical browser automation task
- CLI: ~27,000 tokens for the same task (4x reduction)
- Reason: MCP keeps full conversational context per tool call; CLI is more task-focused

MCP remains better for:
- Persistent state across many tool calls
- Exploratory automation where the agent needs to "look around"
- Long-running autonomous workflows
- Our Cookie Mine model: agents need persistent state → MCP fits better than CLI

### Relevance to Feather Phase 5+

Cookie Mine model: agents open new pages (tabs) within the human's running Playwright session.
The Feather MCP hub routes agent tab requests to the live human session.

Option A: Build on top of Playwright MCP server
- Feather hub = thin wrapper around Playwright MCP that routes to the persistent session
- Leverages 30K-star ecosystem
- Risk: Playwright MCP may not support "open tab in existing session" — it usually launches its own session

Option B: Build Feather's own MCP-compatible hub
- Full control over session routing
- Can implement Cookie Mine's "share the human session" model exactly
- More work but more aligned with the architecture

Option C: Playwright CLI approach for agent commands
- 4x token efficient
- But loses persistent state — bad for Cookie Mine

**Likely: Option A for basic agent tools + Feather-specific tools for session sharing.**
Evaluate properly in Phase 5+ Step 0 after July 28, 2026 spec final.

---

## Summary / What To Do

| Decision | Recommendation |
|----------|----------------|
| Start Phase 5+ hub design | WAIT until July 28, 2026 (spec final) |
| Playwright MCP vs CLI | MCP fits Cookie Mine better (persistent state) |
| Build on Playwright MCP | Evaluate in Phase 5+ Step 0 |
| ARIA snapshots | Note for Phase 5+ — Playwright MCP uses this |

---

## Sources
- https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- https://modelcontextprotocol.io/development/roadmap
- https://github.com/microsoft/playwright-mcp
- https://testquality.com/playwright-test-agents-mcp-architecture-2026/
