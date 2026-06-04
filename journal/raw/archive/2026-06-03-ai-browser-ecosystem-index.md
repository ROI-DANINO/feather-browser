# AI Browser Ecosystem Research — Inbox Index

- **Date:** 2026-06-03
- **Source:** GPT web/community scan and strategic synthesis
- **Scope:** AI browsers, browser agents, local agent runtimes, Playwright/MCP infrastructure, security risks
- **Purpose:** Give Claude a structured research packet to triage against local planning files before converting anything into tasks, ADRs, or roadmap changes.

## Important instruction for Claude

These files are **research intake**, not execution instructions.

Before changing roadmap, tasks, ADRs, or code, classify each finding as:

1. **Already covered locally** — cite local file/section.
2. **Useful background only** — no task needed.
3. **Should become research note** — move/refine into `research/` or canonical research location.
4. **Should become task** — add only to the appropriate current/planned phase.
5. **Should become ADR input** — connect to ADR-0004/ADR-0005 or future ADR.
6. **Invalid / stale / unsupported** — discard or mark accordingly.

GPT did not see local-only files. Treat all recommendations as provisional.

---

## Files in this packet

### 1. `2026-06-03-open-source-browser-agents.md`

Covers open-source and developer-facing projects:

- OpenClaw / Moltbot
- browser-use
- Browserbase / Stagehand
- LiteWebAgent
- Agent S / Simular-style computer-use agents
- Hugging Face Open Computer Agent / smolagents

Main question: **What are open-source/local/developer communities building near Feather's direction?**

### 2. `2026-06-03-commercial-ai-browsers.md`

Covers commercial AI browser moves:

- Perplexity Comet
- ChatGPT Atlas
- Dia / The Browser Company
- Google Project Mariner / Gemini Computer Use

Main question: **What are big players trying, and what should Feather avoid copying?**

### 3. `2026-06-03-browser-agent-security-risks.md`

Covers security and trust risks:

- prompt injection in browser agents
- agent hijacking
- data exfiltration
- ambient authority
- fingerprinting of AI browsing agents
- approval checkpoints
- bot-detection wording risk

Main question: **What security model should Feather start thinking about before Phase 5?**

### 4. `2026-06-03-mcp-playwright-nlweb-protocols.md`

Covers protocol and infra context:

- MCP ecosystem
- Playwright MCP
- NLWeb
- browser automation vs API/tool-native automation

Main question: **How should Feather think about MCP without over-building too early?**

### 5. `2026-06-03-feather-strategic-implications.md`

Synthesizes the practical implications for Feather:

- suggested positioning
- what to keep in S1/S2/S3
- what to defer
- product-language risks
- recommended research backlog

Main question: **What does all this mean for Feather's roadmap and identity?**

---

## Suggested Claude triage order

1. Read `feather-strategic-implications` first for the distilled view.
2. Read `browser-agent-security-risks` before touching any agent-facing language.
3. Read `mcp-playwright-nlweb-protocols` before any MCP-related planning.
4. Read open-source/commercial files as competitive context.
5. Compare against local `context/active.md`, `ops/tasks.md`, current handoff notes, and ADR drafts.

---

## One-line synthesis

Feather should not rush to become “an AI browser.” The stronger strategic lane is: **a local, inspectable browser runtime for human-approved agentic automation**, with Linux-native weight reduction, reliable observability, and clear permission boundaries before any agent layer.

## Claude follow-up questions

- Is this packet already covered by local research files?
- Which file, if any, should be moved from `raw/_inbox` into canonical `research/`?
- Does anything here affect current S1 work, or should it wait for S2/S3/Phase 5?
- Should the public roadmap wording around bot detection/session reuse be softened?
