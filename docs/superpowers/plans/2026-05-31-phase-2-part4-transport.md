# Feather Browser Phase 2 — Part 4: HTTP Transport

> Part of a multi-part plan. See also: Part 1 (Foundation), Part 2 (Session Layer), Part 3 (Commands), Part 5 (Integration & Measurement).
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Covers:** Task 10 (Fastify HTTP server, token auth middleware, route registration, updated src/index.ts)

---

## Task 10: HTTP Transport + Updated src/index.ts

**Files:**
- Create: `src/transport/middleware.ts` — token auth preHandler, requestId injection
- Create: `src/transport/routes.ts` — all route registration, Zod validation, command dispatch
- Create: `src/transport/http.ts` — Fastify server factory, token + endpoint file writing
- Modify: `src/index.ts` — complete startup: config, ensureDirs, create dependencies, start HTTP
- Create: `tests/integration/transport.integration.test.ts` — token auth + health check (no browser)

---

### Step 1: Write failing integration tests

Create `tests/integration/transport.integration.test.ts`. These tests start a real Fastify server but mock `SessionManager` — no browser is launched.

```typescript
// tests/integration/transport.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "crypto";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { startHttpServer } from "../../src/transport/http";
import type { SessionManager } from "../../src/sessions/manager";
import type { FastifyInstance } from "fastify";

// ── Minimal mock for SessionManager ──────────────────────────────────────────

const MOCK_SESSION = {
  sessionId: "ses_test_01",
  workspaceId: "default",
  profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const,
  state: "running" as const,
  profilePath: ".feather/profiles/default/profile",
  debugDir: ".feather/debug/ses_test_01",
  proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z",
  pages: [],
  profileLocked: true,
};

function makeMockManager(): SessionManager {
  return {
    launch: async () => {
      const session = {
        sessionId: MOCK_SESSION.sessionId,
        toRecord: () => MOCK_SESSION,
      };
      return session as any;
    },
    list: () => [{ sessionId: MOCK_SESSION.sessionId, toRecord: () => MOCK_SESSION } as any],
    get: (sessionId: string) => {
      if (sessionId === MOCK_SESSION.sessionId) {
        return { sessionId: MOCK_SESSION.sessionId, toRecord: () => MOCK_SESSION } as any;
      }
      const err = new Error(`Session not found: ${sessionId}`);
      (err as any).code = "SESSION_NOT_FOUND";
      throw err;
    },
    close: async () => {},
  } as unknown as SessionManager;
}

// ── Test lifecycle ────────────────────────────────────────────────────────────

let tmpDir: string;
let paths: FeatherPaths;
let serverInstance: FastifyInstance;
let baseUrl: string;
let testToken: string;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-transport-test-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);

  const manager = makeMockManager();
  const result = await startHttpServer("127.0.0.1", 0, manager, paths);
  serverInstance = result.server;
  baseUrl = `http://127.0.0.1:${result.port}`;
  testToken = result.token;
});

afterAll(async () => {
  await serverInstance.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200 with ok: true and no token required", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ok");
  });
});

describe("Token authentication", () => {
  it("POST /v1/sessions without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: { kind: "persistent" },
        workspaceId: "default",
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /v1/sessions with wrong token returns 401", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": "wrong-token-value",
      },
      body: JSON.stringify({
        profile: { kind: "persistent" },
        workspaceId: "default",
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("Authenticated routes", () => {
  it("GET /v1/sessions with correct token returns 200 with ok: true", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      headers: { "X-Feather-Token": testToken },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.sessions)).toBe(true);
  });

  it("POST /v1/sessions with valid body and correct token calls manager.launch and returns session", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": testToken,
      },
      body: JSON.stringify({
        workspaceId: "default",
        profile: { kind: "persistent" },
        browserMode: "chromium-new-headless",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(MOCK_SESSION.sessionId);
    expect(typeof body.requestId).toBe("string");
    expect(body.requestId.startsWith("req_")).toBe(true);
  });

  it("GET /v1/sessions/:sessionId with unknown sessionId returns 404", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/ses_does_not_exist`, {
      headers: { "X-Feather-Token": testToken },
    });
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("POST /v1/sessions/:sessionId/navigate with invalid body (missing url) returns 400", async () => {
    const res = await fetch(`${baseUrl}/v1/sessions/${MOCK_SESSION.sessionId}/navigate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": testToken,
      },
      body: JSON.stringify({ pageId: "page_01" }), // url is required but missing
    });
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
```

- [ ] **Step 1: Run to verify failure**

```bash
npx vitest run --config vitest.integration.config.ts --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../src/transport/http'`

---

### Step 2: Create src/transport/middleware.ts

```typescript
// src/transport/middleware.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";

/**
 * onRequest hook: injects a unique requestId onto the request object.
 * Runs before preHandler and route handler for every request.
 */
export function injectRequestId(request: FastifyRequest): void {
  (request as any).requestId = `req_${randomUUID().slice(0, 8)}`;
}

/**
 * Factory: returns a preHandler that validates X-Feather-Token.
 * Register this per-route (not globally), so GET /health can skip it.
 */
export function createTokenAuth(token: string) {
  return async function tokenAuth(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const provided = request.headers["x-feather-token"];
    if (provided !== token) {
      await reply.status(401).send({
        ok: false,
        requestId: (request as any).requestId ?? "unknown",
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or missing X-Feather-Token.",
        },
      });
    }
  };
}
```

- [ ] **Step 2: Typecheck middleware compiles**

```bash
npx tsc --noEmit 2>&1 | grep "middleware"
```

Expected: no errors referencing `middleware.ts`.

---

### Step 3: Create src/transport/routes.ts

This file contains all Zod schemas and registers every route on the Fastify instance. Each route applies `tokenAuth` as a `preHandler` array entry (except `GET /health`). Route handlers wrap command execution in try/catch and map known error codes to HTTP status codes.

```typescript
// src/transport/routes.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z, ZodError } from "zod";
import { createTokenAuth } from "./middleware";
import type { SessionManager } from "../sessions/manager";
import type { FeatherPaths } from "../fs-layout";
import { LaunchSessionHandler } from "../commands/launch";
import { GetSessionHandler, ListSessionsHandler } from "../commands/status";
import { NavigateHandler } from "../commands/navigate";
import { SnapshotHandler } from "../commands/snapshot";
import { ExtractHandler } from "../commands/extract";
import { ScreenshotHandler } from "../commands/screenshot";
import { DebugBundleHandler } from "../commands/debug-bundle";
import { CloseSessionHandler } from "../commands/close";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const LaunchSchema = z.object({
  workspaceId: z.string().optional(),
  profile: z.object({
    kind: z.enum(["persistent", "disposable"]),
  }),
  browserMode: z
    .enum(["chromium-new-headless", "chromium-headless-shell"])
    .optional(),
  viewport: z
    .object({ width: z.number(), height: z.number() })
    .optional(),
  proxy: z
    .object({
      server: z.string(),
      username: z.string().optional(),
      password: z.string().optional(),
      bypass: z.string().optional(),
    })
    .nullable()
    .optional(),
  debug: z
    .object({
      trace: z.boolean().optional(),
      screenshots: z.boolean().optional(),
    })
    .optional(),
});

const NavigateSchema = z.object({
  url: z.string().url({ message: "url must be a valid URL" }),
  pageId: z.string().optional(),
  waitUntil: z
    .enum(["load", "domcontentloaded", "networkidle", "commit"])
    .optional(),
  timeoutMs: z.number().int().positive().optional(),
});

const SnapshotSchema = z.object({
  pageId: z.string().optional(),
  limits: z
    .object({
      textChars: z.number().int().positive().optional(),
      links: z.number().int().positive().optional(),
    })
    .optional(),
});

const ExtractSchema = z.object({
  pageId: z.string().optional(),
  recipe: z.object({
    fields: z.record(
      z.object({
        selector: z.string(),
        type: z.enum(["text", "attribute"]),
        attribute: z.string().optional(),
      })
    ),
    limits: z
      .object({
        items: z.number().int().positive().optional(),
        textChars: z.number().int().positive().optional(),
      })
      .optional(),
  }),
});

const ScreenshotSchema = z.object({
  pageId: z.string().optional(),
  fullPage: z.boolean().optional(),
});

const DebugBundleSchema = z.object({}).optional();

const CloseSchema = z.object({
  force: z.boolean().optional(),
  quarantineDisposableProfile: z.boolean().optional(),
});

// ── Error → HTTP status mapping ───────────────────────────────────────────────

const ERROR_STATUS: Record<string, number> = {
  SESSION_NOT_FOUND: 404,
  PROFILE_LOCKED: 409,
  PAGE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
};

function errorStatus(code: string): number {
  return ERROR_STATUS[code] ?? 500;
}

// ── ApiResponse helpers ───────────────────────────────────────────────────────

function ok(requestId: string, data: unknown) {
  return { ok: true, requestId, data };
}

function fail(requestId: string, code: string, message: string, details?: unknown) {
  return {
    ok: false,
    requestId,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}

function getRequestId(request: FastifyRequest): string {
  return (request as any).requestId ?? "unknown";
}

// ── Route error handler ───────────────────────────────────────────────────────

async function handleRouteError(
  err: unknown,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = getRequestId(request);

  if (err instanceof ZodError) {
    await reply
      .status(400)
      .send(fail(requestId, "VALIDATION_ERROR", "Request body validation failed.", err.errors));
    return;
  }

  const code: string = (err as any)?.code ?? "INTERNAL_ERROR";
  const message: string = (err as any)?.message ?? "An unexpected error occurred.";
  const status = errorStatus(code);
  await reply.status(status).send(fail(requestId, code, message));
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerRoutes(
  app: FastifyInstance,
  manager: SessionManager,
  paths: FeatherPaths,
  token: string
): void {
  const tokenAuth = createTokenAuth(token);

  // Command handlers (instantiated once; they are stateless)
  const launchHandler = new LaunchSessionHandler(manager);
  const getSessionHandler = new GetSessionHandler(manager);
  const listSessionsHandler = new ListSessionsHandler(manager);
  const navigateHandler = new NavigateHandler(manager);
  const snapshotHandler = new SnapshotHandler(manager);
  const extractHandler = new ExtractHandler(manager);
  const screenshotHandler = new ScreenshotHandler(manager, paths);
  const debugBundleHandler = new DebugBundleHandler(manager, paths);
  const closeHandler = new CloseSessionHandler(manager);

  // ── GET /health ─────────────────────────────────────────────────────────────
  // No auth — intentionally skips tokenAuth preHandler.
  app.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    await reply.status(200).send({ ok: true, data: { status: "ok" } });
  });

  // ── POST /v1/sessions ───────────────────────────────────────────────────────
  app.post(
    "/v1/sessions",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const input = LaunchSchema.parse(request.body);
        const ctx = { requestId };
        const session = await launchHandler.execute(input, ctx);
        await reply.status(200).send(ok(requestId, session.toRecord()));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── GET /v1/sessions ────────────────────────────────────────────────────────
  app.get(
    "/v1/sessions",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const ctx = { requestId };
        const sessions = await listSessionsHandler.execute({}, ctx);
        await reply.status(200).send(ok(requestId, { sessions }));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── GET /v1/sessions/:sessionId ─────────────────────────────────────────────
  app.get(
    "/v1/sessions/:sessionId",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const ctx = { requestId };
        const record = await getSessionHandler.execute({ sessionId }, ctx);
        await reply.status(200).send(ok(requestId, record));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── POST /v1/sessions/:sessionId/navigate ───────────────────────────────────
  app.post(
    "/v1/sessions/:sessionId/navigate",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const input = NavigateSchema.parse(request.body);
        const ctx = { requestId };
        const result = await navigateHandler.execute({ sessionId, ...input }, ctx);
        await reply.status(200).send(ok(requestId, result));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── POST /v1/sessions/:sessionId/snapshot ───────────────────────────────────
  app.post(
    "/v1/sessions/:sessionId/snapshot",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const input = SnapshotSchema.parse(request.body);
        const ctx = { requestId };
        const result = await snapshotHandler.execute({ sessionId, ...input }, ctx);
        await reply.status(200).send(ok(requestId, result));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── POST /v1/sessions/:sessionId/extract ────────────────────────────────────
  app.post(
    "/v1/sessions/:sessionId/extract",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const input = ExtractSchema.parse(request.body);
        const ctx = { requestId };
        const result = await extractHandler.execute({ sessionId, ...input }, ctx);
        await reply.status(200).send(ok(requestId, result));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── POST /v1/sessions/:sessionId/screenshot ─────────────────────────────────
  app.post(
    "/v1/sessions/:sessionId/screenshot",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const input = ScreenshotSchema.parse(request.body);
        const ctx = { requestId };
        const result = await screenshotHandler.execute({ sessionId, ...input }, ctx);
        await reply.status(200).send(ok(requestId, result));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── POST /v1/sessions/:sessionId/debug-bundle ───────────────────────────────
  app.post(
    "/v1/sessions/:sessionId/debug-bundle",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        // Body is optional for debug-bundle — parse defensively
        DebugBundleSchema.parse(request.body ?? {});
        const ctx = { requestId };
        const result = await debugBundleHandler.execute({ sessionId }, ctx);
        await reply.status(200).send(ok(requestId, result));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );

  // ── DELETE /v1/sessions/:sessionId ──────────────────────────────────────────
  app.delete(
    "/v1/sessions/:sessionId",
    { preHandler: [tokenAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = getRequestId(request);
      try {
        const { sessionId } = request.params as { sessionId: string };
        const input = CloseSchema.parse(request.body ?? {});
        const ctx = { requestId };
        await closeHandler.execute({ sessionId, ...input }, ctx);
        await reply.status(200).send(ok(requestId, { sessionId, closed: true }));
      } catch (err) {
        await handleRouteError(err, request, reply);
      }
    }
  );
}
```

- [ ] **Step 3: Typecheck routes compiles**

```bash
npx tsc --noEmit 2>&1 | grep "routes"
```

Expected: no errors referencing `routes.ts`.

---

### Step 4: Create src/transport/http.ts

```typescript
// src/transport/http.ts
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import * as fs from "fs";
import { randomBytes } from "crypto";
import type { SessionManager } from "../sessions/manager";
import type { FeatherPaths } from "../fs-layout";
import { injectRequestId } from "./middleware";
import { registerRoutes } from "./routes";

export interface StartHttpServerResult {
  server: FastifyInstance;
  port: number;
  token: string;
}

/**
 * Generates a token, starts a Fastify server on host:port (0 = random free
 * port), registers all routes, and writes the endpoint file before resolving.
 */
export async function startHttpServer(
  host: string,
  port: number,
  manager: SessionManager,
  paths: FeatherPaths
): Promise<StartHttpServerResult> {
  // 1. Generate token and write to token file
  const token = randomBytes(32).toString("hex");
  await fs.promises.writeFile(paths.tokenFile(), token, { encoding: "utf8", mode: 0o600 });

  // 2. Create Fastify instance (internal logger disabled; caller uses FeatherLogger)
  const app = Fastify({ logger: false });

  // 3. Inject requestId on every incoming request (runs before preHandler)
  app.addHook("onRequest", async (request) => {
    injectRequestId(request);
  });

  // 4. Register all routes (health + authenticated v1 routes)
  registerRoutes(app, manager, paths, token);

  // 5. Listen — port 0 lets the OS pick a free port
  await app.listen({ host, port });

  // 6. Resolve actual port (important when port was 0)
  const address = app.server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fastify server address is not available after listen().");
  }
  const actualPort = address.port;

  // 7. Write endpoint file so callers can discover the running service
  const endpointData = {
    transport: "http",
    baseUrl: `http://${host}:${actualPort}`,
    tokenFile: paths.tokenFile(),
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(
    paths.endpointFile(),
    JSON.stringify(endpointData, null, 2),
    "utf8"
  );

  return { server: app, port: actualPort, token };
}
```

- [ ] **Step 4: Typecheck http.ts compiles**

```bash
npx tsc --noEmit 2>&1 | grep "http"
```

Expected: no errors referencing `transport/http.ts`.

---

### Step 5: Run integration tests — expect partial pass

At this point the transport wiring exists. Run the integration suite:

```bash
npx vitest run --config vitest.integration.config.ts --reporter=verbose 2>&1
```

The 7 transport tests should pass. Any failures from other integration test files (api-flow, profile-lock, disposable-cleanup, proxy-redaction) are expected and out of scope for this task — they require a real browser.

Expected output:
```
PASS  tests/integration/transport.integration.test.ts
  GET /health
    ✓ returns 200 with ok: true and no token required
  Token authentication
    ✓ POST /v1/sessions without token returns 401
    ✓ POST /v1/sessions with wrong token returns 401
  Authenticated routes
    ✓ GET /v1/sessions with correct token returns 200 with ok: true
    ✓ POST /v1/sessions with valid body and correct token calls manager.launch and returns session
    ✓ GET /v1/sessions/:sessionId with unknown sessionId returns 404
    ✓ POST /v1/sessions/:sessionId/navigate with invalid body (missing url) returns 400
```

---

### Step 6: Update src/index.ts

Replace the minimal skeleton from Task 1 with the complete entry point:

```typescript
// src/index.ts
import { loadConfig } from "./config";
import { FeatherPaths, ensureDirs } from "./fs-layout";
import { ProfileLock } from "./profiles/lock";
import { WorkspaceMetadata } from "./profiles/workspace";
import { SessionManager } from "./sessions/manager";
import { FeatherLogger } from "./logs/logger";
import { EVENTS } from "./logs/events";
import { startHttpServer } from "./transport/http";

async function main(): Promise<void> {
  // 1. Load config from environment
  const config = loadConfig();

  // 2. Resolve paths and create directory structure
  const paths = new FeatherPaths(config.featherDir);
  await ensureDirs(config.featherDir);

  // 3. Construct dependencies
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  const manager = new SessionManager(paths, lock, workspace);
  const logger = new FeatherLogger(paths);

  // 4. Start HTTP transport (generates token, writes endpoint file)
  const { port, token: _token } = await startHttpServer(
    config.host,
    config.port,
    manager,
    paths
  );

  // 5. Log service-started event and print startup line
  await logger.log({
    ts: new Date().toISOString(),
    level: "info",
    event: EVENTS.SERVICE_STARTED,
    data: { port, host: config.host },
  });
  console.log(`Feather Browser service running at http://${config.host}:${port}`);
  console.log(`Token file: ${paths.tokenFile()}`);
  console.log(`Endpoint:   ${paths.endpointFile()}`);

  // 6. Graceful shutdown handler
  async function shutdown(): Promise<void> {
    console.log("Feather Browser shutting down…");
    const sessions = manager.list();
    await Promise.allSettled(
      sessions.map((s) => manager.close(s.sessionId, { force: true }))
    );
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
```

- [ ] **Step 6: Full typecheck with updated index.ts**

```bash
npm run typecheck
```

Expected: no TypeScript errors across the whole project.

---

### Step 7: Run all unit tests to confirm no regressions

```bash
npm test -- --reporter=verbose
```

Expected: all unit tests pass (Tasks 1–9 coverage unaffected by transport addition).

---

### Step 8: Verify endpoint file is written on startup

Perform a quick smoke-check that `startHttpServer` actually writes the endpoint and token files:

```bash
node -e "
const { FeatherPaths, ensureDirs } = require('./dist/fs-layout');
const { startHttpServer } = require('./dist/transport/http');
const { SessionManager } = require('./dist/sessions/manager');
const { ProfileLock } = require('./dist/profiles/lock');
const { WorkspaceMetadata } = require('./dist/profiles/workspace');
const path = require('path');
const os = require('os');
const fs = require('fs');

(async () => {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'feather-smoke-'));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  const manager = new SessionManager(paths, lock, workspace);

  const { server, port } = await startHttpServer('127.0.0.1', 0, manager, paths);

  const endpoint = JSON.parse(fs.readFileSync(paths.endpointFile(), 'utf8'));
  const token = fs.readFileSync(paths.tokenFile(), 'utf8').trim();

  console.log('port:', port);
  console.log('endpoint transport:', endpoint.transport);
  console.log('endpoint baseUrl:', endpoint.baseUrl);
  console.log('token length:', token.length);

  await server.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
  console.log('OK');
})().catch(e => { console.error(e); process.exit(1); });
"
```

Expected output:
```
port: <some number above 1024>
endpoint transport: http
endpoint baseUrl: http://127.0.0.1:<same number>
token length: 64
OK
```

Note: run `npm run build` before this step if `dist/` is not current.

---

### Step 9: Commit

```bash
git add src/transport/middleware.ts src/transport/routes.ts src/transport/http.ts src/index.ts tests/integration/transport.integration.test.ts
git commit -m "feat: add Fastify HTTP transport with token auth middleware and all v1 routes"
```

---

## Notes for the implementing engineer

**Token auth pattern:** `tokenAuth` is registered as a per-route `preHandler` array entry (`{ preHandler: [tokenAuth] }`), not as a global hook. This keeps `GET /health` unauthenticated without conditional logic inside a global hook.

**requestId pattern:** `injectRequestId` runs in `addHook("onRequest", ...)`, which fires before `preHandler`. This means even 401 responses from `tokenAuth` carry the correct `requestId` from the request object.

**Port 0:** Passing `port: 0` to Fastify's `listen()` lets the OS assign a free port. The actual port is read back from `app.server.address().port` and written into the endpoint file. The default `FEATHER_PORT=0` in `config.ts` exploits this.

**Token file permissions:** The token file is written with mode `0o600` (owner read/write only) to minimize credential exposure on shared machines.

**Error code contract:** Command handlers (Parts 2–3) must throw errors with a `.code` string property matching the values in `ERROR_STATUS` (`SESSION_NOT_FOUND`, `PROFILE_LOCKED`, `PAGE_NOT_FOUND`). Any unrecognized code maps to HTTP 500.

**Zod body parsing:** Fastify does not validate request bodies by default. All body validation happens explicitly via `Schema.parse(request.body)` inside each route handler. A `ZodError` thrown here is caught by `handleRouteError` and mapped to a 400 `VALIDATION_ERROR` response.

**Integration test isolation:** The integration test creates a real `tmpDir`, starts a real Fastify server on port 0, and tears everything down in `afterAll`. No `SessionManager` internals that require Playwright are exercised — the mock stands in for the manager entirely.
