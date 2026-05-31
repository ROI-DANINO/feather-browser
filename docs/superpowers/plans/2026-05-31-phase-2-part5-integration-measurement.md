# Feather Browser Phase 2 — Part 5: Integration Tests, Resource Measurement & Verification

> Part of a multi-part plan. See also: Part 1 (Foundation), Part 2 (Session Layer), Part 3 (Commands), Part 4 (Transport).
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Covers:** Task 11 (integration test suite), Task 12 (resource measurement scenario), Task 13 (manual verification checklist)

---

## File Structure

```
tests/
  integration/
    api-flow.integration.test.ts
    profile-lock.integration.test.ts
    disposable-cleanup.integration.test.ts
    proxy-redaction.integration.test.ts
src/
  measurement/
    sampler.ts
    runner.ts
    reporter.ts
tests/
  measurement/
    scenario.measurement.test.ts
docs/
  specs/
    phase-2-verification-checklist.md
```

---

## Task 11: Integration Test Suite

**Files:**
- Create: `tests/integration/api-flow.integration.test.ts`
- Create: `tests/integration/profile-lock.integration.test.ts`
- Create: `tests/integration/disposable-cleanup.integration.test.ts`
- Create: `tests/integration/proxy-redaction.integration.test.ts`

Integration tests launch real Chromium. All tests default to `browserMode: "chromium-headless-shell"` to avoid requiring system Chrome. Run with:

```bash
npm run test:integration
```

The `vitest.integration.config.ts` from Task 1 sets `testTimeout: 60000` and `pool: "forks"` with `singleFork: true`.

---

### Task 11a: api-flow.integration.test.ts

**Purpose:** Exercise the full launch → navigate → snapshot → extract → screenshot → debug-bundle → close API sequence.

- [ ] **Step 1: Write the full integration test**

```typescript
// tests/integration/api-flow.integration.test.ts
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

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-api-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Full API flow: launch → navigate → snapshot → extract → screenshot → debug-bundle → close", () => {
  it("Test 1: POST /v1/sessions returns 200 with sessionId and state 'running'", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "api-flow-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
      viewport: { width: 1280, height: 800 },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBeTruthy();
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;
  });

  it("Test 2: GET /v1/sessions/:id returns session with pages array and state 'running'", async () => {
    const { status, body } = await api("GET", `/v1/sessions/${sessionId}`);

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(sessionId);
    expect(body.data.state).toBe("running");
    expect(Array.isArray(body.data.pages)).toBe(true);
    expect(body.data.pages.length).toBeGreaterThanOrEqual(1);
  });

  it("Test 3: POST /v1/sessions/:id/navigate to https://example.com returns url and status", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: "https://example.com",
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.url).toContain("example.com");
    expect(typeof body.data.status).toBe("number");
  });

  it("Test 4: POST /v1/sessions/:id/snapshot returns text, links, title", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/snapshot`, {});

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.text).toBe("string");
    expect(body.data.text.length).toBeGreaterThan(0);
    expect(Array.isArray(body.data.links)).toBe(true);
    expect(typeof body.data.title).toBe("string");
    expect(body.data.title.length).toBeGreaterThan(0);
  });

  it("Test 5: POST /v1/sessions/:id/extract with h1 selector returns heading field", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/extract`, {
      recipe: {
        fields: {
          heading: { selector: "h1", type: "text" },
        },
      },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.heading).toBe("string");
    expect(body.data.heading.length).toBeGreaterThan(0);
  });

  it("Test 6: POST /v1/sessions/:id/screenshot returns artifactId and path (file exists on disk)", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/screenshot`, {
      fullPage: false,
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.artifactId).toBe("string");
    expect(body.data.artifactId.length).toBeGreaterThan(0);
    expect(typeof body.data.path).toBe("string");

    // The path is relative to featherDir; check from tmpDir
    const absPath = path.isAbsolute(body.data.path)
      ? body.data.path
      : path.join(tmpDir, body.data.path.replace(/^\.feather\//, ""));
    const exists = await fs.promises
      .access(absPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 7: POST /v1/sessions/:id/debug-bundle returns manifest path (file exists on disk)", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/debug-bundle`, {});

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.data.manifest).toBe("string");

    const absManifest = path.isAbsolute(body.data.manifest)
      ? body.data.manifest
      : path.join(tmpDir, body.data.manifest.replace(/^\.feather\//, ""));
    const exists = await fs.promises
      .access(absManifest)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 8: DELETE /v1/sessions/:id returns { sessionId, state: 'closed' }", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessionId).toBe(sessionId);
    expect(body.data.state).toBe("closed");
  });

  it("Test 9: GET /v1/sessions after close returns empty array", async () => {
    const { status, body } = await api("GET", "/v1/sessions");

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
npm run test:integration -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)"
```

Expected: all 9 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/api-flow.integration.test.ts
git commit -m "test: add api-flow integration test for full launch-to-close sequence"
```

---

### Task 11b: profile-lock.integration.test.ts

**Purpose:** Verify that concurrent launch attempts against the same persistent workspace are rejected with 409 PROFILE_LOCKED, and that the lock is released after close.

- [ ] **Step 1: Write the full integration test**

```typescript
// tests/integration/profile-lock.integration.test.ts
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

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-lock-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Profile lock enforcement", () => {
  const workspaceId = "lock-test-ws";
  let firstSessionId: string;

  it("Test 1: Launch persistent workspace session succeeds", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    firstSessionId = body.data.sessionId;
  });

  it("Test 2: Launch ANOTHER persistent session with SAME workspaceId returns 409 with code PROFILE_LOCKED", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("PROFILE_LOCKED");
  });

  it("Test 3: Close first session succeeds (lock released)", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${firstSessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");
  });

  it("Test 4: Launch workspace again after close succeeds (lock available)", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");

    // Clean up this session
    await api("DELETE", `/v1/sessions/${body.data.sessionId}`, { force: true });
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
npm run test:integration -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)"
```

Expected: all 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/profile-lock.integration.test.ts
git commit -m "test: add profile-lock integration test for 409 PROFILE_LOCKED enforcement"
```

---

### Task 11c: disposable-cleanup.integration.test.ts

**Purpose:** Verify that disposable sessions create a temporary profile directory and that the directory is fully removed on close.

- [ ] **Step 1: Write the full integration test**

```typescript
// tests/integration/disposable-cleanup.integration.test.ts
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
let paths: FeatherPaths;

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-disp-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Disposable session profile cleanup", () => {
  let sessionId: string;
  let profileDir: string;

  it("Test 1: Launch disposable session — profile dir exists at .feather/tmp/sessions/<id>/profile", async () => {
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "disposable-test",
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;

    // Build the expected profile dir path
    profileDir = paths.disposableProfileDir(sessionId);
    const exists = await fs.promises
      .access(profileDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("Test 2: Delete (close) disposable session — profile dir is removed", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");

    // Profile dir should be gone
    const exists = await fs.promises
      .access(profileDir)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });

  it("Test 3: Verify GET /v1/sessions returns empty after close", async () => {
    const { status, body } = await api("GET", "/v1/sessions");

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
npm run test:integration -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)"
```

Expected: all 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/disposable-cleanup.integration.test.ts
git commit -m "test: add disposable-cleanup integration test for profile dir removal on close"
```

---

### Task 11d: proxy-redaction.integration.test.ts

**Purpose:** Verify that proxy credentials are redacted from the API response and from JSONL log files. Uses a non-existent proxy server (`http://127.0.0.1:9999`) — the browser still launches but navigation will fail; session launch itself should succeed.

- [ ] **Step 1: Write the full integration test**

```typescript
// tests/integration/proxy-redaction.integration.test.ts
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
let paths: FeatherPaths;

async function api(method: string, path: string, body?: object) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-proxy-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Proxy credential redaction", () => {
  const proxyPassword = "secret";
  let sessionId: string;

  it("Test 1: Launch session with proxy credentials (non-existent server) — launch succeeds", async () => {
    // A non-existent proxy server is fine at launch time; Playwright accepts the config.
    // Navigation will fail but that is not tested here.
    const { status, body } = await api("POST", "/v1/sessions", {
      workspaceId: "proxy-test-ws",
      profile: { kind: "disposable" },
      browserMode: "chromium-headless-shell",
      proxy: {
        server: "http://127.0.0.1:9999",
        username: "user",
        password: proxyPassword,
      },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("running");
    sessionId = body.data.sessionId;
  });

  it("Test 2: GET /v1/sessions/:id → proxy has hasCredentials: true and server, but NO username/password", async () => {
    const { status, body } = await api("GET", `/v1/sessions/${sessionId}`);

    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const proxy = body.data.proxy;
    expect(proxy).not.toBeNull();
    expect(proxy.server).toBe("http://127.0.0.1:9999");
    expect(proxy.hasCredentials).toBe(true);
    expect(proxy).not.toHaveProperty("username");
    expect(proxy).not.toHaveProperty("password");
  });

  it("Test 3: JSONL log file for session does NOT contain the string 'secret'", async () => {
    const logPath = paths.sessionLog(sessionId);

    // Wait briefly for the log file to be flushed — it should exist after session launch
    await new Promise((resolve) => setTimeout(resolve, 200));

    const logExists = await fs.promises
      .access(logPath)
      .then(() => true)
      .catch(() => false);
    expect(logExists).toBe(true);

    const logContent = await fs.promises.readFile(logPath, "utf8");
    expect(logContent).not.toContain(proxyPassword);
  });

  it("Test 4: Close session", async () => {
    const { status, body } = await api("DELETE", `/v1/sessions/${sessionId}`, { force: true });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.state).toBe("closed");
  });
});
```

- [ ] **Step 2: Run the integration test**

```bash
npm run test:integration -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)"
```

Expected: all 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/proxy-redaction.integration.test.ts
git commit -m "test: add proxy-redaction integration test verifying credential scrubbing from API and logs"
```

---

## Task 12: Resource Measurement Scenario

**Files:**
- Create: `src/measurement/sampler.ts`
- Create: `src/measurement/runner.ts`
- Create: `src/measurement/reporter.ts`
- Create: `tests/measurement/scenario.measurement.test.ts`

Run with:

```bash
npm run test:measurement
```

The `vitest.measurement.config.ts` from Task 1 sets `testTimeout: 300000` and `pool: "forks"` with `singleFork: true`.

---

### Task 12a: sampler.ts

**Purpose:** Periodically sample RSS and CPU for a list of PIDs using `pidusage`.

- [ ] **Step 1: Create src/measurement/sampler.ts**

```typescript
// src/measurement/sampler.ts
import pidusage from "pidusage";

export interface Sample {
  ts: string;
  pids: Record<number, { rss: number; cpu: number }>;
}

export class ProcessSampler {
  private samples: Sample[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly pids: number[],
    private readonly intervalMs: number = 500
  ) {}

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(async () => {
      const pidMap: Record<number, { rss: number; cpu: number }> = {};
      for (const pid of this.pids) {
        try {
          const stat = await pidusage(pid);
          pidMap[pid] = { rss: stat.memory, cpu: stat.cpu };
        } catch {
          // Process may be gone; push partial result without this pid
        }
      }
      this.samples.push({ ts: new Date().toISOString(), pids: pidMap });
    }, this.intervalMs);
    // Prevent timer from keeping the process alive
    if (this.timer.unref) this.timer.unref();
  }

  stop(): Sample[] {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.samples;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/measurement/sampler.ts
git commit -m "feat: add ProcessSampler for periodic RSS/CPU sampling via pidusage"
```

---

### Task 12b: runner.ts

**Purpose:** Run the standard measurement scenario for one browser mode — launch, navigate, snapshot, screenshot, extract, debug-bundle, close — collecting timing and size metrics.

- [ ] **Step 1: Create src/measurement/runner.ts**

```typescript
// src/measurement/runner.ts
import * as fs from "fs";
import * as path from "path";
import type { BrowserMode } from "../sessions/types";

export interface ScenarioTimings {
  launchMs: number;
  navigateMs: number;
  snapshotMs: number;
  screenshotMs: number;
  extractMs: number;
  closeMs: number;
  totalMs: number;
}

export interface ScenarioResult {
  browserMode: BrowserMode;
  workspaceId: string;
  timings: ScenarioTimings;
  profileDirSizeBefore: number; // bytes, measured after screenshot, before close
  profileDirSizeAfter: number;  // bytes, measured after close
  debugBundleSize: number;      // bytes, measured after close
  nodePid: number;
}

export class MeasurementRunner {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly featherDir: string
  ) {}

  async run(browserMode: BrowserMode): Promise<ScenarioResult> {
    const workspaceId = `measure-${browserMode}-${Date.now()}`;
    const totalStart = Date.now();

    // Step 1: Launch session
    const launchStart = Date.now();
    const launchRes = await this.req("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode,
      viewport: { width: 1280, height: 800 },
      debug: { trace: true, screenshots: true },
    });
    const launchMs = Date.now() - launchStart;
    const sessionId: string = launchRes.data.sessionId;
    const profilePath: string = launchRes.data.profilePath;

    // Step 2: Navigate
    const navigateStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: "https://example.com",
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });
    const navigateMs = Date.now() - navigateStart;

    // Step 3: Snapshot
    const snapshotStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/snapshot`, {});
    const snapshotMs = Date.now() - snapshotStart;

    // Step 4: Screenshot
    const screenshotStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/screenshot`, { fullPage: false });
    const screenshotMs = Date.now() - screenshotStart;

    // Step 5: Extract
    const extractStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/extract`, {
      recipe: {
        fields: {
          heading: { selector: "h1", type: "text" },
        },
      },
    });
    const extractMs = Date.now() - extractStart;

    // Step 6: Debug bundle
    await this.req("POST", `/v1/sessions/${sessionId}/debug-bundle`, {});

    // Step 6.5: Measure profile dir size before close
    const profileDirSizeBefore = await this.measureDirSize(
      this.resolveFeatherPath(profilePath)
    );

    // Step 7: Close session
    const closeStart = Date.now();
    await this.req("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    const closeMs = Date.now() - closeStart;

    const totalMs = Date.now() - totalStart;

    // Step 8: Measure profile dir size after close
    const profileDirSizeAfter = await this.measureDirSize(
      this.resolveFeatherPath(profilePath)
    );

    // Step 9: Measure debug bundle size
    const debugBundlePath = path.join(this.featherDir, "debug", sessionId);
    const debugBundleSize = await this.measureDirSize(debugBundlePath);

    return {
      browserMode,
      workspaceId,
      timings: {
        launchMs,
        navigateMs,
        snapshotMs,
        screenshotMs,
        extractMs,
        closeMs,
        totalMs,
      },
      profileDirSizeBefore,
      profileDirSizeAfter,
      debugBundleSize,
      nodePid: process.pid,
    };
  }

  private resolveFeatherPath(p: string): string {
    if (path.isAbsolute(p)) return p;
    // Strip leading ".feather/" prefix if present, then join with featherDir
    const stripped = p.replace(/^\.feather[/\\]/, "");
    return path.join(this.featherDir, stripped);
  }

  private async req(method: string, endpoint: string, body?: object): Promise<any> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": this.token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as any;
    if (!json.ok) {
      throw new Error(`API error ${res.status}: ${JSON.stringify(json.error)}`);
    }
    return json;
  }

  async measureDirSize(dirPath: string): Promise<number> {
    let total = 0;
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += await this.measureDirSize(full);
        } else if (entry.isFile()) {
          try {
            const stat = await fs.promises.stat(full);
            total += stat.size;
          } catch {
            // skip unreadable file
          }
        }
      }
    } catch {
      // dir not found → 0
    }
    return total;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/measurement/runner.ts
git commit -m "feat: add MeasurementRunner for timed scenario execution with size metrics"
```

---

### Task 12c: reporter.ts

**Purpose:** Write measurement artifacts — `samples.jsonl`, `summary.json`, and `scenario.json` — into a run-specific directory.

- [ ] **Step 1: Create src/measurement/reporter.ts**

```typescript
// src/measurement/reporter.ts
import * as fs from "fs";
import * as path from "path";
import type { Sample } from "./sampler";
import type { ScenarioResult } from "./runner";

export interface MeasurementSummary {
  runId: string;
  timestamp: string;
  results: ScenarioResult[];
  comparison: {
    launchMsDiff: number;    // chromium-new-headless minus chromium-headless-shell
    peakRssNodeDiff: number; // chromium-new-headless minus chromium-headless-shell (from samples)
  };
}

export async function writeArtifacts(
  runId: string,
  measurementDir: string,
  results: ScenarioResult[],
  samples: Sample[]
): Promise<void> {
  await fs.promises.mkdir(measurementDir, { recursive: true });

  // Write samples.jsonl — one JSON object per line
  const samplesPath = path.join(measurementDir, "samples.jsonl");
  const samplesLines = samples.map((s) => JSON.stringify(s)).join("\n");
  await fs.promises.writeFile(samplesPath, samplesLines + (samples.length > 0 ? "\n" : ""), "utf8");

  // Write scenario.json — full array of results
  const scenarioPath = path.join(measurementDir, "scenario.json");
  await fs.promises.writeFile(scenarioPath, JSON.stringify(results, null, 2), "utf8");

  // Build comparison: find results by browser mode
  const newHeadless = results.find((r) => r.browserMode === "chromium-new-headless");
  const headlessShell = results.find((r) => r.browserMode === "chromium-headless-shell");

  const launchMsDiff =
    newHeadless && headlessShell
      ? newHeadless.timings.launchMs - headlessShell.timings.launchMs
      : 0;

  // Compute peak RSS for node pid from samples for each mode
  function peakRssForPid(pid: number): number {
    let peak = 0;
    for (const sample of samples) {
      const stat = sample.pids[pid];
      if (stat && stat.rss > peak) peak = stat.rss;
    }
    return peak;
  }

  const peakRssNodeDiff =
    newHeadless && headlessShell
      ? peakRssForPid(newHeadless.nodePid) - peakRssForPid(headlessShell.nodePid)
      : 0;

  const summary: MeasurementSummary = {
    runId,
    timestamp: new Date().toISOString(),
    results,
    comparison: {
      launchMsDiff,
      peakRssNodeDiff,
    },
  };

  // Write summary.json
  const summaryPath = path.join(measurementDir, "summary.json");
  await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/measurement/reporter.ts
git commit -m "feat: add writeArtifacts reporter for measurement summary, scenario, and samples"
```

---

### Task 12d: scenario.measurement.test.ts

**Purpose:** End-to-end measurement test running the `chromium-headless-shell` scenario and verifying that all artifacts are written correctly. Only `chromium-headless-shell` is tested automatically; `chromium-new-headless` requires system Chrome and should be run manually.

- [ ] **Step 1: Write the full measurement test**

```typescript
// tests/measurement/scenario.measurement.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import crypto from "crypto";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";
import { ProcessSampler } from "../../src/measurement/sampler";
import { MeasurementRunner } from "../../src/measurement/runner";
import { writeArtifacts } from "../../src/measurement/reporter";
import type { Sample } from "../../src/measurement/sampler";
import type { ScenarioResult } from "../../src/measurement/runner";

// NOTE: Only chromium-headless-shell is run automatically to avoid system Chrome dependency.
// To compare both modes, run MeasurementRunner.run("chromium-new-headless") manually
// after installing system Chrome/Chromium and using npm run test:measurement.

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;
let paths: FeatherPaths;
let measurementDir: string;
let runId: string;

let results: ScenarioResult[] = [];
let samples: Sample[] = [];

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-measure-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;

  runId = crypto.randomUUID();
  measurementDir = paths.measurementDir(runId);
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("Resource measurement scenario (chromium-headless-shell)", () => {
  it("runs the full measurement scenario and collects timings", async () => {
    const sampler = new ProcessSampler([process.pid], 500);
    const runner = new MeasurementRunner(baseUrl, token, tmpDir);

    sampler.start();

    const result = await runner.run("chromium-headless-shell");

    samples = sampler.stop();
    results = [result];

    await writeArtifacts(runId, measurementDir, results, samples);

    // Verify result shape
    expect(result.browserMode).toBe("chromium-headless-shell");
    expect(typeof result.workspaceId).toBe("string");
    expect(result.nodePid).toBe(process.pid);

    // All timing fields must be positive numbers
    expect(result.timings.launchMs).toBeGreaterThan(0);
    expect(result.timings.navigateMs).toBeGreaterThan(0);
    expect(result.timings.snapshotMs).toBeGreaterThan(0);
    expect(result.timings.screenshotMs).toBeGreaterThan(0);
    expect(result.timings.extractMs).toBeGreaterThan(0);
    expect(result.timings.closeMs).toBeGreaterThan(0);
    expect(result.timings.totalMs).toBeGreaterThan(0);
  });

  it("summary.json exists and has required fields (runId, timestamp, results array)", async () => {
    const summaryPath = path.join(measurementDir, "summary.json");
    const exists = await fs.promises
      .access(summaryPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(summaryPath, "utf8");
    const summary = JSON.parse(raw);

    expect(summary.runId).toBe(runId);
    expect(typeof summary.timestamp).toBe("string");
    expect(Array.isArray(summary.results)).toBe(true);
    expect(summary.results.length).toBeGreaterThan(0);
    expect(typeof summary.comparison).toBe("object");
    expect(typeof summary.comparison.launchMsDiff).toBe("number");
  });

  it("samples.jsonl exists and contains at least 1 line", async () => {
    const samplesPath = path.join(measurementDir, "samples.jsonl");
    const exists = await fs.promises
      .access(samplesPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(samplesPath, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(1);

    // Each line must be valid JSON with a ts field
    for (const line of lines) {
      const parsed = JSON.parse(line);
      expect(typeof parsed.ts).toBe("string");
      expect(typeof parsed.pids).toBe("object");
    }
  });

  it("scenario.json exists and contains one result entry", async () => {
    const scenarioPath = path.join(measurementDir, "scenario.json");
    const exists = await fs.promises
      .access(scenarioPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    const raw = await fs.promises.readFile(scenarioPath, "utf8");
    const scenario = JSON.parse(raw);

    expect(Array.isArray(scenario)).toBe(true);
    expect(scenario.length).toBe(1);
    expect(scenario[0].browserMode).toBe("chromium-headless-shell");
    expect(scenario[0].timings.launchMs).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the measurement test**

```bash
npm run test:measurement -- --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|✗|Error)"
```

Expected: all 4 tests pass. The test writes artifacts to a temp directory and verifies their structure.

- [ ] **Step 3: Commit**

```bash
git add tests/measurement/scenario.measurement.test.ts
git commit -m "test: add measurement scenario test for chromium-headless-shell with artifact verification"
```

---

## Task 13: Manual Verification Checklist

**File:**
- Create: `docs/specs/phase-2-verification-checklist.md`

This document is used by a developer to manually verify all Phase 2 exit criteria against a real running service. It is not generated by tests — it is filled out by a human.

- [ ] **Step 1: Create the checklist file**

```markdown
# Phase 2 Manual Verification Checklist

Run this checklist against a fresh `.feather/` directory. Use `chromium-headless-shell` mode unless
testing the new headless comparison. Check each item as you verify it.

## Prerequisites

- [ ] `npm install` completed without errors
- [ ] `npx playwright install chromium-headless-shell` completed
- [ ] For `chromium-new-headless` tests: system Chrome or Chromium is installed and accessible on PATH
- [ ] No existing `.feather/` directory in the working directory (or it has been deleted/moved)

---

## Service Startup

- [ ] `npm run dev` starts without error and prints the endpoint URL to stdout
- [ ] `.feather/run/endpoint.json` exists and contains valid JSON with `baseUrl`, `tokenFile`, `pid`, and `startedAt` fields
- [ ] `.feather/run/control-token` exists and contains a non-empty hex token string
- [ ] `GET http://127.0.0.1:<port>/health` returns `{ "ok": true }` (no auth token required)
- [ ] A request to a protected endpoint without the `X-Feather-Token` header returns 401

---

## Persistent Session

- [ ] `POST /v1/sessions` with `profile.kind: "persistent"` and `workspaceId: "default"` returns 200 with `sessionId` and `state: "running"`
- [ ] `GET /v1/sessions/:id` returns a `pages` array with at least one entry
- [ ] `.feather/profiles/default/profile/` directory exists on disk after launch
- [ ] `.feather/profiles/default/lock` file exists on disk after launch
- [ ] `POST /v1/sessions/:id/navigate` to `https://example.com` returns 200 with `url` and numeric `status`
- [ ] `POST /v1/sessions/:id/snapshot` returns 200 with non-empty `text`, a `links` array, and a non-empty `title`
- [ ] `POST /v1/sessions/:id/extract` with recipe `{ fields: { heading: { selector: "h1", type: "text" } } }` returns `{ heading: "Example Domain" }`
- [ ] `POST /v1/sessions/:id/screenshot` returns 200 with `artifactId` and `path`; the PNG file exists at that path on disk
- [ ] `POST /v1/sessions/:id/debug-bundle` returns 200 with `manifest` path; `manifest.json` exists on disk
- [ ] `DELETE /v1/sessions/:id` returns `{ state: "closed" }` and `.feather/profiles/default/lock` is removed
- [ ] Restart service and launch same `workspaceId: "default"` again — browser storage from previous session persists (navigate to a page that set cookies/localStorage, restart, relaunch, navigate back, and confirm data is present)

---

## Disposable Session

- [ ] `POST /v1/sessions` with `profile.kind: "disposable"` returns 200 with a `sessionId`
- [ ] `.feather/tmp/sessions/<id>/profile/` directory exists on disk while the session is running
- [ ] `DELETE /v1/sessions/:id` returns `{ state: "closed" }` and the entire `.feather/tmp/sessions/<id>/` directory is removed from disk

---

## Profile Lock Enforcement

- [ ] Launch a persistent session with `workspaceId: "test-lock"` — succeeds
- [ ] Without closing it, attempt a second `POST /v1/sessions` with the same `workspaceId: "test-lock"` — response is 409 with `error.code: "PROFILE_LOCKED"`
- [ ] Close the first session — `DELETE` returns `{ state: "closed" }`
- [ ] Launch a new persistent session with the same `workspaceId: "test-lock"` — succeeds (returns 200)

---

## Proxy Configuration

- [ ] Launch a session with `proxy: { server: "http://127.0.0.1:9999", username: "user", password: "secret" }` — session launches (proxy failure at navigation time is acceptable)
- [ ] `GET /v1/sessions/:id` response shows `proxy.hasCredentials: true` and `proxy.server: "http://127.0.0.1:9999"` but does NOT include `username` or `password` fields
- [ ] The JSONL log file at `.feather/logs/sessions/<id>.jsonl` does not contain the string `"secret"` anywhere (check with `grep secret .feather/logs/sessions/<id>.jsonl` — should print nothing)

---

## JSONL Logs

- [ ] `.feather/logs/sessions/<id>.jsonl` exists after launching and using a session
- [ ] Each line of the file is valid JSON (check with `cat .feather/logs/sessions/<id>.jsonl | python3 -c "import sys,json; [json.loads(l) for l in sys.stdin]"` — should not raise)
- [ ] Each log line has the fields: `ts`, `level`, `event`, `sessionId`
- [ ] The following events are present (one per line):
  - `session.launch.completed`
  - `page.navigate.completed`
  - `session.close.completed`

---

## Debug Bundle

- [ ] `.feather/debug/<id>/manifest.json` exists after calling `POST /v1/sessions/:id/debug-bundle`
- [ ] `manifest.json` contains: `sessionId`, `workspaceId`, `startedAt`, `endedAt`, `closeReason`, `featherVersion`, `playwrightVersion`, `artifacts`
- [ ] `.feather/debug/<id>/commands.jsonl` exists
- [ ] `.feather/debug/<id>/network-summary.jsonl` exists
- [ ] `.feather/debug/<id>/screenshots/` directory contains the screenshot PNG captured during the session

---

## Resource Measurement

- [ ] Run `npm run test:measurement` — all tests pass
- [ ] `.feather/measurements/<runId>/summary.json` exists (find the runId in test output or check `ls .feather/measurements/`)
- [ ] `summary.json` contains a `results` array with at least one entry, each having `timings.launchMs`, `timings.navigateMs`, `timings.snapshotMs`, `timings.screenshotMs`, `timings.extractMs`, `timings.closeMs`, `timings.totalMs`
- [ ] `.feather/measurements/<runId>/samples.jsonl` exists and has at least 1 line
- [ ] `.feather/measurements/<runId>/scenario.json` exists

**Manual comparison (requires system Chrome for chromium-new-headless):**
- [ ] Edit `tests/measurement/scenario.measurement.test.ts` to also call `runner.run("chromium-new-headless")` and add results to the array before calling `writeArtifacts`
- [ ] Run `npm run test:measurement` again
- [ ] `summary.json` has `comparison.launchMsDiff` showing the difference between the two browser modes

---

## yt-dlp Boundary

- [ ] Confirm no real yt-dlp execution exists in the codebase: `grep -r "yt-dlp\|ytdlp\|youtube-dl" src/` returns no matches with actual subprocess calls
- [ ] `docs/specs/phase-2-headless-core-prototype-plan.md` section "yt-dlp Decision" documents the adapter boundary with the command shape and deferred implementation rationale

---

## Exit Criteria Sign-off

All of the following must be true before Phase 2 is considered complete:

- [ ] The local service launches and closes a persistent headless Chromium session
- [ ] A persistent workspace keeps browser storage across relaunch
- [ ] A disposable session runs and cleans up its temporary profile on close
- [ ] A concurrent launch against the same persistent profile is rejected with PROFILE_LOCKED
- [ ] A session launched with proxy configuration reports only redacted proxy metadata in API responses and logs
- [ ] The HTTP API completes the full sequence: launch → status → navigate → snapshot → extract → screenshot → debug-bundle → close
- [ ] JSONL logs and a debug bundle are written for the session
- [ ] Resource measurement artifacts are written for the chromium-headless-shell scenario
- [ ] The yt-dlp adapter remains deferred with a documented boundary in the spec
```

- [ ] **Step 2: Verify the checklist covers all exit criteria from the spec**

Open `docs/specs/phase-2-headless-core-prototype-plan.md` and compare each item in the "Exit Criteria For Phase 2 Prototype" section against the checklist:

1. "The local service launches and closes a persistent headless Chromium session" → covered in **Service Startup** and **Persistent Session**
2. "A persistent workspace keeps browser storage across relaunch" → covered in **Persistent Session** (restart and storage persistence item)
3. "A disposable session can run and clean up its temporary profile" → covered in **Disposable Session**
4. "A concurrent launch against the same persistent profile is rejected by Feather" → covered in **Profile Lock Enforcement**
5. "A session can be launched with proxy configuration and report only redacted proxy metadata" → covered in **Proxy Configuration**
6. "The HTTP API completes launch → status → navigate → snapshot → extract → screenshot → debug bundle → close" → covered in **Persistent Session** (all route checkboxes)
7. "JSONL logs and a debug bundle are written for the session" → covered in **JSONL Logs** and **Debug Bundle**
8. "Resource measurement artifacts compare new headless Chromium and headless shell" → covered in **Resource Measurement**
9. "The yt-dlp adapter remains deferred with a documented boundary" → covered in **yt-dlp Boundary**

All 9 exit criteria are covered. Proceed to commit.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/phase-2-verification-checklist.md
git commit -m "docs: add phase-2 manual verification checklist covering all exit criteria"
```

---

## Final Integration Check

After all tasks are committed, run the full test suite to verify nothing regressed:

- [ ] **Run unit tests**

```bash
npm test -- --reporter=verbose
```

Expected: all unit tests pass.

- [ ] **Run integration tests**

```bash
npm run test:integration -- --reporter=verbose
```

Expected: all integration tests pass (api-flow, profile-lock, disposable-cleanup, proxy-redaction).

- [ ] **Run measurement test**

```bash
npm run test:measurement -- --reporter=verbose
```

Expected: measurement scenario test passes and artifacts are written.

- [ ] **Typecheck**

```bash
npm run typecheck
```

Expected: no TypeScript errors.
