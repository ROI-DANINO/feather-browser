# MFA Handler Design
**Date:** 2026-06-07
**Status:** 📐 Spec — ready for implementation planning
**Phase:** Phase 5 input (Agent Browsing Stack — Feature 2 of 3)
**Brief:** `docs/specs/2026-06-07-agent-browsing-stack-brief.md`
**Depends on:** `docs/specs/2026-06-07-stealth-stack-design.md` (mutable `stealthMode`, `session.setStealthMode()`)

---

## Goal

When an agent hits a login wall or MFA challenge, Feather pauses the workflow, notifies the user,
and the user resolves it via a local web page — by typing the code (TOTP/SMS), or by tapping "Yes"
on their phone and confirming (push). Feather then resumes the agent — without the agent ever
seeing the raw code.

**Guiding constraints (from the master brief):** local-first always; lightweight; legal (agent acts
as the authorized user; no captcha bypass, no automated code sourcing from TOTP seeds); gradual
delivery.

---

## Scope: v1 MFA Types

V1 handles the three most common MFA challenges, which fall into two interaction shapes:

**Code-entry** — user reads a code and Feather types it into a field:
- **TOTP** (Google Authenticator / Authy style — 6-digit rotating code)
- **SMS OTP** (code texted to the user's phone)

Both share one flow: detect → pause → user provides code → Feather enters it. These cover the most
common walls on banking/insurance/government portals, LinkedIn, and Instagram — sites that usually
have no "Sign in with Google" and lean on typed codes.

**Approve-and-continue** — user taps "Yes" on their phone and the page advances on its own:
- **Push approval** (Google "tap Yes on your phone", Duo, Okta Verify)

This is the most common challenge on Google-connected accounts. Its flow is simpler than code-entry:
there is no code to type and no target field — Feather just holds the session open until the user
confirms, then resumes the agent.

**Out of scope for v1:**
- Email OTP — could be auto-sourced via Gmail MCP, but requires a separate spike
- Passkey / Face ID / WebAuthn — may work naturally with a warmed session; no action needed yet
- Hardware key (YubiKey) — out of scope entirely

### Why all three matter (usage context)

Most of the time Feather's warmed session (the Cookie Mine) carries the agent straight through —
no login wall appears at all. The MFA handler is the **backstop for when that is not enough**: an
expired session, a brand-new site, a sensitive action, or a new-device re-check. When that backstop
fires, the challenge is one of these three: a typed code (insurance/banks/LinkedIn) or a phone tap
(Google/Duo/Okta). V1 covers all three.

---

## The Flow

There is one shared spine. The only branch is at resolution: code-entry types a code into a field;
push has nothing to type — the user's tap on their phone advanced the page, and the local page just
needs a "Done" confirmation so Feather knows to release the agent.

**Code-entry (TOTP / SMS):**
```
1. Agent: navigates to a site, calls snapshot, sees an OTP input field on the page
2. Agent: POST /v1/sessions/:id/mfa/challenge
          { type: "totp" | "sms", target: <OTP field locator>, prompt: "LinkedIn 2FA", timeoutMs?: 300000 }
3. Feather: creates a challenge ticket (in memory), emits SSE event, shifts session to assisted mode
4. Feather: returns { challengeId, localUrl: "http://localhost:3333/mfa/<id>", expiresAt }
5. Feather: notifies user (console log always; Telegram message if configured)
6. User: opens localUrl in browser, types code, hits Submit
7. Feather: validates code → types it into the browser field using the stored target
8. Feather: marks challenge resolved, emits SSE event, shifts session back to secure mode
9. Agent: GET /v1/sessions/:id/mfa/:challengeId → { status: "resolved" } → continues workflow
```

**Push approval (Google / Duo / Okta):**
```
1. Agent: calls snapshot, sees a "check your phone" / "approve on your device" screen
2. Agent: POST /v1/sessions/:id/mfa/challenge
          { type: "push", prompt: "Google sign-in", timeoutMs?: 300000 }   // no target — nothing to type
3. Feather: creates a challenge ticket, emits SSE event, shifts session to assisted mode
4. Feather: returns { challengeId, localUrl, expiresAt }
5. Feather: notifies user (console log always; Telegram if configured)
6. User: taps "Yes" on their phone → the browser page advances on its own
7. User: clicks "Done" on the local page (single button — confirms the approval happened)
8. Feather: marks challenge resolved, emits SSE event, shifts session back to secure mode
9. Agent: GET /v1/sessions/:id/mfa/:challengeId → { status: "resolved" } → snapshots the now-advanced page, continues
```

> **Why the "Done" button for push:** the alternative is for Feather to auto-detect that the page
> changed after the tap — but that means DOM-change heuristics inside Feather, which this design
> deliberately avoids (the same reason we let the agent supply the target rather than have Feather
> guess it). A single confirm tap keeps the local page as the one coordination point for all three
> types and keeps Feather free of page-watching logic. Auto-detecting the page change to drop the
> confirm step is a clean future enhancement, not a v1 requirement.

If the user does not respond within `timeoutMs` (default 5 minutes):
- Challenge status becomes `timed-out`
- SSE emits `mfa.challenge.expired`
- Session mode returns to `secure`
- Agent discovers this on next poll and decides to retry or abort — Feather does not decide

---

## Architecture

### New module: `src/mfa/`

Single-responsibility module. Four files, clear boundaries.

#### `src/mfa/types.ts`

```typescript
import type { Target } from "../sessions/types";

export type MfaChallengeStatus = "pending" | "resolved" | "timed-out";
export type MfaType = "totp" | "sms" | "push";

export interface MfaChallenge {
  challengeId: string;
  sessionId: string;
  type: MfaType;
  target?: Target;      // same Target type used by type/click; REQUIRED for totp/sms, ABSENT for push
  prompt: string;
  status: MfaChallengeStatus;
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;
}

export interface MfaNotifier {
  notify(challenge: MfaChallenge, localUrl: string): Promise<void>;
}

export interface TelegramNotifierConfig {
  botToken: string;
  chatId: string;
}

export interface MfaConfig {
  telegram?: TelegramNotifierConfig;
  defaultTimeoutMs?: number; // default: 300_000 (5 minutes)
}
```

#### `src/mfa/manager.ts`

Holds all in-flight challenges in a `Map<challengeId, MfaChallenge>`. Responsibilities:
- `createChallenge(sessionId, type, target, prompt, timeoutMs)` → `MfaChallenge`
  (validates that `target` is present for `totp`/`sms` and absent/ignored for `push`)
- `resolveChallenge(challengeId, code?)` → for `totp`/`sms`: types the `code` into the browser via the
  stored target. For `push`: no typing (the `code` is ignored — the page already advanced). Both
  paths then mark status `resolved`, clear the timeout, emit the resolved event.
- `getChallenge(challengeId)` → `MfaChallenge | undefined`
- Internal: `setTimeout` fires expiry, marks `timed-out`, emits expired event

Challenge data is in-memory only. No disk persistence — challenges have a maximum 5-minute life.

The manager receives the `SessionManager` reference so it can look up the live session and call
`session.setStealthMode()` + execute the type action.

#### `src/mfa/local-page.ts`

Generates the HTML for the local challenge page. Inputs: challenge prompt + challengeId.
Output: a complete HTML string. No framework, no build step — a plain template function.

The page adapts to the challenge type:
- **`totp` / `sms`:** the prompt, a numeric text input, a Submit button
- **`push`:** the prompt, instructions ("Approve the request on your phone, then click Done"), a
  single Done button (no text input)
- Both: a short expiry timestamp (rendered statically; no JS timer required)

Both variants POST to the same submit endpoint; the push variant simply sends no `code`.

```typescript
export function renderChallengePage(challenge: MfaChallenge): string;
```

#### `src/mfa/notifier.ts`

```typescript
// ConsoleNotifier — always active; logs the localUrl to stdout
export class ConsoleNotifier implements MfaNotifier {
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void>;
}

// TelegramNotifier — instantiated only when config.telegram is present
export class TelegramNotifier implements MfaNotifier {
  constructor(config: TelegramNotifierConfig);
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void>;
  // Message is type-aware:
  //   totp/sms: "Feather needs a 2FA code for <prompt>. Enter it here: <localUrl>"
  //   push:     "Feather needs you to approve <prompt> on your phone, then confirm here: <localUrl>"
  // Uses the Telegram Bot API sendMessage endpoint (HTTP POST, no SDK needed)
}

// CompositeNotifier — runs all configured notifiers in parallel
export class CompositeNotifier implements MfaNotifier {
  constructor(notifiers: MfaNotifier[]);
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void>;
}
```

`buildNotifier(config: MfaConfig): MfaNotifier` — factory; always includes `ConsoleNotifier`,
adds `TelegramNotifier` if `config.telegram` is present.

### New command: `src/commands/mfa-challenge.ts`

Handler for `POST /v1/sessions/:id/mfa/challenge`. Validates input, delegates to `MfaChallengeManager.createChallenge()`, returns `{ challengeId, localUrl, expiresAt }`.

### Session changes (`src/sessions/types.ts` + `src/sessions/session.ts`)

`SessionRecord` gains:
```typescript
mfaPending: boolean;   // true while a challenge is open for this session
```

`ISession` already has `setStealthMode()` from the stealth spec. No additional interface changes.

### API changes (`src/transport/routes.ts`)

**Agent-facing (token-authenticated):**
```
POST /v1/sessions/:sessionId/mfa/challenge
  body: { type: "totp" | "sms" | "push", target?: Target, prompt: string, timeoutMs?: number }
        // target REQUIRED for totp/sms, omitted for push — validated by the schema
  → 200 { ok, data: { challengeId, localUrl, expiresAt } }

GET /v1/sessions/:sessionId/mfa/:challengeId
  → 200 { ok, data: { status: "pending" | "resolved" | "timed-out" } }
```

**User-facing local page (no auth token — local-only, Fastify bound to 127.0.0.1):**
```
GET /v1/mfa/:challengeId
  → 200 text/html — renders the challenge page (code input for totp/sms, Done button for push)

POST /v1/mfa/:challengeId/submit
  body: { code?: string }   // code REQUIRED for totp/sms, omitted for push
  → 200 { ok, message: "Submitted" }  |  400 { ok: false, message: "..." }
```

The challenge-create schema validates the `target`/`type` pairing: `target` must be present for
`totp`/`sms` and is rejected for `push`. The submit endpoint validates `code` presence the same way
against the stored challenge's type.

The local page routes intentionally skip token auth. Feather binds to 127.0.0.1 and these endpoints
are only reachable from the local machine.

### Event changes (`src/logs/events.ts`)

```typescript
MFA_CHALLENGE_CREATED:  "mfa.challenge.created",
MFA_CHALLENGE_RESOLVED: "mfa.challenge.resolved",
MFA_CHALLENGE_EXPIRED:  "mfa.challenge.expired",
```

SSE stream (`GET /v1/events`) adds these three events to `LIFECYCLE_EVENTS` so subscribers see
the MFA state changes in real time.

---

## Stealth Integration

When a challenge is created: `session.setStealthMode("assisted")` — human is about to provide
input. This is the `secure → assisted` handoff the stealth spec was designed to enable.

When a challenge resolves or expires: `session.setStealthMode("secure")` — control returns to
the agent.

For `totp`/`sms`, Feather typing the code into the browser field reuses the existing type-command
logic (sequential mode, `jitterDelayMs` applied per the session's current mode). At the moment of
typing, mode is `assisted` (the human provided the input — no behavioral synthesis needed, but
jitter won't hurt). For `push`, there is no typing step — the mode flip still happens so the
handoff is symmetric across all three types.

---

## The `needs-confirmation` Convention

This feature is the canonical implementation of the result-type pattern established in the stealth
spec. The agent's flow treats MFA detection as a first-class result, not an exception:

```typescript
// Agent pseudocode — not Feather code
const snap = await feather.snapshot(sessionId, pageId);
if (looksLikeMfaPage(snap)) {
  const { challengeId, localUrl } = await feather.mfaChallenge(sessionId, {
    type: "totp",
    target: { by: "placeholder", text: "Enter code" },
    prompt: "LinkedIn 2FA",
  });
  // poll until resolved
  await feather.waitForMfaResolved(sessionId, challengeId);
  // continue — Feather already typed the code
}
```

No exceptions thrown. No control-flow errors. A clear, pollable result state.

---

## Notification: Telegram Seam

V1 ships with `ConsoleNotifier` only — the local URL is printed to stdout. This is sufficient
for a developer at their machine.

Telegram is a first-class extension point, not an afterthought:
- The `MfaNotifier` interface is defined and stable
- `TelegramNotifier` is implemented but only instantiated when `config.telegram` is present
- Config comes from environment variables (`FEATHER_TELEGRAM_BOT_TOKEN`, `FEATHER_TELEGRAM_CHAT_ID`)
- The Telegram Bot API `sendMessage` call is a single HTTP POST — no SDK dependency needed
- The notification message includes the prompt and the `localUrl` link

When Telegram is not configured, the experience is: the agent call returns a `localUrl`, Feather
logs it to the terminal, you open it. That is the complete v1 path.

---

## Research the Implementing Agent Must Do First

- Read `docs/specs/2026-06-07-stealth-stack-design.md` — understand `StealthMode`, `setStealthMode()`, `Target` type, the type-command jitter pattern
- Read `src/sessions/types.ts` — `Target`, `ISession`, `SessionRecord`, `TypeInput`
- Read `src/commands/type.ts` — how the type command locates an element and types; MFA typing reuses this logic
- Read `src/transport/routes.ts` — existing route patterns, `ok()`/`fail()` helpers, Zod validation style
- Read `src/logs/events.ts` + `src/transport/sse.ts` — how to add new events to the SSE stream
- Read `src/logs/bus.ts` — how to emit events
- Look up Telegram Bot API `sendMessage` docs: https://core.telegram.org/bots/api#sendmessage
  (single POST endpoint; no library needed)
- Read `docs/specs/2026-06-07-agent-browsing-stack-brief.md` Feature 2 section — the human-in-the-loop design intent
- Check Anchor Browser research (`research/2026-06-06-anchor-browser-product-reference.md`) §5
  for the event-coordination mental model (reference only — implementation differs)

---

## Composition With Features 1 and 3

| This feature CONSUMES | From |
|---|---|
| `session.setStealthMode("assisted" / "secure")` | **Stealth Stack** — the mode-switch primitive |
| `Target` type, type-command locator logic | **Core** (already exists) |

| This feature EXPOSES | Consumed by |
|---|---|
| `MfaChallenge` / `MfaConfig` | **Identity Model** — a named identity can carry a default `MfaConfig` (e.g., which Telegram chat to notify) |
| The `needs-confirmation` result-type pattern | **Identity Model** — may use the same pattern for vault credential requests |
| `mfa.challenge.*` SSE events | Any future dashboard or orchestration layer |

---

## What This Is Not

- Not captcha bypass. A CAPTCHA is not an MFA challenge — walls get handed to the human, never auto-solved.
- Not automated TOTP code generation from a stored seed. The user provides the code — Feather never holds TOTP secrets (that is Vault territory, Feature 3+).
- Not automated push approval. For push, the *human* taps "Yes" on their phone — Feather never approves on the user's behalf; it only waits for the user's confirmation and then releases the agent.
- Not email OTP auto-reading. Email OTP via Gmail MCP is a separate spike.
- Not a phone number or SMS gateway. Feather does not send SMS — the carrier does. Feather only relays the code the user received.
- Not cloud infrastructure. The local page is `localhost`. Nothing leaves the machine except optionally a Telegram notification.
