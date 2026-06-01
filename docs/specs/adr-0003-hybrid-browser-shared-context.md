# ADR-0003: Hybrid Browser with Shared Persistent Context (Cookie Mine)

## Status

Accepted — 2026-06-01

## Context

The Phase 2 headless core was built around strict single-session-per-profile isolation.
`ProfileLock` enforces that only one `FeatherSession` can hold a given workspace profile at a
time, returning HTTP 409 if a second launch is attempted against a locked profile.

This model is correct for isolated headless automation (running multiple independent scrapers
with different profiles). However, the long-term vision for Feather is a **Hybrid Browser**: a
single running browser instance that serves both human daily browsing and background AI agent
automation simultaneously.

The "Cookie Mine" model requires:

1. A long-running primary browser context owned by the human user (Phase 4 UI).
2. AI agents that can open new pages (tabs) within that human context, piggybacking on its
   accumulated trust signals (cookies, session state, browsing history) rather than launching
   isolated cold-start contexts.
3. The Fastify HTTP server to act as a local coordination hub — an MCP-compatible endpoint —
   routing agent tab requests into the live human session.

Under the current architecture a human browser session locks the profile, and any agent request
against the same profile fails with `PROFILE_LOCKED` (409). This is the gap that must be closed
in Phase 5+.

## Decision

Shift the session model from:

> One context = one session. Second launch attempt = 409 error.

To:

> One context = one primary session. Subsequent requests against a locked-but-running profile
> open new Pages (tabs) within the existing context rather than failing.

Specifically:

1. `ProfileLock` semantics remain unchanged for preventing two concurrent context launches.
   A running human session still holds the lock.
2. A new "tab open" pathway is introduced in `SessionManager` (Phase 5+): if a profile is
   already locked by a running session, callers can request a new page within that session
   instead of receiving a 409.
3. The Phase 4 Visual Shell is the primary consumer and owner of the persistent context.
4. Phase 5+ agent requests use the "tab open" pathway to access the human session's cookies
   and trust state.
5. Pure headless disposable sessions (no profile lock) continue to work exactly as before.

## Consequences

### Phase Dependency Change

Phase 4 (Visual Desktop Shell) is now a **prerequisite** for Phase 5+ agent automation in the
Cookie Mine model. The human session must be running before agents can piggyback on its context.

Previously Phase 4 was described as a polish layer added after the headless core was proven.
This ADR makes Phase 4 architecturally foundational: without the human session holding the
persistent profile, agents have no shared trust context to leverage.

### What Changes in Phase 5+

- `SessionManager`: new `openTab(sessionId)` method that returns a `PageInfo` from an existing
  running session rather than launching a new `BrowserContext`.
- Routes: new `POST /v1/sessions/:id/tabs` endpoint that calls `openTab`.
- Phase 4 UI: keeps the primary session alive as a background process that Phase 5+ agents
  reference by `sessionId`.

### What Does Not Change (Phases 3 and 4)

Phase 3 (current) and Phase 4 are unaffected by this ADR at the code level. The ADR records
intent and design direction only. No `ProfileLock`, `SessionManager`, or route code changes in
Phase 3 or Phase 4.

### Preserved Behaviors

- Disposable sessions (headless, no profile lock) work exactly as before.
- Token auth, request isolation, JSONL logging, and debug bundles are unchanged.
- Existing API contract (`POST /v1/sessions`, navigation, snapshot, etc.) is unchanged.

## Alternatives Considered

### A: Cookie Export / Import

Export cookies from the human session and inject them into new agent sessions.

**Rejected.** Cookie expiry, token binding, and JS session state cannot be reliably serialized
and injected without browser-detectable signals. A live shared tab is more realistic.

### B: Remove the Profile Lock Entirely

Allow multiple concurrent context launches against the same profile.

**Rejected.** Two concurrent Chromium contexts targeting the same user data directory cause
profile corruption. The lock must remain for context-level access.

### C: Dedicated Trust-Harvesting Headless Session

Run a dedicated headless session alongside human browsing, periodically syncing cookies.

**Rejected.** Too complex, sync latency, and two separate Chromium instances produce different
behavioral fingerprints — defeating the bot-detection benefit.
