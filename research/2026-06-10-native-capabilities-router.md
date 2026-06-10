# Native Capabilities Router / Connector Registry — Idea + Research Map

- **Date:** 2026-06-10 (placement decided same day)
- **Status:** Research input — **anchored at Session 5.0.1 (MCP & tool-surface reconciliation)**.
  Not a build task. Do not implement before Gate A (Session 5.0.0 / ADR-0010).
- **Source:** Roi product reflection + first web-research pass (originally
  `journal/raw/_inbox/2026-06-10-native-capabilities-router.md` and
  `…-research-map.md`, merged here; originals archived under `journal/raw/archive/`).

## Placement decision (2026-06-10, Roi + agent)

The router idea lands at **Session 5.0.1, after Gate A** — not inside Gate A, not now:

1. **Recorded doctrine already routes it there.** Feather is "the browser-native execution layer
   when APIs aren't enough — NOT a Composio-style integration platform"; tool-surface questions
   are Phase 5.0 input by standing decision. 5.0.1 exists to answer "how does Feather relate to
   MCP and external tools" — this idea is that session's strongest input to date.
2. **Security sequencing.** Native connectors mean OAuth tokens, real-account write access, and
   imported third-party tools — they *widen* the blast radius (this doc's own security findings
   say deny-by-default, allowlists, confirmation gates). That machinery **is** Gate A. Building
   the router first would repeat the exact council-flagged mistake ADR-0010 reverses.
3. **The routing already happens for free today** in the driving agent's head: Claude Code holds
   MCP tools next to the Feather skills and already chooses native-vs-browser per task. A router
   *inside* Feather only pays off when Feather becomes the host exposing one unified tool
   surface — which is literally 5.0.1's headline question.
4. **Rename:** "Capability Registry" collides with ADR-0010's security-critical *capability
   grants*. Use **"Connector Registry"** (or "Native Capabilities Layer") for this feature.
5. **Doctrine flag for the 5.0.1 joint call:** the vision sentence below ("universal web
   execution layer") is broader than the recorded "sharper, not broader" positioning. If it is to
   replace the front-door framing, that is its own ADR — a deliberate call, not a slide-in.
6. **Deferred with it:** the deep follow-up research checklist (Google MCP auth, XMCP
   architecture, LinkedIn Share setup, …) runs in the session that builds this, not earlier —
   API research done months ahead goes stale.

The ambitious half (paste-docs → generated connector builder) sits even further out, v3 / 5e
territory.

---
---

# Part 1 — The idea (raw note, 2026-06-10)

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

Introduce a Connector Registry and router. *(Originally "Capability Registry" — renamed at
placement to avoid colliding with ADR-0010 capability grants.)*

High-level flow:

```text
User task
  -> intent / capability analysis
  -> connector registry lookup
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
6. Register the connector in the Connector Registry.
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

*(Placement note: this sentence is broader than the recorded positioning doctrine — see the
placement decision at the top before adopting it anywhere public.)*

---
---

# Part 2 — Research map (first web pass, 2026-06-10)

## Purpose

This is not a final architecture decision.
It is a research map for the next deeper pass with Claude / Pi / Codex.

Goal: identify promising initial native integrations for Feather, especially where native API/MCP access can save browser-observe tokens and reduce UI fragility, while keeping the browser observe-act loop as the universal fallback.

User priority areas:

1. Google Workspace
2. Popular social networks: LinkedIn / Instagram / X
3. Israeli government / insurance / banks / portals
4. Evidence for MCP/API/docs-import implementation patterns

## High-level finding

The strongest evidence supports starting with a Connector Registry + MCP/API importer rather than hard-coding many website-specific integrations.

Google Workspace and X are especially useful because they already expose agent-facing material:

- Google Workspace has official remote MCP servers for Gmail, Drive, Calendar, Chat, and People.
- X has official API docs, an OpenAPI spec, and an official MCP server that auto-generates tools from the OpenAPI spec.
- LinkedIn has official APIs, but access is limited; basic sharing is open-ish, deeper marketing/sales/talent APIs require approval.
- Instagram/Meta is more constrained; official APIs exist, but likely best as research/fallback candidate rather than MVP core.
- Israeli gov/banks/insurance are likely browser-first for personal workflows, with selective data/API opportunities rather than broad native action APIs.

## Core recommendation

Do not start by adding many specific website integrations.

Start with three layers:

1. `capability manifest` support
2. `MCP import` support
3. `OpenAPI/docs import` research spike

Then ship only a few high-value connectors as proof:

- Google Workspace MCP: Gmail, Drive, Calendar, People, Chat
- X API/X MCP as OpenAPI-to-MCP case study
- LinkedIn Share as restricted social API case study
- data.gov.il CKAN/data API as Israeli public-data case study
- Browser fallback recipes for Instagram, Bituach Leumi, banks, insurance portals

## Candidate table

| Candidate | Type | Value for Feather | Difficulty | Risk | Recommendation |
|---|---|---:|---:|---:|---|
| Google Workspace MCP | Official remote MCP | Very high | Medium | Medium | MVP #1 |
| Gmail API | Official REST API + MCP | Very high | Medium | Medium | Use via Google MCP first, direct API later |
| Google Calendar API | Official REST API + MCP | Very high | Medium | Medium | Use via Google MCP first |
| Google Drive API | Official REST API + MCP | Very high | Medium | Medium | Use via Google MCP first |
| Google Sheets API | Official REST API, also Workspace ecosystem | High | Medium | Medium | Phase 2, useful for structured outputs |
| Google People/Contacts | Official API + MCP | High | Medium | Medium | Include if using Workspace MCP |
| Google Chat | Official API + MCP | Medium | Medium | Medium | Include after Gmail/Drive/Calendar |
| X API | Official REST API | High | Medium/High | Medium/High due pricing and social writes | Good research + optional connector |
| X MCP / XMCP | Official MCP generated from OpenAPI | Very high as architecture reference | Medium | Medium/High | Study carefully; maybe copy pattern |
| LinkedIn Share | Official API permission `w_member_social` | Medium/High | Medium | Medium | Good narrow connector, not broad LinkedIn automation |
| LinkedIn Marketing/Sales/Talent APIs | Official but approval-gated | Medium | High | Medium | Research only unless user has partner access |
| Instagram Graph/API | Official Meta APIs, constrained | Medium | High | High | Research; browser fallback likely remains primary |
| Threads API | Official Meta API area likely relevant | Medium | Medium/High | Medium | Research later; not MVP |
| data.gov.il CKAN API | Official/public open-data API | Medium | Low/Medium | Low | Good Israeli public-data connector |
| Bituach Leumi personal portal | Personal service portal | High user relevance | High | High | Browser-first; no public personal API found in quick pass |
| Israeli banks/open banking | Regulated API ecosystem | High potential | High | Very high | Research; likely not MVP without licensed access |
| Insurance company portals | Personal account portals | High user relevance | High | High | Browser-first/human-handoff |
| Arcade-style tool layer | Product/reference architecture | High | Medium | Medium | Study for auth, tool catalogs, MCP gateway patterns |
| AutoMCP / OpenAPI-to-MCP research | Research pattern | Very high | Medium | Medium | Use as design evidence for docs/import feature |

## Evidence notes

### Google Workspace

Google Workspace is the best MVP candidate.

Official evidence found:

- Gmail API is a RESTful API for authorized access to Gmail mailboxes and sending mail.
- Calendar API is RESTful and exposes most features available in the Calendar web interface.
- Drive API supports Drive cloud storage, search, upload/download, sharing, activity, labels, and Drive UI integration.
- Sheets API lets apps read/modify spreadsheet data, create spreadsheets, read/write cells, update formatting, and manage connected sheets.
- Google now documents Google Workspace remote MCP servers for Gmail, Drive, Calendar, Chat, and People.
- The Google MCP page lists concrete tools such as:
  - Gmail: `create_draft`, `get_thread`, `search_threads`, labels/drafts tools
  - Drive: `search_files`, `read_file_content`, `download_file_content`, metadata/permissions
  - Calendar: `create_event`, `list_events`, `suggest_time`, `respond_to_event`, `update_event`
  - People: `get_user_profile`, `search_contacts`, directory search
  - Chat: search/list/send messages

Why this matters for Feather:

Google Workspace is exactly the case where browser automation is wasteful for routine operations.
Feather should route Gmail/Drive/Calendar tasks through MCP/API when possible and use browser only for user-visible UI, MFA, review, odd settings, or workflows not covered by tools.

Suggested MVP path:

1. Build `mcp_remote_capability` manifest type.
2. Import Google Workspace MCP servers into registry.
3. Support OAuth metadata and scopes.
4. Default all write actions to confirmation/draft-first.
5. Add browser fallback when OAuth missing or when the user asks to inspect the live UI.

Candidate manifest sketch:

```yaml
name: google_workspace
type: remote_mcp
transport: http
servers:
  gmail: https://gmailmcp.googleapis.com/mcp/v1
  drive: https://drivemcp.googleapis.com/mcp/v1
  calendar: https://calendarmcp.googleapis.com/mcp/v1
  people: https://people.googleapis.com/mcp/v1
  chat: https://chatmcp.googleapis.com/mcp/v1
auth:
  type: oauth2
risk_policy:
  read: allow_after_auth
  draft_write: allow_with_review
  destructive_write: require_confirmation
fallback:
  browser: true
notes:
  Treat untrusted email/docs as indirect prompt-injection surface.
```

Source URLs:

- https://developers.google.com/workspace/guides/configure-mcp-servers
- https://developers.google.com/workspace/gmail/api/guides
- https://developers.google.com/workspace/calendar/api/guides/overview
- https://developers.google.com/workspace/drive/api/guides/about-sdk
- https://developers.google.com/workspace/sheets/api/guides/concepts

### X / Twitter

X is the most useful architecture reference for OpenAPI-to-MCP.

Official evidence found:

- X API gives programmatic access to public conversation: read posts, publish content, manage users, analyze trends.
- It uses pay-per-usage pricing.
- X documents an official XMCP server.
- XMCP loads the X API OpenAPI spec at startup and converts operations into MCP tools.
- X docs mention 200+ generated tools, OAuth 1.0a browser consent, and `X_API_TOOL_ALLOWLIST` for limiting available operations.
- X also exposes a docs MCP server for searching/reading documentation.
- X publishes a machine-readable OpenAPI spec URL.

Why this matters for Feather:

This is almost a reference implementation for Roi's idea: docs/spec -> native capability -> allowlisted tools.

Suggested research task:

- Study XMCP's repo and design.
- Extract the pattern:
  1. Load OpenAPI spec.
  2. Generate tool schemas.
  3. Add auth flow.
  4. Add allowlist.
  5. Expose via MCP.
  6. Use docs MCP for documentation lookup.

This should inform Feather's `OpenAPI capability import` spike.

Risk:

- Social write actions are sensitive.
- Pricing/costs need tracking.
- API policy can change.
- Writes should require explicit confirmation.

Source URLs:

- https://docs.x.com/x-api/introduction
- https://docs.x.com/tools/mcp
- https://api.x.com/2/openapi.json

### LinkedIn

LinkedIn is viable only as a narrow connector, not broad automation.

Official evidence found:

- LinkedIn API docs are organized by business lines: Consumer, Compliance, Learning, Marketing, Sales, Talent.
- Most permissions and partner programs require explicit approval.
- Open permissions are the only permissions available to all developers without special approval.
- Open permissions include:
  - Sign in with LinkedIn using OpenID Connect: profile/email
  - Share on LinkedIn: `w_member_social`, used to post/comment/like on behalf of authenticated member
- Share on LinkedIn docs show `POST https://api.linkedin.com/v2/ugcPosts` and text/article/image/video shares.
- Share API has daily request limits.

Why this matters for Feather:

Do not make LinkedIn a broad native connector first.
Do make a narrow `linkedin_share` capability candidate:

- create draft post text locally
- ask user to approve
- publish via official API if `w_member_social` is configured
- otherwise open browser fallback to LinkedIn composer

Risk:

- Deeper access requires approval.
- Social posting is reputationally sensitive.
- Browser fallback may be safer for personal accounts.

Source URLs:

- https://learn.microsoft.com/en-us/linkedin/
- https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
- https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin

### Instagram / Meta

Quick pass result: not enough reliable official evidence captured because Meta docs were rate-limited during the pass.
Known direction to investigate:

- Instagram Graph API
- Instagram API with Instagram Login
- Threads API
- Meta Business integrations
- permissions/scopes for publishing, comments, insights, media
- business/creator account requirements
- review/approval requirements

Preliminary product take:

Instagram should not be MVP native connector unless the exact target workflow is narrow and official.
For many real user tasks, browser fallback will remain necessary.

Possible narrow candidates:

- read account/media insights for business/creator accounts
- comment moderation for managed accounts
- publish media if officially supported for the account type
- Threads posting/reading if official API and account access are practical

Do not rely on unofficial/private Instagram APIs in core.
If studied, classify as `risky_unofficial` only.

Research next:

- Confirm current Instagram API capabilities and account requirements from official Meta docs.
- Find whether any reputable MCP server exists, and whether it is official/community.
- Compare with browser-based use for personal accounts.

Potential source starting points:

- https://developers.facebook.com/docs/instagram-platform/
- https://developers.facebook.com/docs/threads/

### Israeli government / public data

The promising native side is not personal-service automation, but open/public data.

Evidence found:

- data.gov.il exposes a CKAN API endpoint: `/api/3/action/package_search`.
- A quick API call returned `success: true` and a dataset count of 1193.
- Example datasets include ministry payments, flight data, train trip data, etc.
- Many resources expose `resource_id`, `format`, `url`, update metadata, and whether datastore is active.

Why this matters for Feather:

This is a good Israeli low-risk native connector.
It is not a replacement for personal portals like Bituach Leumi, but it can support research, public-service data lookup, forms/context preparation, and structured retrieval.

Candidate connector:

```yaml
name: israel_open_data
type: ckan_api
base_url: https://data.gov.il/api/3/action
actions:
  - package_search
  - package_show
  - datastore_search
risk:
  read: low
  write: unsupported
fallback:
  browser: true
```

Source URLs:

- https://data.gov.il/api/3/action/package_search?q=
- https://data.gov.il/dataset

### Bituach Leumi / Israeli personal portals

Quick pass did not find a clear public personal API for Bituach Leumi.
This does not prove none exists internally or for partners, but for Feather product planning it means:

- treat Bituach Leumi as browser-first
- use human handoff for login/MFA/submission
- use native public data only for general info if available
- do not assume API integration

Candidate browser recipe:

```yaml
name: bituach_leumi_browser
type: browser_recipe
domain: israel_government_personal_portal
auth:
  browser_session: required
risk_policy:
  read_personal_data: require_user_session
  submit_forms: require_confirmation
  payments_or_claims: require_confirmation_and_human_review
fallback:
  native_api: none_found_publicly
```

Research next:

- Check if government identity (`my.gov.il`) exposes developer APIs.
- Check if forms/services have machine-readable schemas.
- Check if any accessibility/automation-friendly flows exist.
- Identify exact high-value user tasks before designing any connector.

### Israeli banks / open banking

Preliminary finding:

- Open banking exists globally as a regulated API pattern.
- Israel likely has an open-banking regulatory ecosystem, but practical access probably requires licensed/approved third-party status.
- For personal consumer automation, this is high-risk and likely not MVP.

Product take:

Use browser mode for personal bank portals with very strict safety:

- no autonomous transfers/payments
- no credential handling beyond user-driven login
- read-only extraction only at first
- every sensitive action requires user confirmation
- consider screenshot/DOM evidence logs carefully because financial data is sensitive

Research next:

- Bank of Israel open banking docs
- Whether Leumi/Hapoalim/Discount/Mizrahi/One Zero expose developer portals
- Regulatory requirements for account information access
- Whether read-only financial aggregation can be done legally/practically

### Insurance portals

No specific official API evidence captured in this pass.
Treat as browser-first.

Research next:

- Pick 2-3 specific Israeli insurance portals.
- Search for partner APIs/developer portals.
- Identify common workflows: policy lookup, claim status, document download, form submission.
- Define browser recipes and human-handoff gates.

## Implementation evidence: API/docs -> tools

Several research/product signals support the feasibility of docs/spec-to-tools:

1. X XMCP already converts OpenAPI operations into MCP tools.
2. Academic work on AutoMCP reports generation of MCP servers from OpenAPI specs and high success after small spec fixes.
3. D2Spec-style work shows endpoint extraction from HTML docs is possible but imperfect.
4. Code2MCP-style work shows automated conversion from repos to MCP services is being explored.
5. Arcade-like platforms show that tool catalogs, auth providers, MCP gateways, evaluations, and third-party API calling are becoming product primitives.

Design implication:

Feather should not trust generated tools blindly.
Generated capabilities need:

- allowlists
- read/write risk labels
- auth metadata
- dry-run/read-only probe
- confirmation policy
- evaluation fixtures
- fallback-to-browser policy
- tool descriptions rewritten for agent use, not just raw CRUD

Source URLs:

- https://docs.x.com/tools/mcp
- https://arxiv.org/abs/2507.16044
- https://arxiv.org/abs/1801.08928
- https://arxiv.org/abs/2509.05941
- https://docs.arcade.dev/en/home

## Security findings to carry forward

MCP/native connectors are not automatically safer than browser automation.
They can be more stable and token-efficient, but they expand the blast radius.

Security notes from sources:

- Google explicitly warns about indirect prompt injection when MCP clients process untrusted emails/docs with powerful tools.
- MCP ecosystem research and news report real security issues: malicious servers, tool poisoning, over-permissioned servers, runtime faults, and prompt-injection chains.
- This supports Feather's need for deny-by-default capability policies.

Feather policy recommendation:

1. Native connectors must be deny-by-default.
2. Importing an MCP server should not automatically expose all tools.
3. Generated tools need allowlists.
4. Write/destructive/social/financial actions require confirmation.
5. Untrusted content from email/docs/web pages must be treated as adversarial input.
6. Tool outputs should carry source/evidence metadata.
7. Browser fallback is not just fallback for missing APIs; it can also be fallback for user-visible review.

## MVP recommendation

### MVP 0: Capability manifest only

No real external auth yet.
Implement the registry data model and routing decision logs.
Manual YAML/JSON manifests.
Browser mode remains default.

Deliverable:

- `integrations/*.capability.yaml`
- risk labels
- action labels
- fallback policy
- router trace: why native vs browser

### MVP 1: Google Workspace MCP import

Use Google Workspace as the first real native capability because it is official, high-value, and already MCP-shaped.

Start with read/draft operations:

- Gmail search/get thread/create draft
- Drive search/read file/list recent
- Calendar list events/suggest time/create event with confirmation
- People search contacts

Do not start with destructive operations.

### MVP 2: X OpenAPI/MCP pattern study

Do not necessarily ship X posting first.
Use X as the architecture reference for OpenAPI -> generated MCP tools + allowlist.

Deliverable:

- read X OpenAPI spec
- generate a local capability manifest
- allowlist 2-3 read-only operations
- optionally one write operation behind confirmation

### MVP 3: Israeli open data connector

Low-risk Israeli connector for `data.gov.il` CKAN API.
This validates that Feather can support local/non-SaaS public data without browser automation.

### MVP 4: Browser-first recipes for portals

Define browser recipes for:

- Bituach Leumi
- bank portal read-only extraction
- insurance document download

These should use Feather's observe/handoff strengths, not pretend APIs exist.

## Next research checklist (runs at 5.0.1 build time, not earlier)

Focused follow-up for whichever session builds this:

1. Google Workspace MCP server exact auth setup and whether it is available outside Google Antigravity/Claude.
2. Google Workspace MCP tool schemas and whether tool discovery can be automated by Feather.
3. X XMCP repo architecture: how OpenAPI -> MCP tool generation works.
4. LinkedIn Share API practical setup with a normal developer app.
5. Current Instagram Graph API / Threads API capabilities and approval requirements.
6. data.gov.il CKAN API endpoints and datastore query examples.
7. Israeli open banking official docs and whether a normal user/developer can access anything without TPP licensing.
8. MCP security models: allowlists, scopes, confirmation, prompt-injection isolation.
9. Existing products to study: Arcade, Composio, Pipedream, Zapier MCP, LangChain/LlamaIndex tool registries.
10. Whether Feather should store capability manifests in repo, user config, or project memory.

## Open product questions

- Is Feather the MCP host, or does it call an external MCP client?
- Does Feather expose browser primitives as MCP too?
- Should browser recipes and API tools share one `Capability` abstraction?
- How should OAuth secrets be stored locally?
- Should imported tools be project-scoped, user-scoped, or global?
- What is the minimum proof before a generated connector is trusted?
- How should Feather measure token/time savings from native routing?
- Can Graphify help with native capability blast-radius analysis, or should it remain code-only?

## Working thesis

Feather should not compete with Zapier/Make.
Feather should become the agent execution router that chooses between:

1. native structured capability,
2. MCP tool,
3. generated OpenAPI connector,
4. browser observe-act,
5. human handoff.

The first proof should be small and boring:

- Google Workspace MCP for real utility.
- X/OpenAPI as architecture reference.
- data.gov.il as low-risk Israeli API proof.
- Bituach Leumi/banks/insurance as browser-first recipes showing why Feather still matters.
