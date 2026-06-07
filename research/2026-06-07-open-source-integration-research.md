# Open-Source Integration Research: Browser Use, Crawl4AI, OpenHands, Maxun

**Date:** 2026-06-07
**Status:** Research complete — ready for decision
**Source:** Research brief (pasted in chat, 2026-06-07)
**Maps to:** Feather Core agent-facing roadmap; Phase 5 agent runtime layer

---

## Summary Table

| Project | License | Stack | Browser/Session model | CDP attach? | Recommendation |
|---------|---------|-------|----------------------|-------------|----------------|
| Browser Use | MIT | Python | raw CDP client (`cdp-use`) | Yes — `BrowserSession(cdp_url=...)` | Reference + document interop |
| Crawl4AI | Apache 2.0 | Python | Playwright + CDP support | Yes — `BrowserConfig(cdp_url=...)` | Reference, port extraction to TS |
| OpenHands | MIT (core) | Python | Docker-sandboxed Playwright Chromium | No — browser locked inside container | Architecture reference only |
| Maxun | **AGPL-3.0** | **TypeScript** | Playwright WS (no CDP attach) | No — WS tunnel, not CDP | Reference only (AGPL blocker) |

---

## 1. Browser Use

**Repo:** https://github.com/browser-use/browser-use

### What it does
An LLM agent framework: user supplies a task + an LLM; the agent loops observe→reason→act over a browser. Solves agent-browser control at the orchestration layer, not the infrastructure layer. v0.12.9 (May 2026).

### Tech stack
- Python 3.11+ only
- Custom raw CDP client via `cdp-use` (sibling MIT repo) — dropped Playwright in v0.12.x
- LLM clients: Anthropic, OpenAI, Gemini, Groq, Ollama baked in
- 40+ Python deps (pydantic, aiohttp, httpx, pillow, google-api-python-client, optional AWS/OCI)

### License
MIT — compatible with Feather.

### Architecture
Three layers: `cdp-use` (type-safe auto-generated CDP bindings over `ws://localhost:9222`) → `BrowserSession` (manages a Chromium target, cookie watchdog, event bus) → `Agent` service (LLM loop, action registry with `@tools.action()` decorator pattern).

### Browser/session model
`BrowserSession` fully supports attaching to an existing browser via `cdp_url` — it calls `connect(cdp_url)` instead of launching its own process. `StorageStateWatchdog` persists auth state; `Storage.getCookies()` exports in Playwright-compatible format. `use_cloud=False` is the default.

### Integration options with Feather
**No Feather code changes needed.** A Browser Use agent can attach to a Feather-managed session today:
```python
from browser_use import Agent, BrowserSession
session = BrowserSession(cdp_url="http://localhost:9222")
agent = Agent(task="...", llm=my_llm, browser_session=session)
await agent.run()
```
Feather needs to expose the CDP port (Playwright's `browser.wsEndpoint()` or `--remote-debugging-port` flag). This is purely an agent-side config — Feather requires no changes. The main action item is **documentation**: "Browser Use agents can attach to Feather sessions out of the box."

### Forking difficulty
Medium. Well-structured but 40+ Python deps and the agent loop is tightly coupled to LLM provider abstractions. The `cdp-use` library is independently reusable.

### Reusable modules / ideas
- **`cdp-use`** (MIT, separate repo): Type-safe auto-generated CDP bindings — useful if Feather ever builds a Python client or test harness.
- **Action registry pattern** (`@tools.action(...)` decorator): maps cleanly to Feather's `CommandHandler<TIn, TOut>` — worth referencing for MCP tool registration design.
- **`StorageStateWatchdog` pattern**: cookie/auth persistence tied to `user_data_dir` events — Feather already does this in Node, but the watchdog-event model is a clean reference.
- **`cdp-use`'s typed CDP binding generation**: if Feather ever needs lower-latency CDP dispatch beyond Playwright's wrapper, this is the model.

### Risks
- Python-only vs. Feather's TypeScript — no shared runtime, always two separate processes.
- 40+ deps including LLM SDKs — importing as a library pulls surface area Feather doesn't need.
- Active architectural churn: dropped Playwright for raw CDP in v0.12.x; API still stabilising.
- No MCP surface — doesn't slot directly into Feather's ADR-0006 planned interface.

### Recommendation: **Use as reference / document CDP interop**
Browser Use's `BrowserSession(cdp_url=...)` confirms Feather's CDP-exposed sessions will be first-class attachment targets for Python agents — no Feather changes needed. Import or fork: no (Python, heavyweight, agent-layer, not infrastructure). Actionable: expose CDP port from Feather sessions and write a one-page "connect Browser Use to Feather" note.

---

## 2. Crawl4AI

**Repo:** https://github.com/unclecode/crawl4ai

### What it does
Async Python library that converts web pages into LLM-ready Markdown for RAG pipelines, agents, and structured data extraction. Core value: noise removal — strips nav/ads/boilerplate to return clean, citable Markdown or JSON. 58k+ GitHub stars; hit #1 trending in 2024.

### Tech stack
- Python (primary), small JS helpers
- Browser: Playwright (primary), Undetected-Chrome (optional), Selenium (deprecated/being removed)
- Key deps: Pydantic v2, httpx, playwright, redis (optional), PyTorch + transformers (optional for embedding strategies)
- Server mode: FastAPI with JWT auth

### License
**Apache 2.0** — fully compatible with Feather.

### Architecture
Layered async pipeline: `AsyncWebCrawler` (browser lifecycle, caching, anti-bot retries, concurrency via dispatcher) + **strategy-pattern decoupled** extraction. The crawler accepts pluggable `extraction_strategy`, `markdown_generator`, `chunking_strategy`, and `scraping_strategy` objects. `BrowserConfig` + `CrawlerRunConfig` separate browser from request config.

### Browser/session model
**CDP connection is natively supported.** `BrowserConfig` has `cdp_url`, `debugging_port`, `host`, and `cache_cdp_connection=True` parameters. `browser_mode="custom"` enables external CDP targets. `use_persistent_context=True` + `user_data_dir` stores cookie/auth state. Can accept an existing CDP session and inherit its cookies. Fully local operation is the default.

### Integration options with Feather
Two paths:

**Path A — CDP bridge (richer, riskier):** Feather exposes `--remote-debugging-port`. Crawl4AI attaches via `BrowserConfig(cdp_url="ws://localhost:9222")`. Feather navigates and warms the session; Crawl4AI handles extraction on the current tab. Feather's profile isolation + human-warmed cookies are preserved.
→ *Risk: dual-browser-client on same CDP endpoint (Playwright + Crawl4AI) may cause conflicts.*

**Path B — Standalone extraction sidecar (lower coupling, recommended):** Feather's `snapshot` command already does `page.evaluate()` to get raw HTML. That HTML is passed to `DefaultMarkdownGenerator.generate_markdown(input_html=..., base_url=...)` — a **standalone Python class that needs no browser at all**. Feather shells out or runs a thin Python sidecar (stdin HTML → stdout Markdown). Same pattern works for `JsonCssExtractionStrategy` (CSS schema → structured JSON, no LLM needed).

### Forking difficulty
Non-trivial for the full platform (~40+ modules, 1100+ LOC in the main crawler). Forking just the **extraction modules** (`markdown_generation_strategy.py`, `extraction_strategy.py`, `content_scraping_strategy.py`) is feasible — they are self-contained.

### Reusable modules / ideas
- **`DefaultMarkdownGenerator`**: standalone HTML→Markdown with citation numbering and link preservation. A few hundred lines wrapping `html2text` — portable to TypeScript.
- **`PruningContentFilter`**: DOM noise removal without query context. 
- **`BM25ContentFilter`**: query-aware content scoring, keeps only relevant blocks — useful for token-efficient `snapshot` when context window is tight.
- **`JsonCssExtractionStrategy`**: CSS-schema-driven structured JSON extraction from HTML, no LLM needed. Conceptually similar to Feather's `extract` command — compare designs.
- **Hooks system** (8 hook points around navigation/extraction): good pattern for Feather's own pipeline extensibility.

### Risks
- Language mismatch (Python vs TS/Node) — requires IPC/sidecar or subprocess boundary.
- Dual-browser CDP conflict (Path A) — fragile.
- Heavy optional deps (PyTorch, transformers) — avoidable if using pure extraction path.
- Fast-moving codebase — pin a version.

### Recommendation: **Use as reference; port extraction to TypeScript**
Do not take Path A (dual-CDP fragile). Path B (sidecar) works if Python overhead is acceptable. Best long-term: port `DefaultMarkdownGenerator` logic to TypeScript (it's a wrapper around `html2text` with citation handling — ~300 lines). Use `JsonCssExtractionStrategy` as reference for evolving Feather's `extract` command schema design. The `BM25ContentFilter` idea is worth pulling into Feather's snapshot output for token efficiency.

---

## 3. OpenHands

**Repo:** https://github.com/OpenHands/openhands

### What it does
Open platform for building LLM-powered software development agents. Agents write code, run tests, browse the web, and use terminals to complete programming tasks. 77.6% SWEBench score. Presented at ICLR 2025.

### Tech stack
- Python (primary), React frontend
- Browser: Playwright-controlled Chromium inside a Docker sandbox
- SDK: composable Python library for defining agents
- LLM: model-agnostic (Claude, GPT, Gemini, Ollama, etc.)

### License
**MIT** for core components. The `enterprise/` directory carries a commercial license (requires purchase for production use beyond one month). Core components are freely usable.

### Architecture
Four-layer system (V1 split):
1. **SDK** — composable agent definitions (Python)
2. **Tools layer** — action handlers (BashAction, IPythonRunCellAction, **BrowserInteractiveAction**, CmdRunAction)
3. **Runtime** — sandboxed execution environment. Default: Docker. Alternatives: LocalRuntime (host), RemoteRuntime (fleet-scale). Plugin backends: E2B, Modal, Daytona.
4. **Workspace** — file system and persistence context

The Docker runtime builds on an arbitrary base image and injects OpenHands' action execution API into it — enabling arbitrary OS/software environments.

### Browser/session model
Browser is **hardwired inside the Docker sandbox** — a Playwright-controlled Chromium runs inside the container alongside a Jupyter IPython server. `BrowserInteractiveAction` sends commands to this internal browser. The runtime IS the sandbox; there is no "swap in an external browser" interface. The sandbox itself is pluggable (Docker/E2B/Modal/Daytona), but within each sandbox the browser is Playwright-managed internally.

### Integration options with Feather
**Not a direct integration target.** The browser is inside the container and not addressable from outside. Feather cannot be substituted as the "browser runtime" for OpenHands agents without forking OpenHands' action execution API and replacing the browser tooling.

The realistic integration path: **Feather as a tool that OpenHands agents invoke via HTTP.** An OpenHands agent can run `curl` commands inside its Docker sandbox to hit Feather's local HTTP API — treating Feather like any other local service. This works today without any changes to either project but is indirect.

Future path: when Feather exposes an MCP surface (ADR-0006), it could become an MCP-registered browser tool for any MCP-aware agent framework including OpenHands, if OpenHands adopts MCP tool calling.

### Forking difficulty
High. OpenHands is a large platform — 4-layer agent framework, Docker runtime, multi-LLM routing, complex action registry. Not meaningfully forkable for Feather's purposes.

### Reusable modules / ideas
- **Action type model** (`BrowserInteractiveAction`, `BashAction`, `IPythonRunCellAction`): clean separation of action categories that maps well to Feather's `CommandHandler` pattern.
- **Pluggable runtime model** (Docker / LocalRuntime / RemoteRuntime / E2B / Modal): good architectural reference for how Feather might eventually support multiple execution environments.
- **Agent tool interface pattern**: how it exposes browser-as-tool (action schema, result schema, error handling) is worth reading for Feather's MCP surface design.
- **`BrowserInteractiveAction` result payloads**: what structured data agents actually need back from a browser action — good benchmark for Feather's response schemas.

### Risks
- Size and complexity: forking or deep integration is disproportionate for Feather's needs.
- Enterprise license in `enterprise/` — keep Feather's code free of that subtree.
- Docker-dependency assumption may clash with Feather's local-only, no-container design.

### Recommendation: **Architecture reference only**
OpenHands is not a realistic integration or fork target for Feather's current phase. It is the most valuable **architecture reference** of the four: its action model, pluggable runtime interface, and tool schema design are directly relevant to Feather's Phase 5 MCP surface. Read it as a blueprint, not a dependency.

---

## 4. Maxun

**Repo:** https://github.com/getmaxun/maxun

### What it does
No-code web data extraction platform. Users record browser interactions via a visual UI; recordings become reusable "robots" that scrape, crawl, or extract structured data. Targets the Apify/Browserbase market. v0.0.34 (beta).

### Tech stack
- **TypeScript** (94%) + JavaScript — same stack as Feather
- Browser: `playwright-core` 1.57.0 via `chromium.connect(wsEndpoint)` to a separate browser container
- Recording: `rrweb` (DOM streaming replay)
- Backend: Node.js + Express + Socket.io + PostgreSQL (Sequelize) + Redis (graphile-worker) + MinIO (S3-compatible)
- Frontend: React + Vite
- AI: `@anthropic-ai/sdk` for LLM extraction mode
- Analytics: PostHog telemetry embedded in the server
- Deployment: Docker Compose (separate `browser`, `server`, `frontend` containers)

### License
**AGPL-3.0** — any software that links to, embeds, or runs alongside Maxun and is served over a network must also be AGPL. **Hard blocker for Feather code reuse unless Feather is also fully AGPL.**

### Architecture
`maxun-core` (npm package, ~5 source files) is the reusable kernel. Exports `Interpreter`, `Preprocessor`, and types (`WorkflowFile`, `WhereWhatPair`). The Interpreter takes a pre-instantiated Playwright `Page` and a workflow definition, executes steps declaratively.

**Workflow DSL** (`WorkflowFile`): JSON-serialized array of `{where: {...}, what: [...]}` pairs. `where` supports `$and/$or/$not` with URL/selector/cookie conditions. `what` supports custom actions (`scrapeSchema`, `scrapeList`, `crawl`, `screenshot`) and raw Playwright method calls (`goto`, `click`, `type`). Pagination strategies: `clickNext`, `clickLoadMore`, `scrollDown`.

Scheduler: `graphile-worker` (PostgreSQL-backed), fully local. Recording engine: `rrweb` streams DOM events; a separate recorder translates interactions into workflow steps.

### Browser/session model
**Does NOT use `connectOverCDP`.** Uses `chromium.connect(wsEndpoint)` — Playwright's own WS tunneling protocol, not raw CDP. This is architecturally different from CDP attach. No persistent profile support: browser contexts created fresh per session with `context.newPage()`. No `userDataDir`. "Extract behind login" stores a Playwright `storageState` snapshot in the DB and replays it into a new context — not reusing a live persistent profile.

### Integration options with Feather
**Cannot attach to a Feather-managed session directly.** Maxun uses Playwright's WS tunnel, not CDP. Feather's `Page` objects are not accessible from outside over Feather's HTTP API.

`maxun-core`'s `Interpreter` accepts a Playwright `Page` object directly — if Feather exposed its Playwright `Page` programmatically (not just over HTTP), the Interpreter could be handed that page. But Feather is HTTP-API-first with no programmatic page export, so this requires a significant seam change.

The `WorkflowFile` DSL format is worth adapting independently in Feather (porting the concept, not importing the code under AGPL).

### Forking difficulty
High. Maxun is a **platform**: recording UI + browser service + job scheduler + PostgreSQL + MinIO + frontend tightly coupled. `maxun-core` is the one separable piece but carries AGPL.

### Reusable modules / ideas
- **`WorkflowFile` DSL pattern** (`where/what` pairs, `$and/$or/$not` conditions): well-designed and documented in types — port by hand into Feather's automation layer.
- **`scrapeSchema` / `scrapeList` action model**: structured CSS-selector-based extraction with list detection — compare and inform Feather's `extract` command recipe format.
- **Pagination strategies** (`clickNext`, `clickLoadMore`, `scrollDown`): well-abstracted — copy as patterns, not code.
- **`rrweb`** (MIT, separate npm package): DOM streaming replay — usable independently for a future Feather session recorder.
- **Anti-bot npm packages (independently licensed — directly applicable to Feather Stealth Stack):**
  - `fingerprint-generator` — browser fingerprint spoofing
  - `fingerprint-injector` — injects spoofed fingerprint into a Playwright context
  - `idcac-playwright` — dismisses cookie consent banners automatically
  - `@cliqz/adblocker-playwright` — ad blocker integration for Playwright
  These are the npm packages Maxun uses for stealth. They are **independent npm packages**, not AGPL-covered. Feather's Stealth Stack should evaluate these before building fingerprint injection from scratch.
- **MCP worker**: Maxun includes `@modelcontextprotocol/sdk` v1.12.1 and a `mcp-worker.ts`. Worth reading for MCP server implementation patterns.

### Risks
- **AGPL-3.0**: hard blocker for importing maxun-core or any Maxun code.
- No CDP attach: fundamental session model incompatibility with Feather's persistent profiles (`chromium.connect(wsEndpoint)` ≠ `connectOverCDP()`).
- Tight platform coupling: can't extract recorder or DSL engine without significant work.
- PostHog analytics embedded in server: must be patched out for clean local deployment.
- **CVE-2025-15105** (hardcoded crypto key in `server/src/routes/auth.ts`, versions ≤ 0.0.28, vendor did not respond to disclosure): low risk for local Feather use, yellow flag for project security culture.
- v0.0.41 — beta, unstable API surface.

### Recommendation: **Use as reference only**
AGPL makes direct code reuse legally hazardous for Feather (unless Feather is also AGPL). More importantly, Maxun's browser model (WS tunnel, no CDP attach, no persistent profile reuse) is incompatible with Feather's session architecture at the infrastructure level. The DSL patterns and extraction abstractions are valuable — port them by hand into Feather's automation layer to keep the license clean.

---

## Ranked Integration Plan

### 1. Easiest useful integration: Browser Use + CDP interop documentation
**Effort: minimal (docs only).** No code changes to Feather. Expose the CDP/WS endpoint from Feather sessions (flag or API field), write a page in the docs: "Python agents using Browser Use can attach to a Feather session with `BrowserSession(cdp_url=...)`, inheriting its warmed cookies and persistent profile." This makes Feather immediately useful to the Python agent community that's already using Browser Use.

### 2. Highest-leverage integration: Port Crawl4AI's extraction layer to TypeScript
**Effort: medium (days, not weeks).** Feather's current `snapshot` returns raw `innerText + links + meta`. Porting `DefaultMarkdownGenerator` (HTML→clean Markdown with citations, ~300 lines wrapping `html2text`) and `BM25ContentFilter` (query-aware content filtering) into Feather's `snapshot` or a new `markdown` command would make Feather's page content output dramatically more useful for agents — token-efficient, clean, citable. No Python dependency, no IPC, stays native TypeScript. `JsonCssExtractionStrategy` informs evolving the `extract` command's recipe schema.

### 3. Risky but interesting: OpenHands as a future MCP client
**Effort: speculative — depends on ADR-0006 MCP surface being built.** Once Feather exposes an MCP-compatible agent-facing surface (Phase 5), Feather could register itself as an MCP browser tool. OpenHands, if it adopts MCP tool calling, could then drive Feather sessions as its browser runtime — giving Feather's persistent-profile, anti-detection-hardened sessions to a major open-source agent framework. This is architecturally sound but depends on: (a) Feather building the MCP surface, (b) OpenHands adopting MCP tool calling. Monitor OpenHands' MCP roadmap; do not build toward this assumption today.

### 4. Not worth doing
- **Integrate or fork Browser Use**: Python-only, heavyweight, agent-layer not infrastructure-layer. Feather should not become a Python runtime.
- **Crawl4AI as a runtime CDP bridge (Path A)**: dual-browser-client fragility on the same CDP session is not worth the complexity. Port the extraction logic instead.
- **Fork Maxun**: AGPL license + incompatible session model + platform tightness = wrong fit at every level.
- **Fork OpenHands**: disproportionate scale for Feather's current needs. Read it, don't fork it.

---

## Key Findings for Feather

1. **Feather's CDP-exposed sessions are a first-class interop point.** Browser Use (via `cdp-use`) and Crawl4AI both support attaching to an existing browser over CDP. Exposing the CDP port from Feather sessions unlocks both without any architectural changes.

2. **The extraction gap is Feather's most actionable improvement.** All four projects invest significantly in HTML→clean-content pipelines. Feather's current `innerText + links` snapshot is the weakest link for agent use. A proper Markdown extraction layer would be the highest-leverage improvement.

3. **The workflow DSL pattern (Maxun's `WorkflowFile`) is worth designing into Feather independently.** A `where/what` declarative automation format fits naturally on top of Feather's existing click/type/press/wait commands. Design it from scratch (Maxun's patterns as reference) to stay AGPL-clear.

4. **Feather's MCP surface (ADR-0006) is the long-term interop bet.** OpenHands already ships `fastmcp` and an `mcp-worker.ts`; Maxun already ships `@modelcontextprotocol/sdk`. The MCP seam is becoming standard quickly. A well-designed MCP interface makes Feather pluggable into any of them (OpenHands, future Browser Use, custom Claude agents) without bilateral integration work.

5. **Maxun's anti-bot npm packages are directly applicable to Feather's Stealth Stack and carry no AGPL risk.** `fingerprint-generator`, `fingerprint-injector`, `idcac-playwright` are independent npm packages Maxun uses but does not own. Feather should evaluate these before building fingerprint injection from scratch.

6. **Maxun's AGPL is a permanent blocker** — not a risk to monitor, a decision already made. Reference only; never import.

7. **OpenHands' `FeatherBrowserTool` path is clean (~200 lines Python) once Feather has an MCP surface.** A custom `Tool` subclass that proxies all browser actions to Feather's REST endpoints would replace OpenHands' BrowserGym browser entirely — giving Feather's persistent-profile, anti-detection sessions to OpenHands agents. Install `openhands-ai` (MIT) from PyPI; never touch `enterprise/`.
