# Session: Open-Source Integration Research — 2026-06-07

**Branch:** `claude/new-session-xdKS9`
**Commits:** `bf34a4b`, `1b6512b`, `7dd3dd1`

---

## What happened

Session opened with `/start`. Two inbox files found (`2026-06-07-social-research-*.md`) — not yet
processed (social research use-case seeds, parked).

Roi pasted an open-source integration research brief (previously committed to branch as
`9df15e7 Add open source integration research brief`). Session executed the full research brief:
inspected Feather's architecture, then ran parallel research agents across all four repos.

### Repos audited

| Repo | License | Stack | Verdict |
|------|---------|-------|---------|
| Browser Use | MIT | Python, raw CDP (`cdp-use`) | Reference + document CDP interop |
| Crawl4AI | Apache 2.0 | Python, Playwright + CDP | Reference; port extraction to TS |
| OpenHands | MIT (core) | Python, Docker-sandboxed Playwright | Architecture reference; MCP path future |
| Maxun | AGPL-3.0 | TypeScript, Playwright WS | Reference only (AGPL hard blocker) |

### Key findings

1. **Browser Use CDP attach works today, zero Feather changes.** `BrowserSession(cdp_url=...)` can
   attach to any Feather-managed session. Action item: expose WS endpoint in `LaunchSession` response
   + write one docs page.

2. **Crawl4AI's `DefaultMarkdownGenerator`** (standalone, ~300 lines, no browser dep) should be
   ported to TypeScript as a `markdown` output for Feather's `snapshot` command. Highest-leverage
   content-quality improvement. `JsonCssExtractionStrategy` informs `extract` schema evolution.

3. **OpenHands is MCP-first (V1).** Once Feather has an MCP surface (ADR-0006), a ~200-line
   `FeatherBrowserTool` subclass makes Feather the browser runtime for OpenHands agents. OpenHands
   V0 was removed April 2026; V1 uses `fastmcp` + `@modelcontextprotocol/sdk`. Install via
   `pip install openhands-ai` (MIT only; never touch `enterprise/`).

4. **Maxun's anti-bot npm packages are independently licensed and directly applicable to Feather's
   Stealth Stack:** `fingerprint-generator`, `fingerprint-injector`, `idcac-playwright`,
   `@cliqz/adblocker-playwright`. Evaluate before building fingerprint injection from scratch.
   Maxun also ships `@modelcontextprotocol/sdk` + `mcp-worker.ts` — worth reading for MCP patterns.
   CVE-2025-15105 (hardcoded crypto key, ≤v0.0.28) noted; not a risk for local Feather use.

5. **Maxun AGPL = permanent blocker.** The `WorkflowFile` `where/what` DSL pattern is worth
   porting by hand. Never import Maxun code.

### Ranked integration plan (written to research doc)

1. Browser Use CDP interop documentation — minimal effort, high signal
2. Port Crawl4AI extraction to TypeScript — medium effort, highest leverage
3. OpenHands MCP client path — speculative, depends on ADR-0006
4. Not worth doing: forking any of these; Maxun code import; Crawl4AI CDP bridge; Browser Use as TS dep

### Roadmap constraint added to `active.md`

Roi's instruction: "Note to take in consideration the research findings when restructuring the
roadmap and assigning tasks." Constraint block added to `active.md` covering all five integration
inputs for the re-sequencing pass.

### Fingerprint pivot discussion

Roi asked: "Should we Pivot to the Stealth Stack fingerprint package evaluation?" Recommendation
was no — the stealth plan is already written and reviewed; fingerprint packages are implementation
detail to evaluate as Task 1 of the Stealth implementation sprint, not a separate spec session.
Roi accepted; proceeding to Identity Model spec next.

---

## Left unfinished

- Identity Model spec session (Feature 3) — not started
- Roadmap re-sequencing pass — not started
- 2 inbox social-research seeds (`2026-06-07-social-research-*.md`) — not processed
- `dev` branch: commits `bb3c065`, `8a46065`, MFA docs still local-only (unpushed to `dev`)

## Next action

**Identity Model spec session** — read brief Feature 3 section + `docs/specs/adr-0008*` +
`research/2026-06-05-cookie-isolation-spike-findings.md` + Stealth/MFA seams →
write `docs/specs/2026-06-07-identity-model-design.md`.

---

## Roi quotes

- *"Note to take in consideration the research findings when restructuring the roadmap and assigning tasks"*
- *"Should we Pivot to the Stealth Stack fingerprint package evaluation given the Maxun finding?"*
- *"Do not assume we should copy or fork anything. First inspect architecture, license, dependencies, API boundaries"*
- *"Focus on practical integration: what to import, what to avoid, where the boundaries should be, what would create the most leverage"*
- *"Then use stop command"*
