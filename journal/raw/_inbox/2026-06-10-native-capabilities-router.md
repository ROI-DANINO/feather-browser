# Native Capabilities Router / Feather Connect

Status: raw inbox idea
Date: 2026-06-10
Source: Roi product/architecture reflection

## Core thought

Feather was originally created because many important websites do not expose a practical API surface for agents.
Some sites have no API, some have expensive APIs, some have APIs that are too complex for normal users, and some expose only partial functionality.
For those cases, Feather's browser observe-act loop is the right primitive: the agent uses the web like a human, through the user's real session and visible UI.

But browser control should not be the only execution mode.

When a site or product exposes a reliable structured interface — official API, SDK, OpenAPI/Swagger spec, MCP server, local CLI, or trusted community connector — Feather should be able to use that native capability instead of spending tokens and time on visual browser automation.

## Proposed product principle

Feather should become a universal web execution layer for agents.

It should prefer structured native capabilities when available:

- API connectors
- MCP tools
- local scripts / CLIs
- typed integrations
- OpenAPI-generated tools

When no reliable native capability exists, or when the task depends on what the user actually sees in the browser, Feather should fall back to its browser observe-act loop.

The browser is not the only mode.
It is the universal fallback.

## Why this matters

Browser automation is powerful, but expensive and fragile for tasks that already have structured interfaces.

A native API/MCP call can avoid:

- repeated observe loops
- screenshots
- DOM/snapshot parsing
- locator instability
- visual ambiguity
- retry loops
- high token burn
- UI changes breaking flows

For common products like Gmail, Google Calendar, GitHub, Slack, Notion, Airtable, Linear, Jira, Drive, Sheets, etc., many actions are better handled through structured APIs or MCP tools.

But Feather still matters because the long tail of the web remains UI-first:

- government portals
- insurance portals
- banks and forms
- internal company dashboards
- sites with partial APIs
- sites where the API does not expose the user-visible workflow
- sites where auth/session state is easiest through the browser

## Possible architecture

Introduce a Capability Registry and router.

High-level flow:

```text
User task
  -> intent / capability analysis
  -> capability registry lookup
  -> choose execution mode
       - native API
       - MCP tool
       - local connector
       - browser observe-act loop
       - human handoff
  -> execute
  -> log evidence, result, and fallback decisions
```

Each capability can be represented by a manifest:

```yaml
name: google_calendar
type: api
domain: calendar
actions:
  - search_events
  - create_event
  - update_event
auth:
  type: oauth
risk:
  read: low
  write: medium
fallback:
  browser: true
```

MCP tools can be registered similarly:

```yaml
name: github_mcp
type: mcp
source: local_server
tools:
  - search_repositories
  - read_file
  - create_issue
risk_policy:
  write_requires_confirmation: true
fallback:
  browser: true
```

## Key design question

This should probably not start as "add integrations for every website".
That risks turning Feather into a small Zapier/Make clone and pulling the project away from its unique advantage.

A better framing:

Feather does not maintain integrations for the whole internet.
Feather maintains a capability layer that can register, inspect, route to, and fall back from external capabilities.

## Possible feature: paste docs -> native capability

The more ambitious idea is an integration builder.

User provides one of:

- API documentation
- OpenAPI / Swagger spec
- MCP server config
- SDK README
- curl examples
- Postman collection
- auth notes

Feather analyzes the material and generates a temporary or durable native capability:

1. Parse the available actions.
2. Infer auth requirements.
3. Generate tool schemas.
4. Mark read/write risk levels.
5. Run safe read-only test calls where possible.
6. Register the connector in the Capability Registry.
7. Route future tasks to it when better than browser mode.

This would let Feather support common and niche systems without manually hand-coding every integration.

## MVP ladder

### Phase 1 — Manual capability manifests

Allow manually defined capability files under an `integrations/` or similar folder.
The router can read the manifest and decide whether a native tool exists before using browser mode.

### Phase 2 — MCP import

Allow a user/project to register existing MCP servers.
Feather inspects the exposed tools and adds them to the registry with risk and fallback metadata.

### Phase 3 — OpenAPI import

Allow a user to provide an OpenAPI spec and generate basic typed actions.
Start with read-only endpoints before write actions.

### Phase 4 — Smart execution router

Before acting in the browser, Feather asks:

"Is there a native capability that can complete this task more safely, cheaply, or reliably?"

### Phase 5 — Hybrid plans

Support plans that mix native calls and browser actions.
Example: use an API to fetch structured data, then open the browser only when the user-visible UI or manual confirmation matters.

## Routing heuristics

Prefer native capability when:

- task is data retrieval or structured write
- auth is already configured
- the API/MCP covers the required action fully
- output needs to be structured
- batch operations are involved
- UI state is irrelevant

Prefer browser mode when:

- no native connector exists
- the workflow depends on visible UI
- the site has no practical API
- auth/MFA/session is browser-only
- the API is partial or does not match the real user workflow
- the user needs visual confirmation
- the task touches sensitive account flows

Use human handoff when:

- MFA/login is required
- action is risky or irreversible
- payment/submission/legal/medical/financial action is involved
- the agent cannot confidently choose between native and browser execution

## Product boundary

Feather should not become:

- Zapier
- Make
- a huge catalog of hard-coded SaaS integrations
- a browser-only automation toy

Feather should become:

- an execution substrate for agents
- a router across native capabilities and browser control
- a system that can use APIs/MCP when available
- a system that can fall back to browser reality when native surfaces are missing or insufficient
- a system that logs why it chose each execution path

## Open questions

- What is the minimum manifest format?
- Should capabilities live inside the repo, user config, or project memory?
- How does auth get stored safely?
- How do we prevent generated connectors from overclaiming capability coverage?
- Should write actions always require confirmation by default?
- How should the router compare token cost, reliability, and risk?
- Should this integrate with Graphify or remain separate from code-wiring maps?
- How do we distinguish "API exists" from "API is actually practical for this user/task"?

## Candidate vision sentence

Feather is a universal web execution layer for agents: it prefers native APIs, MCP tools, and typed integrations when they are reliable, and falls back to browser observe-act control when the real web has no better interface.
