# Native Capabilities Research Map

Status: raw inbox research map
Date: 2026-06-10
Source: web research pass + Roi direction
Related idea: `journal/raw/_inbox/2026-06-10-native-capabilities-router.md`

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

The strongest evidence supports starting with a Capability Registry + MCP/API importer rather than hard-coding many website-specific integrations.

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

## Next research checklist for Claude

Ask Claude to perform focused follow-up on:

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
