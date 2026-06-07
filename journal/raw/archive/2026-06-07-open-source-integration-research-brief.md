# Feather Integration Research Inbox

Purpose:
Use this file as a starting point for a Claude brainstorming/research session about open-source projects that may be useful to study, fork, or integrate into Feather.

Goal:
Explore whether parts of these projects can become Feather features, integrations, adapters, or reference implementations.

Important:
Do not assume we should copy or fork anything.
First inspect architecture, license, dependencies, API boundaries, and whether integration makes sense for Feather.

---

## Feather Context

Feather is being developed as a browser workspace/runtime for shared human-agent work.

Current relevant capabilities:
- Persistent browser profiles
- Saved cookies and login state
- Profile isolation
- Local Chromium runtime
- Demo proving profile/session persistence
- Direction: human + agent sharing the same browser environment

Possible future direction:
- Full browser UI
- Agent-visible actions
- Human approval checkpoints
- Manual override
- Agent inbox
- Debug/replay
- Integrations with open-source browser automation and scraping tools

---

## Repositories to Research

### 1. Browser Use

Repo:
https://github.com/browser-use/browser-use

Why inspect:
Browser Use is close to the agent-browser-control layer.

Research questions:
- Can Feather use Browser Use as an agent control layer?
- Can Browser Use operate on an existing Feather-managed profile/session?
- What browser abstraction does it expose?
- Is it better to integrate, fork, or only learn from it?
- Which parts are reusable inside Feather?

Possible Feather feature areas:
- Agent browser actions
- Task execution
- Browser state interpretation
- Agent control loop

---

### 2. Crawl4AI

Repo:
https://github.com/unclecode/crawl4ai

Why inspect:
Crawl4AI is relevant for page extraction, crawling, Markdown conversion, and AI-ready web content.

Research questions:
- Can Feather use Crawl4AI for extraction instead of building its own extraction system?
- Can it work with Feather-controlled browser sessions?
- Does it support authenticated/session-based pages?
- What parts of its extraction pipeline are reusable?
- Would integration be cleaner than forking?

Possible Feather feature areas:
- Extract page as Markdown
- Clean content extraction
- AI-ready page snapshots
- Crawling from an active browser session

---

### 3. OpenHands

Repo:
https://github.com/OpenHands/openhands

Why inspect:
OpenHands is a full agent workspace for software work, including browser/tool/runtime concepts.

Research questions:
- How does OpenHands structure agent tools?
- How does it expose browser capabilities to agents?
- Could Feather become a browser runtime/tool provider for systems like OpenHands?
- Are there useful patterns for sandboxing, events, logs, or tool APIs?
- Is direct integration realistic, or is this mainly architecture reference?

Possible Feather feature areas:
- Agent tool interface
- Workspace/runtime design
- Logging and replay
- Human-agent workflow patterns

---

### 4. Maxun

Repo:
https://github.com/getmaxun/maxun

Why inspect:
Maxun is relevant for browser automation, scraping, robots, workflow recording, and no-code/low-code automation.

Research questions:
- What automation/robot concepts could Feather reuse?
- Is there a recorder or workflow engine worth studying?
- Can Maxun be integrated as a feature layer?
- Is it too product-heavy to integrate cleanly?
- Which parts should Feather avoid rebuilding?

Possible Feather feature areas:
- Browser workflow recording
- Repeatable automations
- Extraction workflows
- Robot/task templates

---

## Research Output Needed

For each repository, produce:

1. What it does
2. Tech stack
3. License
4. Main architecture
5. Browser/session model
6. Integration options with Feather
7. Forking difficulty
8. Reusable modules or ideas
9. Risks
10. Recommendation:
   - integrate
   - fork
   - use as reference only
   - avoid

---

## Key Integration Questions

- Can the project work with an existing Chromium profile?
- Can it connect to an existing browser instance over CDP?
- Can it preserve authenticated sessions?
- Can it run locally without cloud dependency?
- Can it expose a clean API to Feather?
- Is the license compatible with Feather?
- Is it modular enough to integrate without importing the whole product?
- Does it duplicate Feather core, or complement it?

---

## Session Prompt for Claude

Use this file as the starting point for a brainstorming and research session.

First, inspect Feather's current architecture.
Then inspect the repositories listed above.
Do not write code yet.

The goal is to decide which open-source projects can realistically be integrated into Feather as features, adapters, or reference implementations.

Focus on practical integration:
- what to import
- what to avoid
- where the boundaries should be
- what would create the most leverage for Feather
- what would distract from Feather's core direction

End with a ranked integration plan:
1. easiest useful integration
2. highest-leverage integration
3. risky but interesting integration
4. things not worth doing

---

## Status

**Processed 2026-06-07.** Research output: `research/2026-06-07-open-source-integration-research.md`.
Findings incorporated into roadmap re-sequencing constraint block (`journal/context/active.md`, `journal/ops/tasks.md`).
