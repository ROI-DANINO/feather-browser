# Phase 3 Branch Setup & Critical Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the master/dev/ui-playground branch hierarchy, merge prior AI work into dev, fix 5 critical bugs, write AGENTS.md, merge to master, and set up the ui-playground sandbox.

**Architecture:** All bug fixes are localized — no new files for the fixes, no architectural changes. Each task commits independently. Bug fixes run on dev after the feature branch merge, so the post-merge file states are used throughout. Tasks 4 and 6 both modify `src/sessions/manager.ts` — do them in order.

**Tech Stack:** TypeScript 5.4 / Node.js 20 / Playwright 1.50 / Fastify 4.x / Vitest / ts-node

---

## Task 1: Create dev and merge the AI feature branch

**Files:** Git operations only — no file edits.

- [ ] **Step 1: Create dev off master**

```bash
git checkout master
git checkout -b dev
```

Expected: `Switched to a new branch 'dev'`

- [ ] **Step 2: Merge the superset branch**

```bash
git merge origin/claude/branch-commit-info-p51r8 --no-edit
```

Expected: Fast-forward merge. No conflicts — the feature branch was built directly on top of master commits we have locally.

- [ ] **Step 3: Verify the merged files are present**

```bash
git log --oneline -6
ls docs/tech-stack-analysis-report.md docs/tech-stack-guidelines.md src/sessions/types.ts
```

Expected: Log shows commits from the feature branch. All three files exist.

- [ ] **Step 4: Delete both stale remote branches**

```bash
git push origin --delete claude/branch-commit-info-p51r8
git push origin --delete claude/phase-3-roadmap-analysis-j5eUo
```

Expected: `- [deleted] claude/...` for each.

- [ ] **Step 5: Push dev to remote**

```bash
git push -u origin dev
```

Expected: Branch pushed, upstream tracking set.

- [ ] **Step 6: Verify remote state**

```bash
git branch -a
```

Expected: `* dev`, `master`, `remotes/origin/dev`, `remotes/origin/master`. The two claude/* branches are gone.

---

## Task 2: Fix bug #1 — auth handler continues after sending 401

**Files:**
- Modify: `src/transport/middleware.ts`
- Create: `tests/unit/transport/middleware.test.ts`

**The bug:** `tokenAuth` calls `reply.status(401).send(...)` but does not `return`. Fastify's hook runner resolves the promise and continues the request lifecycle — the route handler executes after the 401 is sent. Fix: `return` the reply call so Fastify sees the hook terminated the response.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/transport/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { createTokenAuth, injectRequestId } from "../../../src/transport/middleware";

describe("createTokenAuth", () => {
  it("calls reply.status(401).send() when token is wrong", async () => {
    const tokenAuth = createTokenAuth("correct-token");
    const sendMock = vi.fn().mockResolvedValue(undefined);
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const request = { headers: { "x-feather-token": "wrong-token" }, requestId: "test" } as any;
    const reply = { status: statusMock } as any;

    await tokenAuth(request, reply);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }) })
    );
  });

  it("does not call reply when token is correct", async () => {
    const tokenAuth = createTokenAuth("correct-token");
    const sendMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const request = { headers: { "x-feather-token": "correct-token" }, requestId: "test" } as any;
    const reply = { status: statusMock } as any;

    await tokenAuth(request, reply);

    expect(statusMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("injectRequestId", () => {
  it("attaches a requestId string to the request object", () => {
    const request = { headers: {} } as any;
    injectRequestId(request);
    expect(typeof request.requestId).toBe("string");
    expect(request.requestId.startsWith("req_")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect pass (it tests observable behavior, not the Fastify lifecycle bug)**

```bash
npm test -- tests/unit/transport/middleware.test.ts
```

Expected: PASS. The existing code already calls 401 correctly — the test verifies that and will protect against regressions.

- [ ] **Step 3: Apply the fix to middleware.ts**

Replace the body of `tokenAuth` in `src/transport/middleware.ts`:

```typescript
export function createTokenAuth(token: string) {
  return async function tokenAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const provided = request.headers["x-feather-token"];
    if (provided !== token) {
      return reply.status(401).send({
        ok: false,
        requestId: (request as any).requestId ?? "unknown",
        error: { code: "UNAUTHORIZED", message: "Invalid or missing X-Feather-Token." },
      });
    }
  };
}
```

The only change is `return` before `reply.status(401)`. This makes Fastify's hook runner treat the reply as finished and skip the route handler.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/transport/middleware.ts tests/unit/transport/middleware.test.ts
git commit -m "fix: return after 401 in tokenAuth to prevent route handler execution"
```

---

## Task 3: Fix bug #4 — non-atomic lock file creation

**Files:**
- Modify: `src/profiles/lock.ts`

**The bug:** `create()` reads the lock file to check existence, then writes. Between those two operations, a concurrent `launch()` call can pass the same existence check — both sessions get the same workspace. Fix: use `fs.promises.open` with the `"wx"` flag, which creates the file atomically. The OS fails the open with `EEXIST` if the file already exists — no gap between check and create.

- [ ] **Step 1: Replace the `create()` method in `src/profiles/lock.ts`**

The full new `create()` method — replace everything between the opening `async create(` and its closing `}`:

```typescript
  async create(
    workspaceId: string,
    sessionId: string,
    browserMode: BrowserMode,
    proxySummary: ProxySummary | null
  ): Promise<void> {
    const lockPath = this.paths.lockFile(workspaceId);
    const data: LockData = {
      sessionId,
      pid: process.pid,
      createdAt: new Date().toISOString(),
      workspaceId,
      browserMode,
      proxySummary,
    };

    let fd: fs.promises.FileHandle | undefined;
    try {
      fd = await fs.promises.open(lockPath, "wx");
    } catch (err: any) {
      if (err.code === "EEXIST") {
        const existing = await fs.promises.readFile(lockPath, "utf8");
        const existingData: LockData = JSON.parse(existing);
        throw new ProfileLockedError(workspaceId, existingData);
      }
      throw err;
    }

    try {
      await fd.writeFile(JSON.stringify(data, null, 2), "utf8");
    } finally {
      await fd.close();
    }
  }
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass. The observable behavior (`ProfileLockedError` on double-launch) is unchanged — only the internal mechanism is now race-free.

- [ ] **Step 3: Commit**

```bash
git add src/profiles/lock.ts
git commit -m "fix: use fs.open wx flag for atomic lock file creation"
```

---

## Task 4: Fix bug #5 — session removed from registry before profile cleanup

**Files:**
- Modify: `src/sessions/manager.ts`

**The bug:** In `close()`, `this.registry.delete(sessionId)` runs immediately after `session.setState("closed")` — before lock release and before profile directory cleanup. If cleanup fails, the profile directory leaks silently with no registry record. Fix: move `registry.delete` to the very end of the method, after all cleanup has completed.

**Note:** This task modifies the post-merge version of `manager.ts` (which includes the lifecycle logging from the merged feature branch). The post-merge `close()` has `this.registry.delete(sessionId)` between `session.setState("closed")` and the `SESSION_CLOSE_COMPLETED` log.

- [ ] **Step 1: Move `registry.delete` to the end of `close()` in `src/sessions/manager.ts`**

Remove the line `this.registry.delete(sessionId);` from its current position (after `session.setState("closed")`).

Add it as the very last line of the `close()` method, after the disposable profile cleanup block. The end of the method should look exactly like this:

```typescript
    session.setState("closed");

    await this.logger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.SESSION_CLOSE_COMPLETED,
      sessionId: session.sessionId,
    });

    if (session.profileKind === "persistent") {
      await this.lock.release(session.workspaceId);
    }

    if (session.profileKind === "disposable") {
      const sessionDir = this.paths.disposableSessionDir(sessionId);
      if (opts?.quarantineDisposableProfile) {
        const quarantineDir = this.paths.quarantinedProfileDir(sessionId);
        await fs.promises.mkdir(path.dirname(quarantineDir), { recursive: true });
        try {
          await fs.promises.rename(session.profilePath, quarantineDir);
        } catch { /* profile may not exist */ }
      } else {
        await fs.promises.rm(sessionDir, { recursive: true, force: true });
      }
    }

    this.registry.delete(sessionId);
  }
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/sessions/manager.ts
git commit -m "fix: delete session from registry after profile cleanup, not before"
```

---

## Task 5: Fix bug #2 — snapshot.ts uses new Function() for page evaluation

**Files:**
- Modify: `src/commands/snapshot.ts`

**The bug:** Three calls to `page.evaluate(new Function('...'))`. `new Function()` constructs a function from a string at runtime — equivalent to `eval`. This violates CSP policies and is Playwright's documented anti-pattern. Fix: replace each with an inline arrow function. Playwright serializes arrow functions and sends them to the browser safely.

**Research note:** `page.evaluate(fn)` where `fn` is a JavaScript arrow function defined in Node.js is serialized by Playwright via `.toString()` and executed in the browser context. Arrow functions work correctly and are the documented pattern. `new Function()` reaches the browser the same way but is classified as dynamic code evaluation by CSP scanners and Playwright's own linting rules.

- [ ] **Step 1: Replace the entire `execute()` method body in `src/commands/snapshot.ts`**

```typescript
  async execute(input: SnapshotInput, _ctx: CommandContext): Promise<SnapshotResult> {
    const { sessionId, pageId } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const url = page.url();
    const title = await page.title();
    const rawText = await page.evaluate(() => document.body.innerText);
    const text = rawText.slice(0, 20000);
    const allLinks = await page.evaluate(() =>
      Array.from(document.links).map((a) => ({
        text: (a as HTMLAnchorElement).innerText.trim(),
        href: (a as HTMLAnchorElement).href,
      }))
    );
    const links = allLinks.slice(0, 200);
    const description = await page.evaluate(() => {
      const m = document.querySelector('meta[name="description"]');
      return m ? m.getAttribute("content") ?? "" : "";
    });
    return {
      pageId: resolvedPageId,
      url,
      title,
      text,
      links,
      meta: { description },
      limits: { textChars: 20000, links: 200 },
    };
  }
```

The three `eslint-disable-next-line` and `istanbul ignore next` comments that were suppressing warnings about `new Function` are removed along with their cause.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All tests pass. The snapshot behavior is identical — only the internal evaluation mechanism changes.

- [ ] **Step 3: Commit**

```bash
git add src/commands/snapshot.ts
git commit -m "fix: replace new Function() with arrow functions in snapshot page.evaluate calls"
```

---

## Task 6: Fix bug #3 — context.close() can hang indefinitely

**Files:**
- Modify: `src/sessions/manager.ts`

**The bug:** `context.close()` in `close()` has no timeout. If Chromium is unresponsive, the call hangs forever — the session stays in `"closing"` state, the registry entry is never removed, and the process is blocked. Fix: wrap with `Promise.race()` against a 10-second timeout. On timeout the promise rejects, the error path fires, and the session enters `"failed"` state.

**Research note:** `BrowserContext.close()` in Playwright 1.50 has no built-in timeout parameter. The standard Node.js approach is `Promise.race([operation, timeoutPromise])`. The timeout promise must call `clearTimeout` in a `finally` block to avoid keeping the Node.js event loop alive after the close resolves normally. 10 seconds is a conservative starting point for a local browser; measure and adjust if needed.

- [ ] **Step 1: Add `BrowserContext` to the playwright import in `src/sessions/manager.ts`**

Replace the existing playwright import line:

```typescript
import { chromium } from "playwright";
```

With:

```typescript
import { chromium, type BrowserContext } from "playwright";
```

- [ ] **Step 2: Add the timeout constant and helper function after the imports**

Add these two declarations after all import statements, before the `LaunchSessionInput` interface:

```typescript
const CLOSE_TIMEOUT_MS = 10_000;

async function closeContextWithTimeout(context: BrowserContext, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`context.close() timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  try {
    await Promise.race([context.close(), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 3: Replace both `context.close()` calls in the `close()` method**

Find the `try` block in `close()` that calls `context.close()`. Replace both occurrences:

```typescript
    try {
      const context = session.getContext();
      if (opts?.force) {
        try { await closeContextWithTimeout(context, CLOSE_TIMEOUT_MS); } catch { /* ignore */ }
      } else {
        await closeContextWithTimeout(context, CLOSE_TIMEOUT_MS);
      }
    } catch (err) {
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/manager.ts
git commit -m "fix: wrap context.close() with 10s timeout to prevent indefinite hang on unresponsive browser"
```

---

## Task 7: Verify full test suite on dev

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: All unit tests pass (98 original + new middleware tests).

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

Do not proceed to Task 8 if either step above fails.

---

## Task 8: Write AGENTS.md

**Files:**
- Create: `AGENTS.md` (project root)

By the time this task runs, all 5 critical bugs are fixed. AGENTS.md references the analysis report for historical context but does not list them as open issues.

- [ ] **Step 1: Create AGENTS.md at the project root**

```markdown
# AGENTS.md

This file is a constraint and guide for all contributors and AI sessions working in this repository. Read it before making any changes.

## Project Identity

Feather Browser is a minimalist, stability-first browser project. The current goal is a reliable headless browser core with a clean HTTP API. It is not an agent platform, a desktop application, or a production service yet.

## Current Phase

**Phase 3 — Browser Core Stabilization & UI Readiness** (active as of 2026-05-31)

Scope: session and page lifecycle, lifecycle event logging, API contract cleanup, and a minimal SSE event stream for a future UI. No agent runtime. No desktop shell.

- Scope definition: `docs/specs/phase-3-browser-stability-first-brief.md`
- Current progress: `PROGRESS.md`
- Full roadmap: `ROADMAP.md`

## Branch Rules

```
master  ← stable source of truth, never broken
  └─ dev  ← all Phase 3 work, bug fixes, new features
       └─ ui-playground  ← headed browser sandbox, never merges to master directly
```

- Target `dev` for all work. Never commit directly to `master`.
- AI-generated branches merge into `dev` for human review before graduating to `master`.
- `ui-playground` is a one-way sandbox. Experiments that graduate are cherry-picked to `dev` — not merged directly.

## Tech Stack

TypeScript 5.4 / Node.js 20 / Fastify 4.x / Playwright 1.50 / Zod 3.x / Vitest

Before implementing anything non-trivial: **research the official docs first**. APIs change between major versions. See `docs/tech-stack-guidelines.md` for the full guide and decision checklist.

## Change Classification

Every proposed change must be classified before implementation:

- **Core browser stability** — fix correctness, reliability, or safety issues in existing behavior
- **UI readiness** — infrastructure for a future UI (event stream, stable API contracts)
- **Future agent layer** — deferred; do not implement without explicit approval
- **Do not implement yet** — out of scope for Phase 3

When in doubt: write a doc, ask for approval. Do not add code, dependencies, or new top-level modules without explicit classification.

## Prior Security Audit

A codebase audit was performed on 2026-05-31. Findings and architecture verdict are in `docs/tech-stack-analysis-report.md`. The 5 critical bugs identified in that report have been fixed on `dev`. Consult the report before touching auth, session lifecycle, file locking, or browser evaluation code.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md — project constraints and guide for contributors and AI sessions"
```

---

## Task 9: Merge dev into master

- [ ] **Step 1: Switch to master**

```bash
git checkout master
```

- [ ] **Step 2: Merge dev with a merge commit**

```bash
git merge dev --no-ff -m "chore: merge dev — Phase 3 interface cleanup, 5 critical bug fixes, AGENTS.md"
```

`--no-ff` preserves the merge commit so history shows this was a deliberate promotion from dev.

- [ ] **Step 3: Push master**

```bash
git push origin master
```

- [ ] **Step 4: Switch back to dev**

```bash
git checkout dev
```

---

## Task 10: Create ui-playground branch

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Branch ui-playground off dev**

```bash
git checkout dev
git checkout -b ui-playground
```

Expected: `Switched to a new branch 'ui-playground'`

- [ ] **Step 2: Create the ui-playground directory**

```bash
mkdir -p ui-playground
```

- [ ] **Step 3: Add the browser profile directory to .gitignore**

Open `.gitignore` and add this line at the end:

```
ui-playground/.browser-profile/
```

- [ ] **Step 4: Commit the gitignore change**

```bash
git add .gitignore
git commit -m "chore: gitignore ui-playground browser profile directory"
```

---

## Task 11: Write ui-playground/launch.ts

**Files:**
- Create: `ui-playground/launch.ts`

- [ ] **Step 1: Create the launch script**

Create `ui-playground/launch.ts`:

```typescript
import { chromium } from "playwright";
import * as path from "path";

const PROFILE_DIR = path.join(__dirname, ".browser-profile");

async function main(): Promise<void> {
  console.log(`Launching headed browser — profile at ${PROFILE_DIR}`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: null,
  });

  const existingPages = context.pages();
  const page = existingPages.length > 0 ? existingPages[0] : await context.newPage();
  await page.goto("about:blank");

  console.log("Browser open. Close the window to exit.");

  context.on("close", () => {
    console.log("Browser closed. Exiting.");
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run it to verify**

```bash
npx ts-node ui-playground/launch.ts
```

Expected: A headed Chromium window opens with a blank page. Closing the window prints "Browser closed. Exiting." and the process exits with code 0.

- [ ] **Step 3: Commit**

```bash
git add ui-playground/launch.ts
git commit -m "feat(ui-playground): initial headed browser launcher with persistent profile"
```

---

## Task 12: Push all branches to remote

- [ ] **Step 1: Push ui-playground**

```bash
git push -u origin ui-playground
```

- [ ] **Step 2: Confirm final remote state**

```bash
git branch -a
```

Expected output contains exactly:
```
  master
* ui-playground
  dev
  remotes/origin/master
  remotes/origin/dev
  remotes/origin/ui-playground
```

No stale `claude/*` branches remaining.
