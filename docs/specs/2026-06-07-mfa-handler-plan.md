# MFA Handler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an agent hits a TOTP/SMS/push MFA wall, Feather pauses, notifies the user, the user resolves it via a local web page (types the code, or taps their phone then confirms), and Feather enters the code (code types only) and resumes the agent — without the agent ever seeing the raw code.

**Architecture:** A new single-responsibility `src/mfa/` module holds an in-memory challenge store (`MfaChallengeManager`), an HTML renderer for a dumb local page, and a pluggable notifier (console always; Telegram when configured). Two agent-facing routes create and poll challenges; two hardened local-page routes serve the page and accept the user's submission. Creating a challenge takes a refcounted **session hold** (`reason: "mfa"`) from the capability gate; resolving/expiring releases it. (Superseded the original "flips stealth mode" tie-in — see Build-Order Dependency + Security Tasks.)

**Tech Stack:** TypeScript, Fastify + Zod (HTTP), Playwright (typing the code into the page, via the existing type command), Vitest (tests). Node 20 global `fetch` for Telegram (no SDK).

**Spec:** `docs/specs/2026-06-07-mfa-handler-design.md`

---

## Build-Order Dependency (read first)

> **Updated 2026-06-07 (Session 4a.6b, security-first re-sequencing).** The original dependency
> below — MFA consuming Stealth's `setStealthMode` — is **superseded.** Under the new spine
> (`capability gate → Identity → MFA → warmed CDP → Stealth last`), MFA depends on the **session-hold
> primitive** from the capability gate (Session 5.0.0 / [[adr-0010-local-control-plane-capability-model]]),
> **not** on the Stealth Stack. This is exactly what lets Stealth move to last. Read the **Security
> Tasks** section below before implementing — it modifies Tasks 6, 8, 9, 10, and 11–14.

This feature **consumes** the **session-hold primitive** from the capability gate
(`docs/sessions/5.0.0-capability-gate.md`):

- A refcounted `session.createHold({ reason: "mfa" })` / release pair (exact signature fixed when
  5.0.0 is built). MFA *creates* a hold on challenge-create and *releases* it on resolve/expire; a
  policy layer observes holds. MFA **must not** call `setStealthMode` directly.

**If the capability gate (5.0.0) has not been built yet, build the session-hold primitive first.** Do
not re-implement it here. A failing typecheck on the hold API is the correct signal that this
dependency is unmet.

Everything else in this plan is self-contained.

> **Note on the tasks below:** Tasks 8–10 as written call `session.setStealthMode("assisted"|"secure")`.
> Treat those calls as **placeholders for the hold primitive** — replace them per the Security Tasks
> section. The rest of each task (challenge lifecycle, typing the code, expiry) is unchanged.

---

## Security Tasks (folded from the council review, 2026-06-07 — do these)

> Source: `research/2026-06-07-council-design-review.md` + the Security addendum in
> `docs/specs/2026-06-07-mfa-handler-design.md`. These **modify** the numbered tasks below; address
> them as part of the same TDD cycles, not as an afterthought. Most depend on Gate A
> ([[adr-0010-local-control-plane-capability-model]], Session 5.0.0).

- [ ] **S1 — Harden the no-auth local routes (modifies Tasks 11–14).** `GET /v1/mfa/:id` and
  `POST /v1/mfa/:id/submit` must not be reachable by a CSRF drive-by. Add: the global
  `Origin`/`Referer`/`Host` validation hook (from Gate A); a **single-use `humanToken`** carried in
  the local URL (the `challengeId` is an identifier, **not** the bearer secret); a **per-page CSRF
  nonce** posted back on submit; a **strict CSP with no external resources**. Tests: a request with a
  foreign `Origin` is rejected; a submit without the correct `humanToken`/nonce is rejected.
- [ ] **S2 — Make `challengeId` a 256-bit CSPRNG value, separate from `humanToken`.** Replace the
  `mfa_<uuid-slice>` id generation with CSPRNG; mint and store a distinct single-use `humanToken`.
- [ ] **S3 — Origin-verify before typing (anti-phishing; modifies Task 9).** Before Feather types a
  code into `target`, capture the page origin/URL at challenge-create and **verify it is unchanged**
  at resolve; surface the current origin/target (and a screenshot if available) to the human for
  confirmation. Pause the agent and suspend CDP/snapshot during the MFA flow. Test: a navigation away
  from the create-time origin blocks the type and fails the resolve with a clear error.
- [ ] **S4 — Replace `setStealthMode` with the session-hold primitive (modifies Tasks 6, 8, 9, 10).**
  On create: `session.createHold({ reason: "mfa" })`. On resolve/expire: release the hold. **Refcount**
  — a session returns to its base behavior only at zero pending MFA holds (fixes the concurrent-
  challenge race where one resolve flips a session while another is still pending). Update the Task
  8–10 tests to assert hold create/release instead of `setStealthMode` calls.
- [ ] **S5 — Lifecycle hygiene (modifies Tasks 8, 10, 12).** Clear timers on resolve/cancel/**session
  close**; **cancel pending challenges when the session closes** (no timer firing into a dead page);
  check expiry on read/write. Prefer the existing `mfa.challenge.*` SSE events over the poll endpoint
  (keep `GET …/:id` as a fallback only).
- [ ] **S6 — Reframe the security claim in docs (modifies API docs / Task 14).** "Agent never sees the
  code" defends the **reusable secret** (TOTP seed / single-use code stays out of agent/LLM/log space)
  and enforces the **human gate** — it does not make an untrusted agent safe on an authenticated
  account. Note that `secure`/`assisted` naming overpromises (`assisted` is arguably more dangerous).

---

## Interfaces & Contracts (locked before tasks)

These signatures are fixed here so every task below stays consistent. Later tasks reference them verbatim.

```typescript
// src/mfa/types.ts
import type { Target } from "../sessions/types";

export type MfaChallengeStatus = "pending" | "resolved" | "timed-out";
export type MfaType = "totp" | "sms" | "push";

export interface MfaChallenge {
  challengeId: string;
  sessionId: string;
  type: MfaType;
  target?: Target;       // REQUIRED for totp/sms, ABSENT for push
  prompt: string;
  status: MfaChallengeStatus;
  createdAt: string;     // ISO
  expiresAt: string;     // ISO
  resolvedAt?: string;   // ISO, set on resolve
}

export interface CreateChallengeInput {
  sessionId: string;
  type: MfaType;
  target?: Target;
  prompt: string;
  timeoutMs?: number;
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
  defaultTimeoutMs: number; // resolved (never undefined after loadMfaConfig)
}

// Error classes (codes map to HTTP status in routes.ts ERROR_STATUS)
export class MfaChallengeNotFoundError extends Error { readonly code = "MFA_NOT_FOUND"; }      // 404
export class MfaNotPendingError extends Error        { readonly code = "MFA_NOT_PENDING"; }     // 409
export class MfaValidationError extends Error        { readonly code = "VALIDATION_ERROR"; }    // 400 (reuses existing)

// Pure validators (throw MfaValidationError on violation)
export function requireTargetForType(type: MfaType, target?: Target): void;
export function requireCodeForType(type: MfaType, code?: string): void;
```

```typescript
// src/mfa/manager.ts
import type { CommandHandler, CommandContext } from "../commands/handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import type { ISessionManager } from "../sessions/manager";
import type { FeatherLogger } from "../logs/logger";
import type { MfaNotifier } from "./types";

export class MfaChallengeManager {
  constructor(
    sessions: ISessionManager,
    typeHandler: CommandHandler<TypeInput, TypeOutput>,
    notifier: MfaNotifier,
    logger: FeatherLogger,
    defaultTimeoutMs: number,
  );
  setBaseUrl(baseUrl: string): void;                       // called after server listen
  localUrlFor(challengeId: string): string;                // `${baseUrl}/v1/mfa/${challengeId}`
  createChallenge(input: CreateChallengeInput): Promise<MfaChallenge>;
  getChallenge(challengeId: string): MfaChallenge | undefined;
  resolveChallenge(challengeId: string, code: string | undefined, ctx: CommandContext): Promise<MfaChallenge>;
}
```

```typescript
// src/mfa/notifier.ts
export class ConsoleNotifier implements MfaNotifier { /* logs localUrl */ }
export class TelegramNotifier implements MfaNotifier { constructor(config: TelegramNotifierConfig); }
export class CompositeNotifier implements MfaNotifier { constructor(notifiers: MfaNotifier[]); }
export function buildNotifier(config: MfaConfig): MfaNotifier;

// src/mfa/config.ts
export function loadMfaConfig(env?: NodeJS.ProcessEnv): MfaConfig;

// src/mfa/local-page.ts
export function renderChallengePage(challenge: MfaChallenge): string;

// src/commands/mfa-challenge.ts
export class CreateMfaChallengeHandler { execute(input, ctx): Promise<{ challengeId: string; localUrl: string; expiresAt: string }>; }
export class GetMfaChallengeHandler    { execute(input, ctx): Promise<{ status: MfaChallengeStatus }>; }
```

**Route contract (added to `src/transport/routes.ts`):**
```
POST /v1/sessions/:sessionId/mfa/challenge   (auth)   body { type, target?, prompt, timeoutMs? } → { challengeId, localUrl, expiresAt }
GET  /v1/sessions/:sessionId/mfa/:challengeId (auth)                                              → { status }
GET  /v1/mfa/:challengeId                    (no auth, local)                                     → text/html
POST /v1/mfa/:challengeId/submit             (no auth, local)  body { code? }                     → { ok, message }
```
`localUrl = ${baseUrl}/v1/mfa/${challengeId}` (canonical — reconciles the spec's shorthand `…/mfa/<id>`).

**Test commands:**
- Unit: `npm test` (vitest, `vitest.config.ts`)
- Integration: `npm run test:integration` (real Chromium where needed)
- Types: `npm run typecheck`

---

## Task 1: MFA types, errors, and validators

**Files:**
- Create: `src/mfa/types.ts`
- Test: `tests/unit/mfa/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/types.test.ts
import { describe, it, expect } from "vitest";
import {
  MfaChallengeNotFoundError,
  MfaNotPendingError,
  MfaValidationError,
  requireTargetForType,
  requireCodeForType,
} from "../../../src/mfa/types";

describe("mfa error classes", () => {
  it("carry stable codes", () => {
    expect(new MfaChallengeNotFoundError("x").code).toBe("MFA_NOT_FOUND");
    expect(new MfaNotPendingError("x").code).toBe("MFA_NOT_PENDING");
    expect(new MfaValidationError("x").code).toBe("VALIDATION_ERROR");
  });
});

describe("requireTargetForType", () => {
  const target = { by: "css", selector: "#code" } as const;
  it("requires a target for totp and sms", () => {
    expect(() => requireTargetForType("totp", undefined)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("sms", undefined)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("totp", target)).not.toThrow();
  });
  it("forbids a target for push", () => {
    expect(() => requireTargetForType("push", target)).toThrow(MfaValidationError);
    expect(() => requireTargetForType("push", undefined)).not.toThrow();
  });
});

describe("requireCodeForType", () => {
  it("requires a non-empty code for totp and sms", () => {
    expect(() => requireCodeForType("totp", undefined)).toThrow(MfaValidationError);
    expect(() => requireCodeForType("sms", "")).toThrow(MfaValidationError);
    expect(() => requireCodeForType("totp", "123456")).not.toThrow();
  });
  it("ignores code for push", () => {
    expect(() => requireCodeForType("push", undefined)).not.toThrow();
    expect(() => requireCodeForType("push", "anything")).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/types.test.ts`
Expected: FAIL — cannot resolve `../../../src/mfa/types`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/mfa/types.ts
import type { Target } from "../sessions/types";

export type MfaChallengeStatus = "pending" | "resolved" | "timed-out";
export type MfaType = "totp" | "sms" | "push";

export interface MfaChallenge {
  challengeId: string;
  sessionId: string;
  type: MfaType;
  target?: Target;
  prompt: string;
  status: MfaChallengeStatus;
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;
}

export interface CreateChallengeInput {
  sessionId: string;
  type: MfaType;
  target?: Target;
  prompt: string;
  timeoutMs?: number;
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
  defaultTimeoutMs: number;
}

export class MfaChallengeNotFoundError extends Error {
  readonly code = "MFA_NOT_FOUND";
  constructor(message: string) { super(message); this.name = "MfaChallengeNotFoundError"; }
}

export class MfaNotPendingError extends Error {
  readonly code = "MFA_NOT_PENDING";
  constructor(message: string) { super(message); this.name = "MfaNotPendingError"; }
}

export class MfaValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) { super(message); this.name = "MfaValidationError"; }
}

const NEEDS_CODE = new Set<MfaType>(["totp", "sms"]);

export function requireTargetForType(type: MfaType, target?: Target): void {
  if (NEEDS_CODE.has(type) && !target) {
    throw new MfaValidationError(`MFA type "${type}" requires a target field to type the code into.`);
  }
  if (type === "push" && target) {
    throw new MfaValidationError(`MFA type "push" must not include a target (nothing is typed).`);
  }
}

export function requireCodeForType(type: MfaType, code?: string): void {
  if (NEEDS_CODE.has(type) && (code === undefined || code.length === 0)) {
    throw new MfaValidationError(`MFA type "${type}" requires a non-empty code.`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/types.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/mfa/types.ts tests/unit/mfa/types.test.ts
git commit -m "feat(mfa): challenge types, errors, and validators"
```

---

## Task 2: Local page renderer

**Files:**
- Create: `src/mfa/local-page.ts`
- Test: `tests/unit/mfa/local-page.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/local-page.test.ts
import { describe, it, expect } from "vitest";
import { renderChallengePage } from "../../../src/mfa/local-page";
import type { MfaChallenge } from "../../../src/mfa/types";

const base: MfaChallenge = {
  challengeId: "mfa_abc",
  sessionId: "ses_1",
  type: "totp",
  target: { by: "css", selector: "#code" },
  prompt: "LinkedIn 2FA",
  status: "pending",
  createdAt: "2026-06-07T00:00:00.000Z",
  expiresAt: "2026-06-07T00:05:00.000Z",
};

describe("renderChallengePage", () => {
  it("renders a code input and a form posting to the submit endpoint for totp", () => {
    const html = renderChallengePage(base);
    expect(html).toContain("LinkedIn 2FA");
    expect(html).toContain('action="/v1/mfa/mfa_abc/submit"');
    expect(html).toContain("<input");
    expect(html).toContain('name="code"');
  });

  it("renders a Done button and no code input for push", () => {
    const html = renderChallengePage({ ...base, type: "push", target: undefined });
    expect(html).toContain("Approve");          // instruction text
    expect(html).toContain('action="/v1/mfa/mfa_abc/submit"');
    expect(html).not.toContain('name="code"');  // nothing to type
  });

  it("HTML-escapes the prompt to prevent injection", () => {
    const html = renderChallengePage({ ...base, prompt: '<script>alert(1)</script>' });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/local-page.test.ts`
Expected: FAIL — cannot resolve `../../../src/mfa/local-page`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/mfa/local-page.ts
import type { MfaChallenge } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderChallengePage(challenge: MfaChallenge): string {
  const prompt = escapeHtml(challenge.prompt);
  const action = `/v1/mfa/${escapeHtml(challenge.challengeId)}/submit`;
  const expires = escapeHtml(challenge.expiresAt);

  const body =
    challenge.type === "push"
      ? `<p>Approve the request on your phone, then click Done.</p>
         <form method="POST" action="${action}">
           <button type="submit">Done</button>
         </form>`
      : `<form method="POST" action="${action}">
           <input name="code" inputmode="numeric" autocomplete="one-time-code"
                  autofocus placeholder="Enter code" />
           <button type="submit">Submit</button>
         </form>`;

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Feather MFA</title>
<style>body{font-family:system-ui,sans-serif;max-width:24rem;margin:4rem auto;padding:0 1rem}
input,button{font-size:1.1rem;padding:.5rem;margin-top:.5rem}</style></head>
<body>
  <h1>${prompt}</h1>
  ${body}
  <p style="color:#888;font-size:.85rem">Expires at ${expires}</p>
</body></html>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/local-page.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mfa/local-page.ts tests/unit/mfa/local-page.test.ts
git commit -m "feat(mfa): local challenge page renderer (code + push variants, HTML-escaped)"
```

---

## Task 3: Console + Composite notifier + factory

**Files:**
- Create: `src/mfa/notifier.ts`
- Test: `tests/unit/mfa/notifier.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/notifier.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConsoleNotifier, CompositeNotifier, buildNotifier } from "../../../src/mfa/notifier";
import type { MfaChallenge, MfaNotifier } from "../../../src/mfa/types";

const challenge: MfaChallenge = {
  challengeId: "mfa_abc", sessionId: "ses_1", type: "totp",
  target: { by: "css", selector: "#code" }, prompt: "LinkedIn 2FA",
  status: "pending", createdAt: "t", expiresAt: "t",
};
const URL = "http://localhost:3333/v1/mfa/mfa_abc";

describe("ConsoleNotifier", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("logs the local url", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await new ConsoleNotifier().notify(challenge, URL);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(URL));
  });
});

describe("CompositeNotifier", () => {
  it("calls every child notifier", async () => {
    const a: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const b: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    await new CompositeNotifier([a, b]).notify(challenge, URL);
    expect(a.notify).toHaveBeenCalledWith(challenge, URL);
    expect(b.notify).toHaveBeenCalledWith(challenge, URL);
  });
  it("does not let one failure block the others", async () => {
    const bad: MfaNotifier = { notify: vi.fn().mockRejectedValue(new Error("boom")) };
    const good: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    await new CompositeNotifier([bad, good]).notify(challenge, URL);
    expect(good.notify).toHaveBeenCalled();
  });
});

describe("buildNotifier", () => {
  it("returns console-only when no telegram config", () => {
    const n = buildNotifier({ defaultTimeoutMs: 300000 });
    expect(n).toBeInstanceOf(ConsoleNotifier);
  });
  it("returns a composite including telegram when configured", () => {
    const n = buildNotifier({ defaultTimeoutMs: 300000, telegram: { botToken: "t", chatId: "c" } });
    expect(n).toBeInstanceOf(CompositeNotifier);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/notifier.test.ts`
Expected: FAIL — cannot resolve `../../../src/mfa/notifier`.

- [ ] **Step 3: Write the implementation** (TelegramNotifier added in Task 4; here it is imported)

```typescript
// src/mfa/notifier.ts
import type { MfaChallenge, MfaConfig, MfaNotifier, TelegramNotifierConfig } from "./types";

export class ConsoleNotifier implements MfaNotifier {
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    console.log(`[mfa] ${challenge.type} challenge for "${challenge.prompt}" — resolve at: ${localUrl}`);
  }
}

export class CompositeNotifier implements MfaNotifier {
  constructor(private readonly notifiers: MfaNotifier[]) {}
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    await Promise.allSettled(this.notifiers.map((n) => n.notify(challenge, localUrl)));
  }
}

// Implemented in Task 4; declared here so buildNotifier compiles.
export class TelegramNotifier implements MfaNotifier {
  constructor(private readonly config: TelegramNotifierConfig) {}
  async notify(_challenge: MfaChallenge, _localUrl: string): Promise<void> {
    /* Task 4 */
  }
}

export function buildNotifier(config: MfaConfig): MfaNotifier {
  const notifiers: MfaNotifier[] = [new ConsoleNotifier()];
  if (config.telegram) {
    return new CompositeNotifier([...notifiers, new TelegramNotifier(config.telegram)]);
  }
  return notifiers[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/notifier.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mfa/notifier.ts tests/unit/mfa/notifier.test.ts
git commit -m "feat(mfa): console + composite notifiers and buildNotifier factory"
```

---

## Task 4: Telegram notifier (type-aware message)

**Files:**
- Modify: `src/mfa/notifier.ts` (replace the `TelegramNotifier.notify` stub)
- Test: `tests/unit/mfa/telegram-notifier.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/telegram-notifier.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { TelegramNotifier } from "../../../src/mfa/notifier";
import type { MfaChallenge } from "../../../src/mfa/types";

const code: MfaChallenge = {
  challengeId: "mfa_abc", sessionId: "ses_1", type: "totp",
  target: { by: "css", selector: "#code" }, prompt: "LinkedIn 2FA",
  status: "pending", createdAt: "t", expiresAt: "t",
};
const push: MfaChallenge = { ...code, type: "push", target: undefined, prompt: "Google sign-in" };
const URL = "http://localhost:3333/v1/mfa/mfa_abc";

describe("TelegramNotifier", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs to the Telegram sendMessage endpoint with chat id and the local url", async () => {
    await new TelegramNotifier({ botToken: "BOT", chatId: "42" }).notify(code, URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botBOT/sendMessage");
    const body = JSON.parse((init as any).body);
    expect(body.chat_id).toBe("42");
    expect(body.text).toContain(URL);
    expect(body.text).toContain("code");        // code-entry phrasing
  });

  it("uses approve phrasing for push challenges", async () => {
    await new TelegramNotifier({ botToken: "BOT", chatId: "42" }).notify(push, URL);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.text.toLowerCase()).toContain("approve");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/telegram-notifier.test.ts`
Expected: FAIL — stub sends no fetch; assertions fail.

- [ ] **Step 3: Replace the stub in `src/mfa/notifier.ts`**

```typescript
// in src/mfa/notifier.ts — replace the TelegramNotifier class body
export class TelegramNotifier implements MfaNotifier {
  constructor(private readonly config: TelegramNotifierConfig) {}
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    const text =
      challenge.type === "push"
        ? `Feather needs you to approve "${challenge.prompt}" on your phone, then confirm here: ${localUrl}`
        : `Feather needs a 2FA code for "${challenge.prompt}". Enter it here: ${localUrl}`;
    await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: this.config.chatId, text }),
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/telegram-notifier.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mfa/notifier.ts tests/unit/mfa/telegram-notifier.test.ts
git commit -m "feat(mfa): telegram notifier with type-aware message"
```

---

## Task 5: MFA config loader

**Files:**
- Create: `src/mfa/config.ts`
- Test: `tests/unit/mfa/config.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/config.test.ts
import { describe, it, expect } from "vitest";
import { loadMfaConfig } from "../../../src/mfa/config";

describe("loadMfaConfig", () => {
  it("defaults timeout to 5 minutes and omits telegram when unset", () => {
    const cfg = loadMfaConfig({});
    expect(cfg.defaultTimeoutMs).toBe(300000);
    expect(cfg.telegram).toBeUndefined();
  });

  it("includes telegram only when both token and chat id are present", () => {
    expect(loadMfaConfig({ FEATHER_TELEGRAM_BOT_TOKEN: "t" }).telegram).toBeUndefined();
    expect(loadMfaConfig({ FEATHER_TELEGRAM_CHAT_ID: "c" }).telegram).toBeUndefined();
    const cfg = loadMfaConfig({ FEATHER_TELEGRAM_BOT_TOKEN: "t", FEATHER_TELEGRAM_CHAT_ID: "c" });
    expect(cfg.telegram).toEqual({ botToken: "t", chatId: "c" });
  });

  it("honors FEATHER_MFA_TIMEOUT_MS override", () => {
    expect(loadMfaConfig({ FEATHER_MFA_TIMEOUT_MS: "60000" }).defaultTimeoutMs).toBe(60000);
  });

  it("ignores a non-numeric timeout override", () => {
    expect(loadMfaConfig({ FEATHER_MFA_TIMEOUT_MS: "abc" }).defaultTimeoutMs).toBe(300000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/config.test.ts`
Expected: FAIL — cannot resolve `../../../src/mfa/config`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/mfa/config.ts
import type { MfaConfig } from "./types";

const DEFAULT_TIMEOUT_MS = 300_000;

export function loadMfaConfig(env: NodeJS.ProcessEnv = process.env): MfaConfig {
  const botToken = env.FEATHER_TELEGRAM_BOT_TOKEN;
  const chatId = env.FEATHER_TELEGRAM_CHAT_ID;

  const parsed = Number(env.FEATHER_MFA_TIMEOUT_MS);
  const defaultTimeoutMs =
    Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;

  const config: MfaConfig = { defaultTimeoutMs };
  if (botToken && chatId) {
    config.telegram = { botToken, chatId };
  }
  return config;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/config.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mfa/config.ts tests/unit/mfa/config.test.ts
git commit -m "feat(mfa): env-driven config loader (telegram + timeout)"
```

---

## Task 6: Session `mfaPending` field

**Files:**
- Modify: `src/sessions/types.ts` (add `mfaPending` to `SessionRecord`; add `setMfaPending` to `ISession`)
- Modify: `src/sessions/session.ts` (`_mfaPending`, `setMfaPending`, include in `toRecord`)
- Test: `tests/unit/sessions/session-mfa-pending.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/sessions/session-mfa-pending.test.ts
import { describe, it, expect } from "vitest";
import { FeatherSession } from "../../../src/sessions/session";

function makeSession(): FeatherSession {
  return new FeatherSession({
    workspaceId: "default",
    profileKind: "disposable",
    browserMode: "chromium-headed-cdp",
    profilePath: "/tmp/p",
    debugDir: "/tmp/d",
    proxy: null,
  });
}

describe("FeatherSession mfaPending", () => {
  it("defaults to false in toRecord()", () => {
    expect(makeSession().toRecord().mfaPending).toBe(false);
  });
  it("reflects setMfaPending(true)", () => {
    const s = makeSession();
    s.setMfaPending(true);
    expect(s.toRecord().mfaPending).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sessions/session-mfa-pending.test.ts`
Expected: FAIL — `mfaPending` not on the record / `setMfaPending` not a function.

- [ ] **Step 3: Edit `src/sessions/types.ts`**

In `SessionRecord`, add the field after `proxy`:
```typescript
  proxy: ProxySummary | null;
  mfaPending: boolean;
```

In `ISession`, add the method (place it after `removePage`):
```typescript
  setMfaPending(pending: boolean): void;
```

- [ ] **Step 4: Edit `src/sessions/session.ts`**

Add the private field near the other privates (after `_debugCapture`):
```typescript
  private _mfaPending = false;
```

Add the setter (after `removePage`):
```typescript
  setMfaPending(pending: boolean): void {
    this._mfaPending = pending;
  }
```

In `toRecord()`, add the field next to `proxy`:
```typescript
      proxy: this.proxy,
      mfaPending: this._mfaPending,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/sessions/session-mfa-pending.test.ts`
Expected: PASS.

> Note: other tests asserting full `toRecord()` shape may need the new field. Run `npm test` and update any
> exact-shape assertion in `tests/unit/commands/status.test.ts` or `tests/unit/sessions/*` to include
> `mfaPending: false`.

- [ ] **Step 6: Run the full unit suite and fix shape assertions**

Run: `npm test`
Expected: PASS (after adding `mfaPending: false` to any exact-record assertions).

- [ ] **Step 7: Commit**

```bash
git add src/sessions/types.ts src/sessions/session.ts tests/unit/sessions/session-mfa-pending.test.ts
git commit -m "feat(sessions): mfaPending flag on session + record"
```

---

## Task 7: MFA events + SSE wiring

**Files:**
- Modify: `src/logs/events.ts` (add 3 events)
- Modify: `src/transport/sse.ts` (add 3 events to `LIFECYCLE_EVENTS`)
- Test: `tests/unit/mfa/events.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/events.test.ts
import { describe, it, expect } from "vitest";
import { EVENTS } from "../../../src/logs/events";

describe("mfa events", () => {
  it("exposes the three mfa lifecycle event names", () => {
    expect(EVENTS.MFA_CHALLENGE_CREATED).toBe("mfa.challenge.created");
    expect(EVENTS.MFA_CHALLENGE_RESOLVED).toBe("mfa.challenge.resolved");
    expect(EVENTS.MFA_CHALLENGE_EXPIRED).toBe("mfa.challenge.expired");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/events.test.ts`
Expected: FAIL — `EVENTS.MFA_CHALLENGE_CREATED` is undefined.

- [ ] **Step 3: Edit `src/logs/events.ts`**

Add inside the `EVENTS` object (after `TAB_CLOSED`):
```typescript
  MFA_CHALLENGE_CREATED: "mfa.challenge.created",
  MFA_CHALLENGE_RESOLVED: "mfa.challenge.resolved",
  MFA_CHALLENGE_EXPIRED: "mfa.challenge.expired",
```

- [ ] **Step 4: Edit `src/transport/sse.ts`**

Add to the `LIFECYCLE_EVENTS` set (after `"tab.closed",`):
```typescript
  "mfa.challenge.created",
  "mfa.challenge.resolved",
  "mfa.challenge.expired",
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/events.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/logs/events.ts src/transport/sse.ts tests/unit/mfa/events.test.ts
git commit -m "feat(mfa): add mfa.challenge.* events to the SSE lifecycle stream"
```

---

## Task 8: MfaChallengeManager — create + get + notify + stealth-on

**Files:**
- Create: `src/mfa/manager.ts`
- Test: `tests/unit/mfa/manager-create.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/manager-create.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MfaChallengeManager } from "../../../src/mfa/manager";
import { MfaValidationError } from "../../../src/mfa/types";

const ctx = { requestId: "req_test" };

function harness() {
  const session = { setStealthMode: vi.fn(), setMfaPending: vi.fn() };
  const sessions = { get: vi.fn().mockReturnValue(session) } as any;
  const typeHandler = { execute: vi.fn().mockResolvedValue({ pageId: "p", typed: true }) } as any;
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const logger = { log: vi.fn().mockResolvedValue(undefined) } as any;
  const mgr = new MfaChallengeManager(sessions, typeHandler, notifier, logger, 300000);
  mgr.setBaseUrl("http://localhost:3333");
  return { mgr, session, sessions, typeHandler, notifier, logger };
}

describe("MfaChallengeManager.createChallenge", () => {
  let h: ReturnType<typeof harness>;
  beforeEach(() => { h = harness(); });

  it("creates a pending challenge, marks mfaPending, switches to assisted, notifies", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp",
      target: { by: "css", selector: "#code" }, prompt: "LinkedIn 2FA",
    });
    expect(ch.status).toBe("pending");
    expect(ch.sessionId).toBe("ses_1");
    expect(h.session.setMfaPending).toHaveBeenCalledWith(true);
    expect(h.session.setStealthMode).toHaveBeenCalledWith("assisted");
    expect(h.notifier.notify).toHaveBeenCalledWith(ch, `http://localhost:3333/v1/mfa/${ch.challengeId}`);
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.created" }));
    expect(h.mgr.getChallenge(ch.challengeId)).toBe(ch);
  });

  it("rejects a totp challenge with no target", async () => {
    await expect(h.mgr.createChallenge({ sessionId: "ses_1", type: "totp", prompt: "x" }))
      .rejects.toBeInstanceOf(MfaValidationError);
  });

  it("rejects a push challenge that includes a target", async () => {
    await expect(h.mgr.createChallenge({
      sessionId: "ses_1", type: "push", target: { by: "css", selector: "#x" }, prompt: "x",
    })).rejects.toBeInstanceOf(MfaValidationError);
  });

  it("builds localUrlFor from the base url", () => {
    expect(h.mgr.localUrlFor("mfa_xyz")).toBe("http://localhost:3333/v1/mfa/mfa_xyz");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mfa/manager-create.test.ts`
Expected: FAIL — cannot resolve `../../../src/mfa/manager`.

- [ ] **Step 3: Write the implementation** (resolve + expiry land in Tasks 9–10; the file is created complete here so it compiles, but only create/get are exercised yet)

```typescript
// src/mfa/manager.ts
import { randomUUID } from "crypto";
import type { CommandHandler, CommandContext } from "../commands/handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import type { ISessionManager } from "../sessions/manager";
import type { FeatherLogger } from "../logs/logger";
import { EVENTS } from "../logs/events";
import {
  MfaChallenge,
  CreateChallengeInput,
  MfaChallengeNotFoundError,
  MfaNotPendingError,
  MfaNotifier,
  requireTargetForType,
  requireCodeForType,
} from "./types";

const newId = (): string => `mfa_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

export class MfaChallengeManager {
  private readonly challenges = new Map<string, MfaChallenge>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private baseUrl = "http://localhost:3333";

  constructor(
    private readonly sessions: ISessionManager,
    private readonly typeHandler: CommandHandler<TypeInput, TypeOutput>,
    private readonly notifier: MfaNotifier,
    private readonly logger: FeatherLogger,
    private readonly defaultTimeoutMs: number,
  ) {}

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  localUrlFor(challengeId: string): string {
    return `${this.baseUrl}/v1/mfa/${challengeId}`;
  }

  getChallenge(challengeId: string): MfaChallenge | undefined {
    return this.challenges.get(challengeId);
  }

  async createChallenge(input: CreateChallengeInput): Promise<MfaChallenge> {
    requireTargetForType(input.type, input.target);

    const session = this.sessions.get(input.sessionId); // throws SESSION_NOT_FOUND if missing
    const now = Date.now();
    const timeoutMs = input.timeoutMs ?? this.defaultTimeoutMs;
    const challenge: MfaChallenge = {
      challengeId: newId(),
      sessionId: input.sessionId,
      type: input.type,
      target: input.target,
      prompt: input.prompt,
      status: "pending",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + timeoutMs).toISOString(),
    };
    this.challenges.set(challenge.challengeId, challenge);

    session.setMfaPending(true);
    session.setStealthMode("assisted");

    await this.logger.log({
      ts: challenge.createdAt, level: "info",
      event: EVENTS.MFA_CHALLENGE_CREATED, sessionId: challenge.sessionId,
      data: { challengeId: challenge.challengeId, type: challenge.type },
    });

    const timer = setTimeout(() => { void this.expire(challenge.challengeId); }, timeoutMs);
    this.timers.set(challenge.challengeId, timer);

    try {
      await this.notifier.notify(challenge, this.localUrlFor(challenge.challengeId));
    } catch {
      /* notification failure must not fail challenge creation */
    }

    return challenge;
  }

  async resolveChallenge(
    challengeId: string,
    code: string | undefined,
    ctx: CommandContext,
  ): Promise<MfaChallenge> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) throw new MfaChallengeNotFoundError(`MFA challenge '${challengeId}' not found.`);
    if (challenge.status !== "pending") {
      throw new MfaNotPendingError(`MFA challenge '${challengeId}' is '${challenge.status}', not pending.`);
    }
    requireCodeForType(challenge.type, code);

    this.clearTimer(challengeId);

    if (challenge.type !== "push" && challenge.target) {
      await this.typeHandler.execute(
        { sessionId: challenge.sessionId, target: challenge.target, text: code as string, mode: "sequential" },
        ctx,
      );
    }

    challenge.status = "resolved";
    challenge.resolvedAt = new Date().toISOString();
    this.afterTerminal(challenge, EVENTS.MFA_CHALLENGE_RESOLVED);
    return challenge;
  }

  private async expire(challengeId: string): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== "pending") return;
    this.clearTimer(challengeId);
    challenge.status = "timed-out";
    this.afterTerminal(challenge, EVENTS.MFA_CHALLENGE_EXPIRED);
  }

  private afterTerminal(challenge: MfaChallenge, event: typeof EVENTS[keyof typeof EVENTS]): void {
    try {
      const session = this.sessions.get(challenge.sessionId);
      session.setMfaPending(false);
      session.setStealthMode("secure");
    } catch {
      /* session may already be gone; mode reset is best-effort */
    }
    void this.logger.log({
      ts: new Date().toISOString(), level: "info",
      event, sessionId: challenge.sessionId,
      data: { challengeId: challenge.challengeId, type: challenge.type },
    });
  }

  private clearTimer(challengeId: string): void {
    const timer = this.timers.get(challengeId);
    if (timer) { clearTimeout(timer); this.timers.delete(challengeId); }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mfa/manager-create.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mfa/manager.ts tests/unit/mfa/manager-create.test.ts
git commit -m "feat(mfa): challenge manager — create, get, notify, assisted-mode switch"
```

---

## Task 9: MfaChallengeManager — resolve (types the code; push skips typing)

**Files:**
- Test: `tests/unit/mfa/manager-resolve.test.ts` (implementation already written in Task 8)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/manager-resolve.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MfaChallengeManager } from "../../../src/mfa/manager";
import { MfaChallengeNotFoundError, MfaNotPendingError, MfaValidationError } from "../../../src/mfa/types";

const ctx = { requestId: "req_test" };

function harness() {
  const session = { setStealthMode: vi.fn(), setMfaPending: vi.fn() };
  const sessions = { get: vi.fn().mockReturnValue(session) } as any;
  const typeHandler = { execute: vi.fn().mockResolvedValue({ pageId: "p", typed: true }) } as any;
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const logger = { log: vi.fn().mockResolvedValue(undefined) } as any;
  const mgr = new MfaChallengeManager(sessions, typeHandler, notifier, logger, 300000);
  mgr.setBaseUrl("http://localhost:3333");
  return { mgr, session, typeHandler, logger };
}

describe("MfaChallengeManager.resolveChallenge", () => {
  let h: ReturnType<typeof harness>;
  beforeEach(() => { h = harness(); });

  it("types the code into the target for totp, then resolves and returns to secure", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    const resolved = await h.mgr.resolveChallenge(ch.challengeId, "123456", ctx);
    expect(h.typeHandler.execute).toHaveBeenCalledWith(
      { sessionId: "ses_1", target: { by: "css", selector: "#code" }, text: "123456", mode: "sequential" },
      ctx,
    );
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).toBeDefined();
    expect(h.session.setMfaPending).toHaveBeenLastCalledWith(false);
    expect(h.session.setStealthMode).toHaveBeenLastCalledWith("secure");
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.resolved" }));
  });

  it("does not type for push challenges", async () => {
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "Google" });
    const resolved = await h.mgr.resolveChallenge(ch.challengeId, undefined, ctx);
    expect(h.typeHandler.execute).not.toHaveBeenCalled();
    expect(resolved.status).toBe("resolved");
  });

  it("throws MFA_NOT_FOUND for an unknown id", async () => {
    await expect(h.mgr.resolveChallenge("nope", "1", ctx)).rejects.toBeInstanceOf(MfaChallengeNotFoundError);
  });

  it("throws VALIDATION_ERROR when a totp resolve has no code", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    await expect(h.mgr.resolveChallenge(ch.challengeId, undefined, ctx)).rejects.toBeInstanceOf(MfaValidationError);
  });

  it("throws MFA_NOT_PENDING when resolving twice", async () => {
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await h.mgr.resolveChallenge(ch.challengeId, undefined, ctx);
    await expect(h.mgr.resolveChallenge(ch.challengeId, undefined, ctx)).rejects.toBeInstanceOf(MfaNotPendingError);
  });
});
```

- [ ] **Step 2: Run test to verify it passes** (implementation exists from Task 8)

Run: `npm test -- tests/unit/mfa/manager-resolve.test.ts`
Expected: PASS. If any case fails, fix `resolveChallenge` in `src/mfa/manager.ts` until green.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/mfa/manager-resolve.test.ts
git commit -m "test(mfa): resolve flow — code typing, push skip, error paths"
```

---

## Task 10: MfaChallengeManager — expiry (fake timers)

**Files:**
- Test: `tests/unit/mfa/manager-expiry.test.ts` (implementation already written in Task 8)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/mfa/manager-expiry.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MfaChallengeManager } from "../../../src/mfa/manager";
import { MfaNotPendingError } from "../../../src/mfa/types";

const ctx = { requestId: "req_test" };

function harness() {
  const session = { setStealthMode: vi.fn(), setMfaPending: vi.fn() };
  const sessions = { get: vi.fn().mockReturnValue(session) } as any;
  const typeHandler = { execute: vi.fn().mockResolvedValue({ pageId: "p", typed: true }) } as any;
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const logger = { log: vi.fn().mockResolvedValue(undefined) } as any;
  const mgr = new MfaChallengeManager(sessions, typeHandler, notifier, logger, 1000);
  mgr.setBaseUrl("http://localhost:3333");
  return { mgr, session, logger };
}

describe("MfaChallengeManager expiry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("marks the challenge timed-out and returns the session to secure", async () => {
    const h = harness();
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await vi.advanceTimersByTimeAsync(1001);
    expect(h.mgr.getChallenge(ch.challengeId)!.status).toBe("timed-out");
    expect(h.session.setMfaPending).toHaveBeenLastCalledWith(false);
    expect(h.session.setStealthMode).toHaveBeenLastCalledWith("secure");
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.expired" }));
  });

  it("resolving after expiry throws MFA_NOT_PENDING", async () => {
    const h = harness();
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await vi.advanceTimersByTimeAsync(1001);
    await expect(h.mgr.resolveChallenge(ch.challengeId, undefined, ctx)).rejects.toBeInstanceOf(MfaNotPendingError);
  });

  it("a resolved challenge does not later expire", async () => {
    const h = harness();
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await h.mgr.resolveChallenge(ch.challengeId, undefined, ctx);
    await vi.advanceTimersByTimeAsync(2000);
    expect(h.mgr.getChallenge(ch.challengeId)!.status).toBe("resolved");
  });
});
```

- [ ] **Step 2: Run test to verify it passes** (implementation exists from Task 8)

Run: `npm test -- tests/unit/mfa/manager-expiry.test.ts`
Expected: PASS. If a case fails, fix `expire`/`clearTimer` in `src/mfa/manager.ts` until green.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/mfa/manager-expiry.test.ts
git commit -m "test(mfa): expiry — timeout, post-expiry resolve guard, resolved-no-expire"
```

---

## Task 11: Command handlers (create + get)

**Files:**
- Create: `src/commands/mfa-challenge.ts`
- Test: `tests/unit/commands/mfa-challenge.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/commands/mfa-challenge.test.ts
import { vi, describe, it, expect } from "vitest";
import { CreateMfaChallengeHandler, GetMfaChallengeHandler } from "../../../src/commands/mfa-challenge";
import { MfaChallengeNotFoundError } from "../../../src/mfa/types";

const ctx = { requestId: "req_test" };

describe("CreateMfaChallengeHandler", () => {
  it("delegates to the manager and returns challengeId, localUrl, expiresAt", async () => {
    const challenge = {
      challengeId: "mfa_abc", sessionId: "ses_1", type: "totp",
      prompt: "x", status: "pending", createdAt: "t", expiresAt: "t2",
    };
    const mgr = {
      createChallenge: vi.fn().mockResolvedValue(challenge),
      localUrlFor: vi.fn().mockReturnValue("http://localhost:3333/v1/mfa/mfa_abc"),
    } as any;
    const out = await new CreateMfaChallengeHandler(mgr).execute(
      { sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#c" }, prompt: "x" }, ctx);
    expect(mgr.createChallenge).toHaveBeenCalled();
    expect(out).toEqual({ challengeId: "mfa_abc", localUrl: "http://localhost:3333/v1/mfa/mfa_abc", expiresAt: "t2" });
  });
});

describe("GetMfaChallengeHandler", () => {
  it("returns the challenge status", async () => {
    const mgr = { getChallenge: vi.fn().mockReturnValue({ status: "pending" }) } as any;
    const out = await new GetMfaChallengeHandler(mgr).execute({ sessionId: "ses_1", challengeId: "mfa_abc" }, ctx);
    expect(out).toEqual({ status: "pending" });
  });
  it("throws MFA_NOT_FOUND when missing", async () => {
    const mgr = { getChallenge: vi.fn().mockReturnValue(undefined) } as any;
    await expect(new GetMfaChallengeHandler(mgr).execute({ sessionId: "ses_1", challengeId: "nope" }, ctx))
      .rejects.toBeInstanceOf(MfaChallengeNotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/commands/mfa-challenge.test.ts`
Expected: FAIL — cannot resolve `../../../src/commands/mfa-challenge`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/commands/mfa-challenge.ts
import type { CommandContext } from "./handler";
import type { MfaChallengeManager } from "../mfa/manager";
import type { CreateChallengeInput, MfaChallengeStatus } from "../mfa/types";
import { MfaChallengeNotFoundError } from "../mfa/types";

export class CreateMfaChallengeHandler {
  constructor(private readonly mgr: MfaChallengeManager) {}
  async execute(
    input: CreateChallengeInput,
    _ctx: CommandContext,
  ): Promise<{ challengeId: string; localUrl: string; expiresAt: string }> {
    const challenge = await this.mgr.createChallenge(input);
    return {
      challengeId: challenge.challengeId,
      localUrl: this.mgr.localUrlFor(challenge.challengeId),
      expiresAt: challenge.expiresAt,
    };
  }
}

export class GetMfaChallengeHandler {
  constructor(private readonly mgr: MfaChallengeManager) {}
  async execute(
    input: { sessionId: string; challengeId: string },
    _ctx: CommandContext,
  ): Promise<{ status: MfaChallengeStatus }> {
    const challenge = this.mgr.getChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeNotFoundError(`MFA challenge '${input.challengeId}' not found.`);
    return { status: challenge.status };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/commands/mfa-challenge.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/mfa-challenge.ts tests/unit/commands/mfa-challenge.test.ts
git commit -m "feat(mfa): create + get challenge command handlers"
```

---

## Task 12: Routes, schemas, and error-status mapping

**Files:**
- Modify: `src/transport/routes.ts` (signature gains `mfaManager`; add schemas, 4 routes, error codes)
- Test: extended in Task 13's integration test (routes need the wired server)

- [ ] **Step 1: Add the new error codes to `ERROR_STATUS`**

In `src/transport/routes.ts`, add to the `ERROR_STATUS` map:
```typescript
  WAIT_TIMEOUT: 408,
  MFA_NOT_FOUND: 404,
  MFA_NOT_PENDING: 409,
```

- [ ] **Step 2: Add the Zod schemas** (place after `WaitSchema`)

```typescript
const MfaChallengeSchema = z.object({
  type: z.enum(["totp", "sms", "push"]),
  target: TargetSchema.optional(),
  prompt: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
}).superRefine((val, ctx) => {
  const needsTarget = val.type === "totp" || val.type === "sms";
  if (needsTarget && !val.target) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `type "${val.type}" requires a target`, path: ["target"] });
  }
  if (val.type === "push" && val.target) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `type "push" must not include a target`, path: ["target"] });
  }
});

const MfaSubmitSchema = z.object({ code: z.string().optional() });
```

- [ ] **Step 3: Change `registerRoutes` to accept the MFA manager**

Update the import block and signature:
```typescript
import { CreateMfaChallengeHandler, GetMfaChallengeHandler } from "../commands/mfa-challenge";
import { renderChallengePage } from "../mfa/local-page";
import type { MfaChallengeManager } from "../mfa/manager";
```
```typescript
export function registerRoutes(
  app: FastifyInstance,
  manager: ISessionManager,
  paths: FeatherPaths,
  token: string,
  mfaManager: MfaChallengeManager,
): void {
```

Instantiate the handlers alongside the others:
```typescript
  const createMfaHandler = new CreateMfaChallengeHandler(mfaManager);
  const getMfaHandler = new GetMfaChallengeHandler(mfaManager);
```

- [ ] **Step 4: Add the four routes** (place the two agent routes near the other `/v1/sessions/:sessionId/*` routes, and the two local routes before `registerSseRoute(app, tokenAuth);`)

```typescript
  app.post("/v1/sessions/:sessionId/mfa/challenge", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = MfaChallengeSchema.parse(request.body);
      const result = await createMfaHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/sessions/:sessionId/mfa/:challengeId", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId, challengeId } = request.params as { sessionId: string; challengeId: string };
      const result = await getMfaHandler.execute({ sessionId, challengeId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  // Local page — no token auth (local-only; Fastify is bound to 127.0.0.1)
  app.get("/v1/mfa/:challengeId", async (request, reply) => {
    const { challengeId } = request.params as { challengeId: string };
    const challenge = mfaManager.getChallenge(challengeId);
    if (!challenge) { await reply.status(404).type("text/html").send("<h1>Challenge not found</h1>"); return; }
    await reply.status(200).type("text/html").send(renderChallengePage(challenge));
  });

  app.post("/v1/mfa/:challengeId/submit", async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { challengeId } = request.params as { challengeId: string };
      const { code } = MfaSubmitSchema.parse(request.body ?? {});
      await mfaManager.resolveChallenge(challengeId, code, { requestId });
      await reply.status(200).send({ ok: true, message: "Submitted. You can close this page." });
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

> Note: the `POST /submit` body is form-encoded when the page is submitted by a real browser `<form>`.
> Fastify parses `application/json` by default. Task 13 adds the form-body content-type parser so the
> HTML form works; the integration test posts JSON, which works regardless.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: FAIL only at the `registerRoutes(...)` call site in `src/transport/http.ts` (missing 5th arg) — fixed in Task 13. No other type errors.

- [ ] **Step 6: Commit**

```bash
git add src/transport/routes.ts
git commit -m "feat(mfa): challenge + local-page routes, schemas, error-status mapping"
```

---

## Task 13: Server wiring + form-body parsing

**Files:**
- Modify: `src/transport/http.ts` (build notifier + manager, pass to routes, set base url, add form parser)
- Modify: `src/index.ts` (no change required if http owns construction — verify)
- Test: `tests/integration/mfa.integration.test.ts`

- [ ] **Step 1: Wire the MFA manager in `src/transport/http.ts`**

Add imports:
```typescript
import { SessionManager as _SM } from "../sessions/manager"; // (type already imported)
import { TypeHandler } from "../commands/type";
import { FeatherLogger } from "../logs/logger";
import { MfaChallengeManager } from "../mfa/manager";
import { buildNotifier } from "../mfa/notifier";
import { loadMfaConfig } from "../mfa/config";
```

Inside `startHttpServer`, after `const app = Fastify({ logger: false });`:
```typescript
  // Parse url-encoded form posts (the MFA local page submits a native HTML form)
  app.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (_req, body, done) => {
      try {
        const params = new URLSearchParams(body as string);
        done(null, Object.fromEntries(params.entries()));
      } catch (err) { done(err as Error); }
    },
  );

  const mfaConfig = loadMfaConfig();
  const mfaManager = new MfaChallengeManager(
    manager,
    new TypeHandler(manager),
    buildNotifier(mfaConfig),
    new FeatherLogger(paths),
    mfaConfig.defaultTimeoutMs,
  );
```

Change the `registerRoutes` call to pass the manager:
```typescript
  registerRoutes(app, manager, paths, token, mfaManager);
```

After `const actualPort = address.port;`, set the base url:
```typescript
  mfaManager.setBaseUrl(`http://${host}:${actualPort}`);
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (the Task 12 call-site error is now resolved).

- [ ] **Step 3: Write the integration test** (push path — no real browser typing needed)

```typescript
// tests/integration/mfa.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startHttpServer } from "../../src/transport/http";
import { SessionManager } from "../../src/sessions/manager";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { FeatherPaths } from "../../src/fs-layout";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

// Helper: a fake session manager that returns a stub session, so we avoid launching Chromium.
class StubManager extends SessionManager {
  private stub = { setStealthMode: () => {}, setMfaPending: () => {} } as any;
  get(_sessionId: string): any { return this.stub; }
}

describe("MFA integration (push happy path)", () => {
  let server: Awaited<ReturnType<typeof startHttpServer>>;
  let baseUrl: string;
  let token: string;
  let dir: string;

  beforeAll(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-mfa-"));
    const paths = new FeatherPaths({ stateDir: dir, cacheDir: dir, runtimeDir: dir, configDir: dir } as any);
    const mgr = new StubManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
    server = await startHttpServer("127.0.0.1", 0, mgr, paths);
    baseUrl = `http://127.0.0.1:${server.port}`;
    token = server.token;
  });

  afterAll(async () => {
    await server.server.close();
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it("creates a push challenge, serves the page, resolves on submit", async () => {
    const created = await fetch(`${baseUrl}/v1/sessions/ses_1/mfa/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "push", prompt: "Google sign-in" }),
    }).then((r) => r.json());
    expect(created.ok).toBe(true);
    const { challengeId, localUrl } = created.data;
    expect(localUrl).toContain(`/v1/mfa/${challengeId}`);

    const page = await fetch(`${baseUrl}/v1/mfa/${challengeId}`).then((r) => r.text());
    expect(page).toContain("Approve");

    const status1 = await fetch(`${baseUrl}/v1/sessions/ses_1/mfa/${challengeId}`, {
      headers: { authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    expect(status1.data.status).toBe("pending");

    const submit = await fetch(`${baseUrl}/v1/mfa/${challengeId}/submit`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}),
    }).then((r) => r.json());
    expect(submit.ok).toBe(true);

    const status2 = await fetch(`${baseUrl}/v1/sessions/ses_1/mfa/${challengeId}`, {
      headers: { authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    expect(status2.data.status).toBe("resolved");
  });

  it("rejects a totp challenge with no target (validation)", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/ses_1/mfa/challenge`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "totp", prompt: "x" }),
    });
    expect(res.status).toBe(400);
  });
});
```

> If `FeatherPaths` constructor differs from the `{ stateDir, ... }` shape above, mirror the construction
> used in `tests/integration/transport.integration.test.ts` (read it and copy the exact setup). The point
> of the test is the MFA flow, not the path wiring.

- [ ] **Step 4: Run the integration test**

Run: `npm run test:integration -- tests/integration/mfa.integration.test.ts`
Expected: PASS — push challenge created, page served, status pending → resolved, validation rejects bad totp.

- [ ] **Step 5: Commit**

```bash
git add src/transport/http.ts tests/integration/mfa.integration.test.ts
git commit -m "feat(mfa): wire challenge manager into the server + form-body parser + integration test"
```

---

## Task 14: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: PASS (0 errors).

- [ ] **Step 2: Full unit suite**

Run: `npm test`
Expected: PASS. All new `tests/unit/mfa/*` and `tests/unit/commands/mfa-challenge.test.ts` green; no regressions (watch for any exact `toRecord()`-shape assertions needing `mfaPending: false`).

- [ ] **Step 3: Integration suite**

Run: `npm run test:integration`
Expected: PASS, including `tests/integration/mfa.integration.test.ts`.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "test(mfa): full suite green — unit + integration + typecheck"
```

---

## Candidate Work-Session Grouping (non-binding)

The roadmap re-sequencing pass assigns these to sessions; this is a suggested cut, not a commitment.

- **Session A — Pure units (no server):** Tasks 1–5 (types, local page, notifiers, config). Fully isolated, no session/stealth dependency. Can be built before the Stealth Stack lands.
- **Session B — Session + events + manager:** Tasks 6–10 (mfaPending, events/SSE, challenge manager create/resolve/expire). **Requires the Stealth `setStealthMode` seam** (see Build-Order Dependency).
- **Session C — HTTP surface:** Tasks 11–14 (command handlers, routes, server wiring, verification).

---

## Composition With Features 1 and 3

| This plan CONSUMES | From |
|---|---|
| `ISession.setStealthMode(mode)` + `StealthMode` | **Stealth Stack** — the mutable-mode seam |
| `Target` type + `TypeHandler` (sequential typing) | **Core** (already shipped) |
| `FeatherLogger` (bus + JSONL) + SSE lifecycle set | **Core** (already shipped) |

| This plan EXPOSES | Consumed by |
|---|---|
| `MfaChallenge` / `MfaConfig` / `MfaChallengeManager` | **Identity Model** — a named identity can carry a default `MfaConfig` |
| `needs-confirmation` result-type pattern (pollable status, no thrown control-flow) | **Identity Model** — same pattern for vault credential requests |
| `mfa.challenge.*` SSE events + `SessionRecord.mfaPending` | Any future dashboard / orchestration layer |

---

## Self-Review

**Spec coverage:**
- Scope (TOTP/SMS/push) → Tasks 1 (types), 8–10 (manager handles all three), 12 (schema enum). ✓
- Code-entry flow (type into field) → Task 9 (typeHandler with sequential mode). ✓
- Push flow (no typing, Done button) → Task 2 (push page variant), Task 9 (push skips typing). ✓
- Local page (code input vs Done) → Task 2. ✓
- Notification (console always, Telegram when configured, type-aware) → Tasks 3, 4, 5. ✓
- Stealth integration (assisted on create, secure on resolve/expire) → Tasks 8, 9, 10. ✓
- `needs-confirmation` (pollable status, not exceptions) → Task 11 (GET status), Task 9/10 (status transitions). ✓
- Timeout (default 5 min, configurable) → Task 5 (config), Task 8 (timer), Task 10 (expiry). ✓
- Events on SSE → Task 7. ✓
- `mfaPending` on record → Task 6. ✓
- Routes (2 auth + 2 local) → Task 12. ✓
- Server wiring + base url → Task 13. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". Every code step shows full code. The two
"if X differs, mirror the existing test" notes (Tasks 6, 13) point to concrete existing files, not vague
hand-waving. ✓

**Type consistency:** `createChallenge(input: CreateChallengeInput)`, `resolveChallenge(id, code?, ctx)`,
`localUrlFor(id)`, `setStealthMode("assisted"|"secure")`, `setMfaPending(boolean)`, `MfaType` =
`"totp"|"sms"|"push"`, error codes `MFA_NOT_FOUND`/`MFA_NOT_PENDING`/`VALIDATION_ERROR` — used identically
in every task and in `ERROR_STATUS`. The `localUrl` is `${baseUrl}/v1/mfa/${id}` everywhere (reconciled
from the spec's shorthand). ✓
