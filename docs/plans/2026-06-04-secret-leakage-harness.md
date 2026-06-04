# Secret-Leakage Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ADR-0008 Spike C pre-merge gate — an automated check that a secret seeded into a Feather session never lands in a clean-tier output surface — and fix the one real URL-leak it surfaces.

**Architecture:** A pure, browser-free assertion (`assertNoSecretLeak`) walks a session's output dirs, hard-fails on clean-tier surfaces (logs, summaries, manifest) and reports-only on capture-tier surfaces (trace, screenshots) by presence (no unzip, no new deps). A real-Chromium integration test drives the realistic autofill + URL vectors through it. `redactUrl` is hardened (drop query + fragment) and applied at the two emission points that leak today, so the gate is green and stays green.

**Tech Stack:** TypeScript, Vitest (unit `tests/unit/**`, integration `tests/integration/**/*.integration.test.ts`), Playwright 1.60 `chromium-headless-shell`, Node `http` for the hermetic fixture.

**Spec:** `docs/specs/2026-06-04-secret-leakage-harness-design.md` · **Evidence:** `research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`

---

## File Structure

- Create `tests/helpers/leak-scan.ts` — pure FS scanner + `assertNoSecretLeak` (one responsibility: detect a secret across files by tier). Browser-free so both unit and integration tests import it.
- Create `tests/helpers/leak-fixture.ts` — hermetic loopback HTTP fixture (login/echo/track endpoints).
- Create `tests/unit/leak-scan.test.ts` — proves the detector red/green without a browser.
- Create `tests/integration/secret-leakage.integration.test.ts` — end-to-end gate on a real engine.
- Modify `src/logs/redact.ts` — `redactUrl` also strips query string + fragment.
- Modify `src/sessions/manager.ts:159` — apply `redactUrl` to `TAB_UPDATED` `data.url`.
- Modify `src/debug/capture.ts:44,55` — apply `redactUrl` to recorded `request.url()`.
- Modify `tests/unit/logs/redact.test.ts` — cover query/fragment stripping.

---

## Task 1: The leak-scan detector (pure, browser-free)

**Files:**
- Create: `tests/helpers/leak-scan.ts`
- Test: `tests/unit/leak-scan.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/leak-scan.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assertNoSecretLeak, scanForSecret } from "../helpers/leak-scan";

const SECRET = "FEATHER-LEAK-CANARY-test123";
let dir: string;

beforeEach(async () => {
  dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "leak-scan-"));
});
afterEach(async () => {
  await fs.promises.rm(dir, { recursive: true, force: true });
});

describe("assertNoSecretLeak", () => {
  it("throws when the secret is in a clean-tier file", async () => {
    await fs.promises.writeFile(path.join(dir, "session.jsonl"), `{"url":"${SECRET}"}\n`);
    expect(() => assertNoSecretLeak(SECRET, [dir])).toThrow(/SECRET LEAK/);
  });

  it("passes on a clean tree", async () => {
    await fs.promises.writeFile(path.join(dir, "session.jsonl"), `{"url":"http://ok"}\n`);
    expect(() => assertNoSecretLeak(SECRET, [dir])).not.toThrow();
  });

  it("reports capture-tier hits without throwing", async () => {
    await fs.promises.writeFile(path.join(dir, "trace.zip"), `binary ${SECRET}`);
    const sub = path.join(dir, "screenshots");
    await fs.promises.mkdir(sub);
    await fs.promises.writeFile(path.join(sub, "a.png"), `pixels ${SECRET}`);
    const report = scanForSecret(SECRET, [dir]);
    expect(report.cleanTierHits).toHaveLength(0);
    expect(report.captureFindings.length).toBeGreaterThanOrEqual(2);
    expect(() => assertNoSecretLeak(SECRET, [dir])).not.toThrow();
  });

  it("tolerates a missing root without crashing", () => {
    const report = scanForSecret(SECRET, [path.join(dir, "nope")]);
    expect(report.cleanTierHits).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/leak-scan.test.ts`
Expected: FAIL — cannot resolve `../helpers/leak-scan`.

- [ ] **Step 3: Write minimal implementation**

Create `tests/helpers/leak-scan.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

export interface FileHit {
  file: string;
  count: number;
  contextSnippet: string;
}

export interface LeakScanReport {
  cleanTierHits: FileHit[];
  captureFindings: string[];
  unscannable: string[];
}

// Capture-tier is an explicit allowlist; everything else is clean-tier (fail-safe:
// an unforeseen artifact defaults to must-be-clean, so a new leak surface trips the gate).
const CAPTURE_TIER = [/(^|\/)trace\.zip$/, /(^|\/)screenshots\//, /\.(png|jpe?g)$/i];

function isCaptureTier(p: string): boolean {
  return CAPTURE_TIER.some((re) => re.test(p));
}

function walk(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // missing dir = surface simply not produced this run
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

export function scanForSecret(secret: string, roots: string[]): LeakScanReport {
  const report: LeakScanReport = { cleanTierHits: [], captureFindings: [], unscannable: [] };
  for (const root of roots) {
    for (const file of walk(root)) {
      if (isCaptureTier(file)) {
        report.captureFindings.push(file);
        continue;
      }
      let content: string;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        report.unscannable.push(file);
        continue;
      }
      const idx = content.indexOf(secret);
      if (idx !== -1) {
        const count = content.split(secret).length - 1;
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + secret.length + 40);
        report.cleanTierHits.push({
          file,
          count,
          contextSnippet: content.slice(start, end).replace(/\s+/g, " "),
        });
      }
    }
  }
  return report;
}

export function assertNoSecretLeak(secret: string, roots: string[]): LeakScanReport {
  const report = scanForSecret(secret, roots);
  if (report.captureFindings.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "[leak-scan] capture-tier artifacts present (known leak surfaces; mitigate by policy, not detection):\n  " +
        report.captureFindings.join("\n  ")
    );
  }
  if (report.unscannable.length > 0) {
    // eslint-disable-next-line no-console
    console.warn("[leak-scan] unscannable files (not silently skipped):\n  " + report.unscannable.join("\n  "));
  }
  if (report.cleanTierHits.length > 0) {
    const lines = report.cleanTierHits
      .map((h) => `  - ${h.file} (${h.count}x): ...${h.contextSnippet}...`)
      .join("\n");
    throw new Error(`SECRET LEAK: canary found in ${report.cleanTierHits.length} clean-tier surface(s):\n${lines}`);
  }
  return report;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/leak-scan.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/helpers/leak-scan.ts tests/unit/leak-scan.test.ts
git commit -m "test(leak): add assertNoSecretLeak detector with red/green unit tests"
```

---

## Task 2: Harden `redactUrl` and apply it at the leak points

**Files:**
- Modify: `src/logs/redact.ts:11-27`
- Modify: `tests/unit/logs/redact.test.ts:35-49`
- Modify: `src/sessions/manager.ts` (import + line 159)
- Modify: `src/debug/capture.ts` (import + lines 44, 55)

- [ ] **Step 1: Write the failing tests**

In `tests/unit/logs/redact.test.ts`, add these cases inside the existing `describe("redactUrl", ...)` block (after the "not a valid URL" test, before the closing `});`):

```typescript
  it("strips the query string", () => {
    expect(redactUrl("http://site.example.com/login?token=SECRET"))
      .toBe("http://site.example.com/login");
  });

  it("strips the fragment", () => {
    expect(redactUrl("http://site.example.com/cb#access_token=SECRET"))
      .toBe("http://site.example.com/cb");
  });

  it("strips credentials and query together", () => {
    expect(redactUrl("http://user:pw@site.example.com/p?k=SECRET"))
      .toBe("http://site.example.com/p");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run --config vitest.config.ts tests/unit/logs/redact.test.ts`
Expected: FAIL — the new cases still see `?token=SECRET` / `#access_token=SECRET` in the result.

- [ ] **Step 3: Harden `redactUrl`**

In `src/logs/redact.ts`, replace the body of `redactUrl` (lines 11-27) with:

```typescript
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hadTrailingSlash = url.endsWith("/") || parsed.pathname !== "/";
    parsed.username = "";
    parsed.password = "";
    parsed.search = ""; // drop query string (may carry tokens)
    parsed.hash = ""; // drop fragment (OAuth implicit-flow tokens ride here)
    const result = parsed.toString();
    // URL.toString() always adds a trailing slash for bare host:port URLs;
    // strip it only when the original URL had no path beyond the root.
    if (!hadTrailingSlash && result.endsWith("/")) {
      return result.slice(0, -1);
    }
    return result;
  } catch {
    return url;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run --config vitest.config.ts tests/unit/logs/redact.test.ts`
Expected: PASS (all redactProxy + redactUrl cases, old and new).

- [ ] **Step 5: Apply `redactUrl` at the two emission points**

In `src/sessions/manager.ts`, update the import on line 6:

```typescript
import { redactProxy, redactUrl } from "../logs/redact";
```

Then on line 159, change the `TAB_UPDATED` payload from:

```typescript
          data: { pageId, url: page.url(), title, loadState },
```

to:

```typescript
          data: { pageId, url: redactUrl(page.url()), title, loadState },
```

In `src/debug/capture.ts`, add an import near the top (after the existing imports on lines 1-3):

```typescript
import { redactUrl } from "../logs/redact";
```

Then change both `url: request.url(),` occurrences (lines 44 and 55) to:

```typescript
          url: redactUrl(request.url()),
```

- [ ] **Step 6: Run typecheck + full unit suite**

Run: `npm run typecheck && npm test`
Expected: typecheck clean; all unit tests pass (137 + new).

- [ ] **Step 7: Commit**

```bash
git add src/logs/redact.ts tests/unit/logs/redact.test.ts src/sessions/manager.ts src/debug/capture.ts
git commit -m "fix(redact): strip query+fragment in redactUrl; apply to TAB_UPDATED log and network-summary"
```

---

## Task 3: Hermetic fixture + end-to-end gate (real Chromium)

**Files:**
- Create: `tests/helpers/leak-fixture.ts`
- Create: `tests/integration/secret-leakage.integration.test.ts`

- [ ] **Step 1: Write the hermetic fixture helper**

Create `tests/helpers/leak-fixture.ts`:

```typescript
import * as http from "http";

export interface Fixture {
  baseUrl: string;
  received: string[];
  close(): Promise<void>;
}

export async function startLeakFixture(): Promise<Fixture> {
  const received: string[] = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/login") {
      res.end(
        `<!doctype html><title>Login</title><form method="POST" action="/login">` +
          `<input type="password" id="pw" name="pw"><button id="submit">Go</button></form>`
      );
    } else if (req.method === "GET" && url.pathname === "/echo-form") {
      res.end(
        `<!doctype html><title>Echo</title><form method="POST" action="/echo">` +
          `<input type="text" id="msg" name="msg"><button id="submit">Go</button></form>`
      );
    } else if (req.method === "GET" && url.pathname === "/track") {
      res.end(`<!doctype html><title>Tracked</title><body>tracked</body>`);
    } else if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        received.push(body);
        if (url.pathname === "/echo") {
          const msg = new URLSearchParams(body).get("msg") || "";
          res.end(`<!doctype html><title>Echoed</title><body><h1 id="out">${msg}</h1></body>`);
        } else {
          res.end(`<!doctype html><title>Account</title><body>Logged in.</body>`);
        }
      });
    } else {
      res.statusCode = 404;
      res.end("nope");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address() as { port: number };
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    received,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
```

- [ ] **Step 2: Write the integration test**

Create `tests/integration/secret-leakage.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { randomUUID } from "crypto";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { DebugCapture } from "../../src/debug/capture";
import { DebugBundle } from "../../src/debug/bundle";
import { assertNoSecretLeak } from "../helpers/leak-scan";
import { startLeakFixture, type Fixture } from "../helpers/leak-fixture";

let tmpDir: string;
let paths: FeatherPaths;
let manager: SessionManager;
let fixture: Fixture;

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-leak-"));
  await ensureDirs(tmpDir);
  paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  fixture = await startLeakFixture();
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fixture.close();
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("secret leakage gate", () => {
  it("keeps clean-tier surfaces free of seeded credentials", async () => {
    const pwCanary = `FEATHER-LEAK-CANARY-${randomUUID()}`;
    const urlCanary = `FEATHER-LEAK-CANARY-${randomUUID()}`;

    const session = await manager.launch({
      workspaceId: "leak-gate",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    const { page } = await session.openTab();

    const capture = new DebugCapture(session.getContext(), session.debugDir, {
      trace: true,
      screenshots: true,
    });
    await capture.start();

    // URL-query vector (a real clean-tier leak before Task 2's redaction fix).
    await page.goto(`${fixture.baseUrl}/track?token=${urlCanary}`, { waitUntil: "domcontentloaded" });

    // Autofill vector: type the credential into a password field and submit.
    await page.goto(`${fixture.baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#pw", pwCanary);
    await page.click("#submit");
    await page.waitForLoadState("domcontentloaded");

    // Produce a screenshot (capture-tier; reported, never fatal).
    const shotDir = path.join(session.debugDir, "screenshots");
    await fs.promises.mkdir(shotDir, { recursive: true });
    await page.screenshot({ path: path.join(shotDir, "after.png") });

    await capture.finalize(); // bundle JSONL + trace.zip
    await new DebugBundle(session, paths).finalize("test-complete"); // manifest.json

    const sessionId = session.sessionId;
    const debugDir = session.debugDir;
    await manager.close(sessionId, { force: true });

    const logDir = path.dirname(paths.sessionLog(sessionId));

    // Sanity: the secret really was submitted (the test exercised the path).
    expect(fixture.received.some((b) => b.includes(pwCanary))).toBe(true);

    // The gate: neither canary may appear in any clean-tier surface.
    assertNoSecretLeak(pwCanary, [debugDir, logDir]);
    assertNoSecretLeak(urlCanary, [debugDir, logDir]);
  }, 60000);
});
```

- [ ] **Step 3: Run the integration test to verify it passes**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/secret-leakage.integration.test.ts`
Expected: PASS. (If Task 2 were skipped, the `urlCanary` assertion would throw `SECRET LEAK` — that is the gate proving it catches the real URL leak.)

- [ ] **Step 4: Run the full suites**

Run: `npm test && npm run test:integration`
Expected: all unit (137 + new) and integration (33 + 1 new) tests pass; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add tests/helpers/leak-fixture.ts tests/integration/secret-leakage.integration.test.ts
git commit -m "test(leak): end-to-end secret-leakage gate on real Chromium (autofill + URL vectors)"
```

---

## Task 4: Mark Spike C complete; keep ADR-0008 non-accepted

**Files:**
- Modify: `docs/specs/adr-0008-credentials-vault.md` (Validation Gate — Spike C line)
- Modify: `PROGRESS.md`, `journal/context/active.md`, `journal/ops/phase.md`
- Append: `journal/log.md`

- [ ] **Step 1: Update ADR-0008 Spike C status**

In `docs/specs/adr-0008-credentials-vault.md`, in the "Validation Gate" section, change the Spike C bullet to record completion (keep the ADR Status line non-accepted — Spikes A and B remain):

```markdown
- **Spike C — secret-leakage harness. ✅ DONE (2026-06-04).** Shipped `assertNoSecretLeak`
  (`tests/helpers/leak-scan.ts`) + the end-to-end gate
  (`tests/integration/secret-leakage.integration.test.ts`). Surfaced and fixed a real
  clean-tier leak (raw URL in `TAB_UPDATED` + `network-summary`; `redactUrl` now strips
  query+fragment). Findings:
  `research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`. ADR stays
  **non-accepted** pending Spikes A and B.
```

- [ ] **Step 2: Reconcile tracking docs**

Update the "next" pointer in `PROGRESS.md`, `journal/context/active.md`, and `journal/ops/phase.md` from "ADR-0008 validation-gate spikes (start with C)" to: **Spike C done; next is Spike A (SQLCipher feasibility, sudo-gated install) and Spike B (KeePassXC integration)**. Mark Spike C in each "Done" list. Append one dated line to `journal/log.md` summarizing: leakage gate shipped + URL redaction hardening, Spikes A/B remain.

- [ ] **Step 3: Commit**

```bash
git add docs/specs/adr-0008-credentials-vault.md PROGRESS.md journal/context/active.md journal/ops/phase.md journal/log.md
git commit -m "docs: Spike C (leakage gate) complete; ADR-0008 still non-accepted pending Spikes A/B"
```

---

## Self-Review

**Spec coverage:**
- `assertNoSecretLeak`, tiering, fail-safe default → Task 1. ✓
- Hermetic fixture, autofill + URL vectors, DebugCapture wiring → Task 3. ✓
- Trace handled by presence (no unzip/dep) → `CAPTURE_TIER` allowlist, Task 1; reported in Task 3 run. ✓
- Images = documented blind spot, not scanned → `\.(png|jpe?g)$` in `CAPTURE_TIER`, Task 1. ✓
- Detector proven red/green without a browser → Task 1 unit tests. ✓
- URL query-string leak fix (decision A) → Task 2 (+ fragment, evidence-driven). ✓
- "What lands" file list → all created/modified across Tasks 1-4. ✓

**Placeholder scan:** none — every code/step is concrete.

**Type consistency:** `LeakScanReport { cleanTierHits, captureFindings, unscannable }`, `FileHit { file, count, contextSnippet }`, `scanForSecret`/`assertNoSecretLeak`, and `Fixture { baseUrl, received, close }` are used identically across Tasks 1 and 3. `redactUrl(string): string` signature unchanged (behavior extended).

**Note for executor:** `tests/helpers/` is a new directory (not a test-include path — it holds importable helpers only, matched by neither `tests/unit/**/*.test.ts` nor `tests/integration/**/*.integration.test.ts`, so it is never run as a test suite itself).
