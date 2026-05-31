# Feather Browser Phase 2 Headless Core Prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Feather-owned local control service that launches, controls, and closes isolated Playwright-managed Chromium sessions through a token-protected localhost HTTP JSON API, with structured JSONL logs, per-session debug bundles, and a resource measurement scenario comparing two browser modes.

**Architecture:** A Node/TypeScript process starts a Fastify HTTP server bound to `127.0.0.1`, writes an endpoint file and token file on startup, and routes API requests to transport-independent command handlers. Command handlers depend on a `SessionManager` (Playwright lifecycle), `ProfileLock` (workspace-level file locks), `FeatherLogger` (per-session JSONL), and `DebugBundle` (artifact collector). A separate scenario runner compares new headless Chromium against headless shell.

**Tech Stack:** Node.js 20+, TypeScript 5, `playwright` npm package (not `@playwright/test`), Fastify 4, Zod 3, pidusage, Vitest.

---

## File Structure

```
src/
  index.ts                 — entry point: config, dirs, HTTP server, SIGTERM handler
  config.ts                — FeatherConfig interface, loadConfig()
  fs-layout.ts             — all .feather/ path helpers, ensureDirs()
  sessions/
    types.ts               — all shared TypeScript types
    session.ts             — FeatherSession: wraps BrowserContext + state
    manager.ts             — SessionManager: launch, close, get, list
  profiles/
    lock.ts                — ProfileLock: file-based lock create/check/release
    workspace.ts           — WorkspaceMetadata: workspace.json read/write
  browser/
    modes.ts               — buildLaunchOptions(mode, proxy?, viewport?)
  commands/
    handler.ts             — CommandHandler<TIn, TOut> interface + CommandContext
    launch.ts              — LaunchSessionHandler
    status.ts              — GetSessionHandler, ListSessionsHandler
    navigate.ts            — NavigateHandler
    snapshot.ts            — SnapshotHandler
    extract.ts             — ExtractHandler
    screenshot.ts          — ScreenshotHandler
    debug-bundle.ts        — DebugBundleHandler
    close.ts               — CloseSessionHandler
  transport/
    http.ts                — Fastify server, token generation, endpoint file
    middleware.ts          — token auth preHandler, requestId injection
    routes.ts              — route registration, ApiResponse envelope
  logs/
    events.ts              — EVENTS constant map
    redact.ts              — redactProxy(), redactUrl()
    logger.ts              — FeatherLogger: JSONL writer per session
  debug/
    capture.ts             — DebugCapture: Playwright event listeners
    bundle.ts              — DebugBundle: finalize manifest.json
  measurement/
    sampler.ts             — ProcessSampler: periodic RSS/CPU sampling
    runner.ts              — MeasurementRunner: scenario execution
    reporter.ts            — writeArtifacts(): summary.json, scenario.json

tests/
  unit/
    config.test.ts
    fs-layout.test.ts
    profiles/lock.test.ts
    profiles/workspace.test.ts
    browser/modes.test.ts
    logs/redact.test.ts
    logs/logger.test.ts
    commands/extract.test.ts
    commands/snapshot.test.ts
    debug/bundle.test.ts
  integration/
    transport.integration.test.ts   — token auth, health check (no browser)
    api-flow.integration.test.ts    — full launch→close flow
    profile-lock.integration.test.ts
    disposable-cleanup.integration.test.ts
    proxy-redaction.integration.test.ts
  measurement/
    scenario.measurement.test.ts   — compares both browser modes
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "feather-browser",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --config vitest.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:measurement": "vitest run --config vitest.measurement.config.ts"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "playwright": "^1.50.0",
    "pidusage": "^3.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create vitest.config.ts** (unit tests only — no browser)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create vitest.integration.config.ts** (launches real browser — slow)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    include: ["tests/integration/**/*.integration.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

- [ ] **Step 5: Create vitest.measurement.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 300000,
    include: ["tests/measurement/**/*.measurement.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

- [ ] **Step 6: Create src/index.ts** (minimal skeleton — fills in after HTTP task)

```typescript
async function main() {
  console.log("Feather Browser service starting...");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts vitest.integration.config.ts vitest.measurement.config.ts src/index.ts
git commit -m "feat: scaffold Node/TypeScript project for Phase 2 headless core"
```

---

## Task 2: Config and Filesystem Layout

**Files:**
- Create: `src/config.ts`
- Create: `src/fs-layout.ts`
- Create: `tests/unit/config.test.ts`
- Create: `tests/unit/fs-layout.test.ts`

- [ ] **Step 1: Write failing tests for config defaults**

```typescript
// tests/unit/config.test.ts
import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/config";

describe("loadConfig", () => {
  it("returns default port 0 when FEATHER_PORT is unset", () => {
    delete process.env.FEATHER_PORT;
    const cfg = loadConfig();
    expect(cfg.port).toBe(0);
  });

  it("reads FEATHER_PORT from env", () => {
    process.env.FEATHER_PORT = "17321";
    const cfg = loadConfig();
    expect(cfg.port).toBe(17321);
    delete process.env.FEATHER_PORT;
  });

  it("defaults featherDir to .feather in cwd", () => {
    delete process.env.FEATHER_DIR;
    const cfg = loadConfig();
    expect(cfg.featherDir).toBe(".feather");
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../src/config'`

- [ ] **Step 3: Create src/config.ts**

```typescript
export interface FeatherConfig {
  port: number;
  host: string;
  featherDir: string;
}

export function loadConfig(): FeatherConfig {
  return {
    port: process.env.FEATHER_PORT ? parseInt(process.env.FEATHER_PORT, 10) : 0,
    host: process.env.FEATHER_HOST ?? "127.0.0.1",
    featherDir: process.env.FEATHER_DIR ?? ".feather",
  };
}
```

- [ ] **Step 4: Write failing tests for fs-layout**

```typescript
// tests/unit/fs-layout.test.ts
import { describe, it, expect } from "vitest";
import { FeatherPaths } from "../../src/fs-layout";

describe("FeatherPaths", () => {
  const paths = new FeatherPaths(".feather");

  it("builds profile path for workspace", () => {
    expect(paths.profileDir("ws1")).toBe(".feather/profiles/ws1/profile");
  });

  it("builds workspace json path", () => {
    expect(paths.workspaceJson("ws1")).toBe(".feather/profiles/ws1/workspace.json");
  });

  it("builds lock path for workspace", () => {
    expect(paths.lockFile("ws1")).toBe(".feather/profiles/ws1/lock");
  });

  it("builds disposable session dir", () => {
    expect(paths.disposableSessionDir("ses1")).toBe(".feather/tmp/sessions/ses1");
  });

  it("builds debug dir for session", () => {
    expect(paths.debugDir("ses1")).toBe(".feather/debug/ses1");
  });

  it("builds session log path", () => {
    expect(paths.sessionLog("ses1")).toBe(".feather/logs/sessions/ses1.jsonl");
  });

  it("builds run dir paths", () => {
    expect(paths.endpointFile()).toBe(".feather/run/endpoint.json");
    expect(paths.tokenFile()).toBe(".feather/run/control-token");
  });

  it("builds measurement dir for run", () => {
    expect(paths.measurementDir("run1")).toBe(".feather/measurements/run1");
  });
});
```

- [ ] **Step 5: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '../../src/fs-layout'`

- [ ] **Step 6: Create src/fs-layout.ts**

```typescript
import * as path from "path";
import * as fs from "fs";

export class FeatherPaths {
  constructor(private readonly base: string) {}

  profileDir(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "profile");
  }

  workspaceJson(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "workspace.json");
  }

  lockFile(workspaceId: string): string {
    return path.join(this.base, "profiles", workspaceId, "lock");
  }

  disposableSessionDir(sessionId: string): string {
    return path.join(this.base, "tmp", "sessions", sessionId);
  }

  disposableProfileDir(sessionId: string): string {
    return path.join(this.disposableSessionDir(sessionId), "profile");
  }

  debugDir(sessionId: string): string {
    return path.join(this.base, "debug", sessionId);
  }

  sessionLog(sessionId: string): string {
    return path.join(this.base, "logs", "sessions", `${sessionId}.jsonl`);
  }

  endpointFile(): string {
    return path.join(this.base, "run", "endpoint.json");
  }

  tokenFile(): string {
    return path.join(this.base, "run", "control-token");
  }

  measurementDir(runId: string): string {
    return path.join(this.base, "measurements", runId);
  }

  quarantinedProfileDir(sessionId: string): string {
    return path.join(this.base, "debug", sessionId, "quarantined-profile");
  }
}

export async function ensureDirs(featherDir: string): Promise<void> {
  const dirs = [
    path.join(featherDir, "profiles"),
    path.join(featherDir, "tmp", "sessions"),
    path.join(featherDir, "debug"),
    path.join(featherDir, "logs", "sessions"),
    path.join(featherDir, "run"),
    path.join(featherDir, "measurements"),
  ];
  for (const d of dirs) {
    await fs.promises.mkdir(d, { recursive: true });
  }
}
```

- [ ] **Step 7: Run tests to verify pass**

```bash
npm test -- --reporter=verbose
```

Expected: all 10 tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/config.ts src/fs-layout.ts tests/unit/config.test.ts tests/unit/fs-layout.test.ts
git commit -m "feat: add config loading and .feather filesystem path helpers"
```

---

## Task 3: Credential Redaction

**Files:**
- Create: `src/logs/redact.ts`
- Create: `tests/unit/logs/redact.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/logs/redact.test.ts
import { describe, it, expect } from "vitest";
import { redactProxy, redactUrl } from "../../../src/logs/redact";
import type { ProxyConfig } from "../../../src/sessions/types";

describe("redactProxy", () => {
  it("returns sanitized summary with hasCredentials true when credentials present", () => {
    const proxy: ProxyConfig = {
      server: "http://127.0.0.1:8080",
      username: "user",
      password: "secret",
      bypass: "localhost",
    };
    const result = redactProxy(proxy);
    expect(result.server).toBe("http://127.0.0.1:8080");
    expect(result.hasCredentials).toBe(true);
    expect(result.bypass).toBe("localhost");
    expect(result).not.toHaveProperty("username");
    expect(result).not.toHaveProperty("password");
  });

  it("returns hasCredentials false when no credentials", () => {
    const proxy: ProxyConfig = { server: "http://proxy.example.com:3128" };
    const result = redactProxy(proxy);
    expect(result.hasCredentials).toBe(false);
  });

  it("omits bypass when not set", () => {
    const proxy: ProxyConfig = { server: "http://proxy.example.com:3128" };
    const result = redactProxy(proxy);
    expect(result.bypass).toBeUndefined();
  });
});

describe("redactUrl", () => {
  it("strips username and password from URL", () => {
    expect(redactUrl("http://user:secret@proxy.example.com:8080"))
      .toBe("http://proxy.example.com:8080");
  });

  it("returns unchanged URL when no credentials", () => {
    expect(redactUrl("http://proxy.example.com:8080"))
      .toBe("http://proxy.example.com:8080");
  });

  it("returns original string if not a valid URL", () => {
    expect(redactUrl("not-a-url")).toBe("not-a-url");
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '../../../src/logs/redact'`

- [ ] **Step 3: Create src/sessions/types.ts first** (needed by redact imports)

```typescript
export type BrowserMode = "chromium-new-headless" | "chromium-headless-shell";
export type ProfileKind = "persistent" | "disposable";
export type SessionState = "launching" | "running" | "closing" | "closed" | "failed";

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  bypass?: string;
}

export interface ProxySummary {
  server: string;
  hasCredentials: boolean;
  bypass?: string;
}

export interface PageInfo {
  pageId: string;
  url: string;
  title: string;
}

export interface SessionRecord {
  sessionId: string;
  workspaceId: string;
  profileKind: ProfileKind;
  browserMode: BrowserMode;
  state: SessionState;
  profilePath: string;
  debugDir: string;
  proxy: ProxySummary | null;
  startedAt: string;
  pages: PageInfo[];
  profileLocked: boolean;
}

export interface ExtractField {
  selector: string;
  type: "text" | "attribute";
  attribute?: string;
}

export interface ExtractRecipe {
  fields: Record<string, ExtractField>;
  limits?: { items?: number; textChars?: number };
}

export interface SnapshotResult {
  pageId: string;
  url: string;
  title: string;
  text: string;
  links: Array<{ text: string; href: string }>;
  meta: { description: string };
  limits: { textChars: number; links: number };
}

export interface CommandContext {
  requestId: string;
}
```

- [ ] **Step 4: Create src/logs/redact.ts**

```typescript
import type { ProxyConfig, ProxySummary } from "../sessions/types";

export function redactProxy(proxy: ProxyConfig): ProxySummary {
  return {
    server: proxy.server,
    hasCredentials: !!(proxy.username || proxy.password),
    ...(proxy.bypass !== undefined ? { bypass: proxy.bypass } : {}),
  };
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return url;
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --reporter=verbose
```

Expected: all redact tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/types.ts src/logs/redact.ts tests/unit/logs/redact.test.ts
git commit -m "feat: add shared session types and credential redaction helpers"
```

---

## Task 4: Profile Lock and Workspace Metadata

**Files:**
- Create: `src/profiles/lock.ts`
- Create: `src/profiles/workspace.ts`
- Create: `tests/unit/profiles/lock.test.ts`
- Create: `tests/unit/profiles/workspace.test.ts`

- [ ] **Step 1: Write failing tests for ProfileLock**

```typescript
// tests/unit/profiles/lock.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ProfileLock } from "../../../src/profiles/lock";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-test-"));
  await fs.promises.mkdir(path.join(tmpDir, "profiles", "ws1"), { recursive: true });
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("ProfileLock.create", () => {
  it("writes lock file with session metadata", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    const raw = await fs.promises.readFile(paths.lockFile("ws1"), "utf8");
    const data = JSON.parse(raw);
    expect(data.sessionId).toBe("ses1");
    expect(data.workspaceId).toBe("ws1");
    expect(data.browserMode).toBe("chromium-new-headless");
    expect(data.proxySummary).toBeNull();
    expect(typeof data.pid).toBe("number");
    expect(typeof data.createdAt).toBe("string");
  });

  it("throws PROFILE_LOCKED when lock already exists", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    await expect(
      lock.create("ws1", "ses2", "chromium-new-headless", null)
    ).rejects.toMatchObject({ code: "PROFILE_LOCKED" });
  });
});

describe("ProfileLock.isLocked", () => {
  it("returns false when no lock file exists", async () => {
    const lock = new ProfileLock(paths);
    expect(await lock.isLocked("ws1")).toBe(false);
  });

  it("returns true after lock is created", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    expect(await lock.isLocked("ws1")).toBe(true);
  });
});

describe("ProfileLock.release", () => {
  it("removes the lock file", async () => {
    const lock = new ProfileLock(paths);
    await lock.create("ws1", "ses1", "chromium-new-headless", null);
    await lock.release("ws1");
    expect(await lock.isLocked("ws1")).toBe(false);
  });

  it("does not throw if lock file is already gone", async () => {
    const lock = new ProfileLock(paths);
    await expect(lock.release("ws1")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|PASS|Cannot find)"
```

Expected: `Cannot find module '../../../src/profiles/lock'`

- [ ] **Step 3: Create src/profiles/lock.ts**

```typescript
import * as fs from "fs";
import type { BrowserMode, ProxySummary } from "../sessions/types";
import type { FeatherPaths } from "../fs-layout";

export interface LockData {
  sessionId: string;
  pid: number;
  createdAt: string;
  workspaceId: string;
  browserMode: BrowserMode;
  proxySummary: ProxySummary | null;
}

export class ProfileLockedError extends Error {
  readonly code = "PROFILE_LOCKED";
  constructor(workspaceId: string, existing: LockData) {
    super(`Workspace '${workspaceId}' is already in use by session ${existing.sessionId}.`);
    this.name = "ProfileLockedError";
  }
}

export class ProfileLock {
  constructor(private readonly paths: FeatherPaths) {}

  async create(
    workspaceId: string,
    sessionId: string,
    browserMode: BrowserMode,
    proxySummary: ProxySummary | null
  ): Promise<void> {
    const lockPath = this.paths.lockFile(workspaceId);
    try {
      const existing = await fs.promises.readFile(lockPath, "utf8");
      const data: LockData = JSON.parse(existing);
      throw new ProfileLockedError(workspaceId, data);
    } catch (err: any) {
      if (err instanceof ProfileLockedError) throw err;
      if (err.code !== "ENOENT") throw err;
    }

    const data: LockData = {
      sessionId,
      pid: process.pid,
      createdAt: new Date().toISOString(),
      workspaceId,
      browserMode,
      proxySummary,
    };
    await fs.promises.writeFile(lockPath, JSON.stringify(data, null, 2), "utf8");
  }

  async isLocked(workspaceId: string): Promise<boolean> {
    try {
      await fs.promises.access(this.paths.lockFile(workspaceId));
      return true;
    } catch {
      return false;
    }
  }

  async read(workspaceId: string): Promise<LockData | null> {
    try {
      const raw = await fs.promises.readFile(this.paths.lockFile(workspaceId), "utf8");
      return JSON.parse(raw) as LockData;
    } catch {
      return null;
    }
  }

  async release(workspaceId: string): Promise<void> {
    try {
      await fs.promises.unlink(this.paths.lockFile(workspaceId));
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }
}
```

- [ ] **Step 4: Write failing tests for WorkspaceMetadata**

```typescript
// tests/unit/profiles/workspace.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { WorkspaceMetadata } from "../../../src/profiles/workspace";
import { FeatherPaths } from "../../../src/fs-layout";

let tmpDir: string;
let paths: FeatherPaths;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-ws-"));
  await fs.promises.mkdir(path.join(tmpDir, "profiles", "ws1"), { recursive: true });
  paths = new FeatherPaths(tmpDir);
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("WorkspaceMetadata", () => {
  it("writes and reads workspace.json", async () => {
    const wm = new WorkspaceMetadata(paths);
    await wm.write("ws1", { workspaceId: "ws1", createdAt: "2026-05-31T00:00:00.000Z" });
    const data = await wm.read("ws1");
    expect(data?.workspaceId).toBe("ws1");
  });

  it("returns null when workspace.json does not exist", async () => {
    const wm = new WorkspaceMetadata(paths);
    const data = await wm.read("missing");
    expect(data).toBeNull();
  });
});
```

- [ ] **Step 5: Create src/profiles/workspace.ts**

```typescript
import * as fs from "fs";
import type { FeatherPaths } from "../fs-layout";

export interface WorkspaceData {
  workspaceId: string;
  createdAt: string;
  [key: string]: unknown;
}

export class WorkspaceMetadata {
  constructor(private readonly paths: FeatherPaths) {}

  async read(workspaceId: string): Promise<WorkspaceData | null> {
    try {
      const raw = await fs.promises.readFile(this.paths.workspaceJson(workspaceId), "utf8");
      return JSON.parse(raw) as WorkspaceData;
    } catch {
      return null;
    }
  }

  async write(workspaceId: string, data: WorkspaceData): Promise<void> {
    const filePath = this.paths.workspaceJson(workspaceId);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  async ensureExists(workspaceId: string): Promise<WorkspaceData> {
    const existing = await this.read(workspaceId);
    if (existing) return existing;
    const data: WorkspaceData = {
      workspaceId,
      createdAt: new Date().toISOString(),
    };
    await this.write(workspaceId, data);
    return data;
  }
}
```

- [ ] **Step 6: Run all unit tests**

```bash
npm test -- --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/profiles/lock.ts src/profiles/workspace.ts tests/unit/profiles/lock.test.ts tests/unit/profiles/workspace.test.ts
git commit -m "feat: add profile lock file and workspace metadata"
```

---

## Task 5: Browser Mode Launch Options

**Files:**
- Create: `src/browser/modes.ts`
- Create: `tests/unit/browser/modes.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/browser/modes.test.ts
import { describe, it, expect } from "vitest";
import { buildLaunchOptions } from "../../../src/browser/modes";

describe("buildLaunchOptions", () => {
  it("chromium-new-headless sets channel chromium and headless true", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.channel).toBe("chromium");
    expect(opts.headless).toBe(true);
  });

  it("chromium-headless-shell does not set channel", () => {
    const opts = buildLaunchOptions("chromium-headless-shell");
    expect(opts.channel).toBeUndefined();
    expect(opts.headless).toBe(true);
  });

  it("applies proxy when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", {
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
    expect(opts.proxy).toEqual({
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
  });

  it("applies viewport when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", undefined, { width: 1280, height: 800 });
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });

  it("uses default viewport 1280x800 when not provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "(FAIL|Cannot)"
```

- [ ] **Step 3: Create src/browser/modes.ts**

```typescript
import type { BrowserContextOptions } from "playwright";
import type { BrowserMode, ProxyConfig } from "../sessions/types";

type LaunchOptions = BrowserContextOptions & { channel?: string; headless?: boolean };

export function buildLaunchOptions(
  mode: BrowserMode,
  proxy?: ProxyConfig | null,
  viewport?: { width: number; height: number }
): LaunchOptions {
  const opts: LaunchOptions = {
    headless: true,
    viewport: viewport ?? { width: 1280, height: 800 },
  };

  if (mode === "chromium-new-headless") {
    opts.channel = "chromium";
  }

  if (proxy) {
    opts.proxy = {
      server: proxy.server,
      ...(proxy.username !== undefined ? { username: proxy.username } : {}),
      ...(proxy.password !== undefined ? { password: proxy.password } : {}),
      ...(proxy.bypass !== undefined ? { bypass: proxy.bypass } : {}),
    };
  }

  return opts;
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/browser/modes.ts tests/unit/browser/modes.test.ts
git commit -m "feat: add browser mode launch option builder"
```
