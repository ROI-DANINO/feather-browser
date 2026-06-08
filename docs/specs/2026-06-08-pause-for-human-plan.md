# Pause-for-Human Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give an agent driving Feather over HTTP a reusable "pause for a human" primitive that waits until the human clicks a Resume link (backbone), an optional success signal appears (accelerator), or a timeout passes.

**Architecture:** One blocking command (`await-human`) races three exits — an externally-signalled human-resume promise, an optional Playwright locator wait (`resumeOn`), and a timeout. A small in-memory `PauseRegistry` links a pending pause to a single-use resume token. Two unauthenticated, human-facing resume routes (GET serves a tiny local page, POST settles the pause) validate that single-use token instead of the API header (a browser click can't send the header). The pause is announced on the existing SSE bus so any agent/UI can show the Resume link.

**Tech Stack:** TypeScript, Fastify, Zod, Playwright, Vitest. All new code follows existing patterns in `src/commands/`, `src/transport/routes.ts`, `src/logs/`.

**Spec:** `docs/specs/2026-06-08-pause-for-human-design.md`

---

## File Structure

| File | New/Modify | Responsibility |
|---|---|---|
| `src/sessions/types.ts` | Modify | Add `AwaitHumanInput` / `AwaitHumanOutput` |
| `src/logs/events.ts` | Modify | Add `human.pause.requested` / `human.pause.resolved` |
| `src/transport/sse.ts` | Modify | Forward the two new events over SSE |
| `src/commands/pause-registry.ts` | New | Single-use token ↔ pending-pause map; create/peek/resume/discard |
| `src/commands/await-human.ts` | New | `AwaitHumanHandler` — the blocking race |
| `src/transport/resume-page.ts` | New | Pure HTML template functions (prompt / confirmed / expired) |
| `src/transport/routes.ts` | Modify | Wire `POST /await-human` (authed) + `GET`/`POST /resume` (token-in-query) |
| `tests/unit/commands/pause-registry.test.ts` | New | Registry unit tests |
| `tests/unit/commands/await-human.test.ts` | New | Handler unit tests (3 exits) |
| `tests/unit/transport/resume-page.test.ts` | New | Template escaping/content |
| `tests/integration/await-human.integration.test.ts` | New | Real session: timeout, signal, human-via-SSE |
| `docs/api-reference.md` | Modify | Document the three routes |

---

## Task 1: Types and events

**Files:**
- Modify: `src/sessions/types.ts` (after the `WaitOutput` block, ~line 90)
- Modify: `src/logs/events.ts:19-22` (inside the `EVENTS` object)
- Modify: `src/transport/sse.ts:7-18` (the `LIFECYCLE_EVENTS` set)

- [ ] **Step 1: Add the input/output types**

In `src/sessions/types.ts`, after the `WaitOutput` union (line 90), add:

```ts
export interface AwaitHumanInput {
  sessionId: string;
  pageId?: string;
  reason: string;
  resumeOn?: { target: Target; until: "visible" | "hidden" | "attached" | "detached" };
  timeoutMs?: number;
}
export interface AwaitHumanOutput {
  pageId: string;
  resumedBy: "human" | "signal" | "timeout";
  elapsedMs: number;
}
```

- [ ] **Step 2: Add the two event names**

In `src/logs/events.ts`, inside the `EVENTS` object (before the closing `} as const;`), add:

```ts
  HUMAN_PAUSE_REQUESTED: "human.pause.requested",
  HUMAN_PAUSE_RESOLVED: "human.pause.resolved",
```

- [ ] **Step 3: Forward the new events over SSE**

In `src/transport/sse.ts`, add the two names to the `LIFECYCLE_EVENTS` set (before the closing `]);`):

```ts
  "human.pause.requested",
  "human.pause.resolved",
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/types.ts src/logs/events.ts src/transport/sse.ts
git commit -m "feat(pause-for-human): add await-human types + pause events

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: PauseRegistry

**Files:**
- Create: `src/commands/pause-registry.ts`
- Test: `tests/unit/commands/pause-registry.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/commands/pause-registry.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createPause, peekPause, resumePause, discardPause, _resetForTests } from "../../../src/commands/pause-registry";

beforeEach(() => _resetForTests());

describe("PauseRegistry", () => {
  it("createPause returns a token, a session-scoped path, and a pending promise", () => {
    const p = createPause("ses_1", "Solve the CAPTCHA");
    expect(p.token).toMatch(/^[0-9a-f]{32}$/);
    expect(p.resumePath).toBe(`/v1/sessions/ses_1/resume?token=${p.token}`);
    expect(p.humanResumed).toBeInstanceOf(Promise);
  });

  it("peekPause returns reason + sessionId while pending, undefined after resume", () => {
    const p = createPause("ses_1", "Solve the CAPTCHA");
    expect(peekPause(p.token)).toEqual({ sessionId: "ses_1", reason: "Solve the CAPTCHA" });
    resumePause(p.token, "ses_1");
    expect(peekPause(p.token)).toBeUndefined();
  });

  it("resumePause resolves the pending promise and returns true (once)", async () => {
    const p = createPause("ses_1", "x");
    let resolved = false;
    void p.humanResumed.then(() => { resolved = true; });
    expect(resumePause(p.token, "ses_1")).toBe(true);
    await p.humanResumed;
    expect(resolved).toBe(true);
    expect(resumePause(p.token, "ses_1")).toBe(false); // already consumed
  });

  it("resumePause rejects a wrong sessionId and an unknown token", () => {
    const p = createPause("ses_1", "x");
    expect(resumePause(p.token, "ses_OTHER")).toBe(false);
    expect(resumePause("deadbeef", "ses_1")).toBe(false);
    expect(resumePause(p.token, "ses_1")).toBe(true); // still valid for the right session
  });

  it("discardPause removes a pending pause without resolving false-positively", () => {
    const p = createPause("ses_1", "x");
    discardPause(p.token);
    expect(peekPause(p.token)).toBeUndefined();
    expect(resumePause(p.token, "ses_1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/commands/pause-registry.test.ts`
Expected: FAIL — cannot find module `pause-registry`.

- [ ] **Step 3: Implement the registry**

Create `src/commands/pause-registry.ts`:

```ts
import { randomBytes } from "crypto";

interface PendingPause {
  sessionId: string;
  reason: string;
  resolve: () => void;
}

const pending = new Map<string, PendingPause>();

export interface CreatedPause {
  token: string;
  resumePath: string;
  humanResumed: Promise<void>;
}

export function createPause(sessionId: string, reason: string): CreatedPause {
  const token = randomBytes(16).toString("hex");
  let resolve!: () => void;
  const humanResumed = new Promise<void>((r) => { resolve = r; });
  pending.set(token, { sessionId, reason, resolve });
  return { token, resumePath: `/v1/sessions/${sessionId}/resume?token=${token}`, humanResumed };
}

export function peekPause(token: string): { sessionId: string; reason: string } | undefined {
  const p = pending.get(token);
  return p ? { sessionId: p.sessionId, reason: p.reason } : undefined;
}

/** Settle a pause. Returns false for unknown/used token or a session mismatch. Single-use. */
export function resumePause(token: string, sessionId: string): boolean {
  const p = pending.get(token);
  if (!p || p.sessionId !== sessionId) return false;
  pending.delete(token);
  p.resolve();
  return true;
}

/** Drop a pause that ended some other way (signal/timeout/session close). */
export function discardPause(token: string): void {
  pending.delete(token);
}

/** Test-only: clear all pending pauses. */
export function _resetForTests(): void {
  pending.clear();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/commands/pause-registry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/pause-registry.ts tests/unit/commands/pause-registry.test.ts
git commit -m "feat(pause-for-human): single-use pause registry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: AwaitHumanHandler

**Files:**
- Create: `src/commands/await-human.ts`
- Test: `tests/unit/commands/await-human.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/commands/await-human.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AwaitHumanHandler } from "../../../src/commands/await-human";
import { resolveLocator } from "../../../src/browser/locators";
import { resumePause, peekPause, _resetForTests } from "../../../src/commands/pause-registry";
import { onBusEvent } from "../../../src/logs/bus";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

beforeEach(() => {
  vi.clearAllMocks();
  _resetForTests();
  mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
  mockManager.get.mockReturnValue(mockSession);
  (resolveLocator as any).mockReturnValue({ waitFor: vi.fn(() => new Promise(() => {})) }); // never resolves by default
});

describe("AwaitHumanHandler", () => {
  it("resolves resumedBy:'human' when the pause is resumed, and emits the request event", async () => {
    let resumePath = "";
    const unsub = onBusEvent((e) => { if (e.event === "human.pause.requested") resumePath = (e.data as any).resumePath; });
    const run = new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "Solve the CAPTCHA", timeoutMs: 5000 }, ctx);
    // Let the handler register + emit, then resume via the captured token.
    await vi.waitFor(() => expect(resumePath).not.toBe(""));
    const token = resumePath.split("token=")[1];
    expect(peekPause(token)).toEqual({ sessionId: "ses_1", reason: "Solve the CAPTCHA" });
    expect(resumePause(token, "ses_1")).toBe(true);
    const result = await run;
    expect(result).toMatchObject({ pageId: "page_001", resumedBy: "human" });
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    unsub();
  });

  it("resolves resumedBy:'timeout' when nothing happens before the deadline", async () => {
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 20 }, ctx);
    expect(result.resumedBy).toBe("timeout");
  });

  it("resolves resumedBy:'signal' when the resumeOn locator state is reached", async () => {
    (resolveLocator as any).mockReturnValue({ waitFor: vi.fn().mockResolvedValue(undefined) });
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 5000,
        resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" } }, ctx);
    expect(result.resumedBy).toBe("signal");
    expect(resolveLocator).toHaveBeenCalledWith(mockPage, { by: "css", selector: "#done" });
  });

  it("a failing resumeOn locator does not reject the race (falls through to timeout)", async () => {
    (resolveLocator as any).mockReturnValue({ waitFor: vi.fn().mockRejectedValue(new Error("not found")) });
    const result = await new AwaitHumanHandler(mockManager as any).execute(
      { sessionId: "ses_1", reason: "x", timeoutMs: 30,
        resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" } }, ctx);
    expect(result.resumedBy).toBe("timeout");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/commands/await-human.test.ts`
Expected: FAIL — cannot find module `await-human`.

- [ ] **Step 3: Implement the handler**

Create `src/commands/await-human.ts`:

```ts
import type { CommandHandler, CommandContext } from "./handler";
import type { AwaitHumanInput, AwaitHumanOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { createPause, discardPause } from "./pause-registry";
import { emitBusEvent } from "../logs/bus";
import { EVENTS } from "../logs/events";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class AwaitHumanHandler implements CommandHandler<AwaitHumanInput, AwaitHumanOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: AwaitHumanInput, _ctx: CommandContext): Promise<AwaitHumanOutput> {
    const { pageId, page } = this.manager.get(input.sessionId).getPage(input.pageId);
    const timeoutMs = input.timeoutMs ?? 300000;
    const startedAt = Date.now();

    const pause = createPause(input.sessionId, input.reason);
    emitBusEvent({
      event: EVENTS.HUMAN_PAUSE_REQUESTED,
      sessionId: input.sessionId,
      data: { reason: input.reason, resumePath: pause.resumePath },
      ts: new Date().toISOString(),
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const racers: Promise<AwaitHumanOutput["resumedBy"]>[] = [
      pause.humanResumed.then(() => "human" as const),
      new Promise<"timeout">((resolve) => { timer = setTimeout(() => resolve("timeout"), timeoutMs); }),
    ];

    if (input.resumeOn) {
      const loc = resolveLocator(page, input.resumeOn.target);
      racers.push(
        loc.waitFor({ state: input.resumeOn.until, timeout: timeoutMs })
          .then(() => "signal" as const)
          // a failed/late signal must never reject the race — let timeout/human win instead
          .catch(() => new Promise<never>(() => {})),
      );
    }

    const resumedBy = await Promise.race(racers);

    if (timer) clearTimeout(timer);
    discardPause(pause.token);
    emitBusEvent({
      event: EVENTS.HUMAN_PAUSE_RESOLVED,
      sessionId: input.sessionId,
      data: { resumedBy },
      ts: new Date().toISOString(),
    });

    return { pageId, resumedBy, elapsedMs: Date.now() - startedAt };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/commands/await-human.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/await-human.ts tests/unit/commands/await-human.test.ts
git commit -m "feat(pause-for-human): await-human handler racing human/signal/timeout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Resume page templates

**Files:**
- Create: `src/transport/resume-page.ts`
- Test: `tests/unit/transport/resume-page.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/transport/resume-page.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { promptPage, confirmedPage, expiredPage } from "../../../src/transport/resume-page";

describe("resume-page templates", () => {
  it("promptPage shows the reason and a POST form with a Resume button", () => {
    const html = promptPage("Solve the CAPTCHA");
    expect(html).toContain("Solve the CAPTCHA");
    expect(html).toContain('method="POST"');
    expect(html).toMatch(/Resume/);
  });

  it("promptPage HTML-escapes the reason (no injection)", () => {
    const html = promptPage('<script>alert(1)</script>');
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("confirmedPage and expiredPage carry their distinct messages", () => {
    expect(confirmedPage()).toMatch(/Resumed/);
    expect(expiredPage()).toMatch(/already resumed|expired/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/transport/resume-page.test.ts`
Expected: FAIL — cannot find module `resume-page`.

- [ ] **Step 3: Implement the templates**

Create `src/transport/resume-page.ts`:

```ts
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function shell(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Feather — Resume</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center;color:#111">` +
    body + `</body></html>`;
}

/** The page the human opens from the Resume link: reason + a button that POSTs to resume. */
export function promptPage(reason: string): string {
  return shell(
    `<h1 style="font-size:1.4rem">Feather is paused</h1>` +
    `<p style="color:#444">${esc(reason)}</p>` +
    `<form method="POST" action="">` +
    `<button type="submit" style="font-size:1rem;padding:.7rem 1.6rem;border:0;border-radius:.5rem;` +
    `background:#1a73e8;color:#fff;cursor:pointer">Resume ▸</button></form>`,
  );
}

export function confirmedPage(): string {
  return shell(`<h1 style="font-size:1.4rem">✓ Resumed</h1><p style="color:#444">You can return to the agent.</p>`);
}

export function expiredPage(): string {
  return shell(`<h1 style="font-size:1.4rem">Already resumed or expired</h1>` +
    `<p style="color:#444">Nothing more to do here.</p>`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/transport/resume-page.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/transport/resume-page.ts tests/unit/transport/resume-page.test.ts
git commit -m "feat(pause-for-human): local resume page templates (escaped)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire the routes

**Files:**
- Modify: `src/transport/routes.ts` (imports ~1-20; schemas ~87-105; handler instantiation ~139-153; routes ~254-262)
- Test: `tests/integration/await-human.integration.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Create `tests/integration/await-human.integration.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;
let sessionId: string;

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const dataUrl = (html: string) => "data:text/html," + encodeURIComponent(html);

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-await-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  const started = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = started.token;
  baseUrl = `http://127.0.0.1:${started.port}`;
  const launched = await api("POST", "/v1/sessions", {
    workspaceId: "await-ws", profile: { kind: "disposable" }, browserMode: "chromium-new-headless",
  });
  sessionId = launched.body.data.sessionId;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("await-human (real Chromium)", () => {
  it("returns resumedBy:'timeout' when nothing happens", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/await-human`, {
      reason: "nobody home", timeoutMs: 300,
    });
    expect(status).toBe(200);
    expect(body.data.resumedBy).toBe("timeout");
  });

  it("returns resumedBy:'signal' when the resumeOn element appears", async () => {
    await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: dataUrl(`<body><script>setTimeout(()=>{const d=document.createElement('div');d.id='done';d.textContent='ok';document.body.appendChild(d);},300)</script></body>`),
    });
    const { body } = await api("POST", `/v1/sessions/${sessionId}/await-human`, {
      reason: "waiting for #done", timeoutMs: 5000,
      resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" },
    });
    expect(body.data.resumedBy).toBe("signal");
  });

  it("returns resumedBy:'human' when the resume link is POSTed (no API token)", async () => {
    // Capture the resume path from the SSE bus, then POST it like a browser click.
    const events = await fetch(`${baseUrl}/v1/events`, { headers: { "X-Feather-Token": token } });
    const reader = events.body!.getReader();
    const dec = new TextDecoder();

    const pausePromise = api("POST", `/v1/sessions/${sessionId}/await-human`, { reason: "tap resume", timeoutMs: 10000 });

    let resumePath = "";
    while (!resumePath) {
      const { value } = await reader.read();
      const chunk = dec.decode(value);
      const m = chunk.match(/"resumePath":"([^"]+)"/);
      if (m) resumePath = m[1];
    }
    await reader.cancel();

    const resumeRes = await fetch(`${baseUrl}${resumePath}`, { method: "POST" });
    expect(resumeRes.status).toBe(200);
    expect(await resumeRes.text()).toMatch(/Resumed/);

    const { body } = await pausePromise;
    expect(body.data.resumedBy).toBe("human");
  });

  it("serves the prompt page on GET resume without an API token", async () => {
    const events = await fetch(`${baseUrl}/v1/events`, { headers: { "X-Feather-Token": token } });
    const reader = events.body!.getReader();
    const dec = new TextDecoder();
    const pausePromise = api("POST", `/v1/sessions/${sessionId}/await-human`, { reason: "GET me", timeoutMs: 10000 });

    let resumePath = "";
    while (!resumePath) {
      const { value } = await reader.read();
      const m = dec.decode(value).match(/"resumePath":"([^"]+)"/);
      if (m) resumePath = m[1];
    }
    await reader.cancel();

    const getRes = await fetch(`${baseUrl}${resumePath}`); // no token header
    expect(getRes.status).toBe(200);
    expect(await getRes.text()).toContain("GET me");

    await fetch(`${baseUrl}${resumePath}`, { method: "POST" }); // settle so the test ends
    await pausePromise;
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/await-human.integration.test.ts`
Expected: FAIL — `await-human` route returns 404 (not yet wired).

- [ ] **Step 3: Add imports**

In `src/transport/routes.ts`, after the `WaitHandler` import (line 18) add:

```ts
import { AwaitHumanHandler } from "../commands/await-human";
import type { AwaitHumanInput } from "../sessions/types";
import { peekPause, resumePause } from "../commands/pause-registry";
import { promptPage, confirmedPage, expiredPage } from "./resume-page";
```

- [ ] **Step 4: Add the request schema**

In `src/transport/routes.ts`, after `WaitSchema` (line 102) add:

```ts
const AwaitHumanSchema = z.object({
  pageId: z.string().optional(),
  reason: z.string().min(1),
  resumeOn: z.object({
    target: TargetSchema,
    until: z.enum(["visible", "hidden", "attached", "detached"]),
  }).optional(),
  timeoutMs: z.number().int().positive().optional(),
});
```

- [ ] **Step 5: Instantiate the handler**

In `src/transport/routes.ts`, after `const waitHandler = new WaitHandler(manager);` (line 153) add:

```ts
  const awaitHumanHandler = new AwaitHumanHandler(manager);
```

- [ ] **Step 6: Register the three routes**

In `src/transport/routes.ts`, after the `wait` route block (ends line 262) add:

```ts
  app.post("/v1/sessions/:sessionId/await-human", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = AwaitHumanSchema.parse(request.body);
      const result = await awaitHumanHandler.execute({ sessionId, ...input } as AwaitHumanInput, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  // Human-facing resume routes: NO API token (a browser click can't send the header).
  // Security is the single-use, unguessable per-pause token in the query string (local-only).
  app.get("/v1/sessions/:sessionId/resume", async (request: FastifyRequest, reply: FastifyReply) => {
    const { token: resumeToken } = (request.query as { token?: string }) ?? {};
    const info = resumeToken ? peekPause(resumeToken) : undefined;
    await reply.status(200).type("text/html")
      .send(info ? promptPage(info.reason) : expiredPage());
  });

  app.post("/v1/sessions/:sessionId/resume", async (request: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { token: resumeToken } = (request.query as { token?: string }) ?? {};
    const settled = resumeToken ? resumePause(resumeToken, sessionId) : false;
    await reply.status(200).type("text/html")
      .send(settled ? confirmedPage() : expiredPage());
  });
```

- [ ] **Step 7: Run the integration tests to verify they pass**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/await-human.integration.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Run the full unit suite for no regressions**

Run: `npm test`
Expected: PASS (all existing + new unit tests).

- [ ] **Step 9: Commit**

```bash
git add src/transport/routes.ts tests/integration/await-human.integration.test.ts
git commit -m "feat(pause-for-human): wire await-human + human-facing resume routes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Document the API

**Files:**
- Modify: `docs/api-reference.md`

- [ ] **Step 1: Add the route documentation**

In `docs/api-reference.md`, in the same style as the existing `wait` entry, add a section documenting:

```markdown
### POST /v1/sessions/:sessionId/await-human

Pause until a human completes a step. Blocks until the human clicks the Resume link, an
optional `resumeOn` element reaches its state, or `timeoutMs` elapses. **Long-running** — set
your HTTP client timeout above `timeoutMs` (default 300000 ms / 5 min).

Body:
- `reason` (string, required) — human-facing instruction, shown on the Resume page and emitted on the event stream.
- `resumeOn` (optional) — `{ target, until }` (same `target` shapes as `wait`; `until` ∈ visible|hidden|attached|detached). When the element reaches this state the pause auto-resumes.
- `timeoutMs` (optional, default 300000).
- `pageId` (optional).

Returns `{ resumedBy: "human" | "signal" | "timeout", elapsedMs, pageId }`.

On pause, a `human.pause.requested` event carries `{ reason, resumePath }` on `GET /v1/events`;
on resolution, `human.pause.resolved` carries `{ resumedBy }`. Compose the absolute Resume URL by
prefixing `resumePath` with `baseUrl` from `endpoint.json`.

### GET /v1/sessions/:sessionId/resume?token=<one-time>

Human-facing. **No API token** — authorised by the single-use `token`. Serves a small local page
with the reason and a Resume button.

### POST /v1/sessions/:sessionId/resume?token=<one-time>

The Resume button's action. Validates and consumes the single-use token, ends the matching pause,
and renders a confirmation. Idempotent: a reused/expired token renders a friendly "already resumed"
page.
```

- [ ] **Step 2: Verify the doc renders sensibly**

Run: `grep -n "await-human" docs/api-reference.md`
Expected: the new section is present.

- [ ] **Step 3: Commit**

```bash
git add docs/api-reference.md
git commit -m "docs(pause-for-human): document await-human + resume routes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Run the whole suite**

Run: `npm test && npm run test:integration`
Expected: all green.

- [ ] **Sanity-check types**

Run: `npx tsc --noEmit`
Expected: no errors.

---

## Notes for the executor

- **No SDK/driver helper is needed.** The agent (including Claude driving over `curl`/`fetch`) just
  POSTs `await-human`; the call blocks; the agent surfaces the absolute Resume URL (from `endpoint.json`
  `baseUrl` + the `resumePath` event field) to the human; the human clicks; the POST returns.
- **This is the v1 throwaway path.** Do not add a capability gate, CSRF, or Origin/Host hardening —
  that is v2 (Gate A → MFA Handler), which extends this same shape.
- The resume routes intentionally return HTML, not the `{ ok, requestId, data }` envelope (human-facing).
