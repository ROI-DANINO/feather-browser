# Core Input Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `click`, `type`, `press`, and `wait` commands to Feather Core so it can act on pages (not just observe), including a streaming-safe "wait until text settles" primitive — the gating capability for the ChatGPT→Gmail HERO DEMO.

**Architecture:** Each command is a small `*Handler` class (mirroring `navigate`/`extract`) that resolves the Playwright `Page` via `session.getPage(pageId)` and calls a Playwright `Locator` method. A shared `resolveLocator(page, target)` turns a robust `Target` descriptor (role/text/placeholder/testid/css + positional `at`) into a single-element locator. A shared `withActionErrors` maps Playwright `TimeoutError` into precise coded errors. Routes add Zod schemas + 4 POST endpoints, matching the existing transport layer.

**Tech Stack:** TypeScript, Playwright 1.60.0, Fastify 5, Zod 3, Vitest 4.

**Spec:** `docs/specs/2026-06-06-core-input-commands-design.md`

**Conventions (verified in this repo):**
- Run one unit file: `npx vitest run --config vitest.config.ts <path>`
- Run one integration file: `npx vitest run --config vitest.integration.config.ts <path>`
- Full unit suite: `npm test` · Typecheck: `npm run typecheck`
- Coded errors are `Error` subclasses with `readonly code` (see `src/sessions/session.ts`).
- Handlers take a structurally-typed `IManager` and emit no events.

---

## Task 1: Types — `Target` + command I/O

**Files:**
- Modify: `src/sessions/types.ts` (append after the existing `SnapshotResult` interface, before `CommandContext`)

- [ ] **Step 1: Add the type definitions**

Append to `src/sessions/types.ts` (after the `SnapshotResult` interface):

```typescript
type TargetBy =
  | { by: "role"; role: string; name?: string; exact?: boolean }
  | { by: "text"; text: string; exact?: boolean }
  | { by: "placeholder"; text: string }
  | { by: "testid"; testId: string }
  | { by: "css"; selector: string };

/** How a command locates an element. `at` chooses which match when several match (default "first"). */
export type Target = TargetBy & { at?: "first" | "last" | number };

export interface ClickInput { sessionId: string; pageId?: string; target: Target; timeoutMs?: number; }
export interface ClickOutput { pageId: string; clicked: true; }

export interface TypeInput {
  sessionId: string; pageId?: string; target: Target; text: string;
  mode?: "fill" | "sequential"; delayMs?: number; timeoutMs?: number;
}
export interface TypeOutput { pageId: string; typed: true; }

export interface PressInput { sessionId: string; pageId?: string; target?: Target; key: string; timeoutMs?: number; }
export interface PressOutput { pageId: string; pressed: string; }

export type WaitInput =
  | { sessionId: string; pageId?: string; target: Target; until: "visible" | "hidden" | "attached" | "detached"; timeoutMs?: number }
  | { sessionId: string; pageId?: string; target: Target; until: "stable"; quietMs?: number; pollMs?: number; timeoutMs?: number };

export type WaitOutput =
  | { pageId: string; matched: true }
  | { pageId: string; settled: true; elapsedMs: number; text: string };
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sessions/types.ts
git commit -m "feat(core-input): add Target + click/type/press/wait I/O types"
```

---

## Task 2: Locator resolver + action-error mapper

**Files:**
- Create: `src/browser/locators.ts`
- Create: `src/commands/input-errors.ts`
- Test: `tests/unit/browser/locators.test.ts`
- Test: `tests/unit/commands/input-errors.test.ts`

- [ ] **Step 1: Write the failing resolver test**

Create `tests/unit/browser/locators.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { resolveLocator } from "../../../src/browser/locators";

const loc = {
  first: vi.fn().mockReturnValue("FIRST"),
  last: vi.fn().mockReturnValue("LAST"),
  nth: vi.fn().mockReturnValue("NTH"),
};
const page = {
  getByRole: vi.fn().mockReturnValue(loc),
  getByText: vi.fn().mockReturnValue(loc),
  getByPlaceholder: vi.fn().mockReturnValue(loc),
  getByTestId: vi.fn().mockReturnValue(loc),
  locator: vi.fn().mockReturnValue(loc),
};

describe("resolveLocator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("role with name maps to getByRole + first() by default", () => {
    const r = resolveLocator(page as any, { by: "role", role: "button", name: "Send" });
    expect(page.getByRole).toHaveBeenCalledWith("button", { name: "Send", exact: undefined });
    expect(loc.first).toHaveBeenCalled();
    expect(r).toBe("FIRST");
  });

  it("role without name passes undefined options", () => {
    resolveLocator(page as any, { by: "role", role: "button" });
    expect(page.getByRole).toHaveBeenCalledWith("button", undefined);
  });

  it("text maps to getByText with exact", () => {
    resolveLocator(page as any, { by: "text", text: "Hello", exact: true });
    expect(page.getByText).toHaveBeenCalledWith("Hello", { exact: true });
  });

  it("placeholder maps to getByPlaceholder", () => {
    resolveLocator(page as any, { by: "placeholder", text: "Message" });
    expect(page.getByPlaceholder).toHaveBeenCalledWith("Message");
  });

  it("testid maps to getByTestId", () => {
    resolveLocator(page as any, { by: "testid", testId: "send" });
    expect(page.getByTestId).toHaveBeenCalledWith("send");
  });

  it("css maps to locator", () => {
    resolveLocator(page as any, { by: "css", selector: "#x" });
    expect(page.locator).toHaveBeenCalledWith("#x");
  });

  it('at:"last" uses last()', () => {
    const r = resolveLocator(page as any, { by: "css", selector: ".x", at: "last" });
    expect(loc.last).toHaveBeenCalled();
    expect(r).toBe("LAST");
  });

  it("at:number uses nth(n)", () => {
    const r = resolveLocator(page as any, { by: "css", selector: ".x", at: 2 });
    expect(loc.nth).toHaveBeenCalledWith(2);
    expect(r).toBe("NTH");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/browser/locators.test.ts`
Expected: FAIL — cannot find module `../../../src/browser/locators`.

- [ ] **Step 3: Implement the resolver**

Create `src/browser/locators.ts`:

```typescript
import type { Page, Locator } from "playwright";
import type { Target } from "../sessions/types";

function base(page: Page, t: Target): Locator {
  switch (t.by) {
    case "role":
      return page.getByRole(
        t.role as Parameters<Page["getByRole"]>[0],
        t.name !== undefined ? { name: t.name, exact: t.exact } : undefined,
      );
    case "text":
      return page.getByText(t.text, { exact: t.exact });
    case "placeholder":
      return page.getByPlaceholder(t.text);
    case "testid":
      return page.getByTestId(t.testId);
    case "css":
      return page.locator(t.selector);
  }
}

/** Turn a Target into a single-element Locator (never strict-mode-throws). */
export function resolveLocator(page: Page, target: Target): Locator {
  const loc = base(page, target);
  const at = target.at ?? "first";
  if (at === "first") return loc.first();
  if (at === "last") return loc.last();
  return loc.nth(at);
}
```

- [ ] **Step 4: Run resolver test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/browser/locators.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Write the failing error-mapper test**

Create `tests/unit/commands/input-errors.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { errors } from "playwright";
import {
  withActionErrors,
  ElementNotFoundError,
  ElementNotActionableError,
} from "../../../src/commands/input-errors";

describe("withActionErrors", () => {
  it("passes through the result on success", async () => {
    const loc = { count: vi.fn() };
    await expect(withActionErrors(loc as any, "click", async () => "ok")).resolves.toBe("ok");
    expect(loc.count).not.toHaveBeenCalled();
  });

  it("maps TimeoutError + 0 matches to ElementNotFoundError (code ELEMENT_NOT_FOUND)", async () => {
    const loc = { count: vi.fn().mockResolvedValue(0) };
    const run = withActionErrors(loc as any, "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotFoundError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_FOUND");
  });

  it("maps TimeoutError + >0 matches to ElementNotActionableError (code ELEMENT_NOT_ACTIONABLE)", async () => {
    const loc = { count: vi.fn().mockResolvedValue(1) };
    const run = withActionErrors(loc as any, "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotActionableError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_ACTIONABLE");
  });

  it("rethrows non-timeout errors unchanged", async () => {
    const loc = { count: vi.fn() };
    await expect(
      withActionErrors(loc as any, "click", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/input-errors.test.ts`
Expected: FAIL — cannot find module `../../../src/commands/input-errors`.

- [ ] **Step 7: Implement the error mapper**

Create `src/commands/input-errors.ts`:

```typescript
import { errors } from "playwright";
import type { Locator } from "playwright";

export class ElementNotFoundError extends Error {
  readonly code = "ELEMENT_NOT_FOUND";
  constructor(message: string) { super(message); this.name = "ElementNotFoundError"; }
}

export class ElementNotActionableError extends Error {
  readonly code = "ELEMENT_NOT_ACTIONABLE";
  constructor(message: string) { super(message); this.name = "ElementNotActionableError"; }
}

export class WaitTimeoutError extends Error {
  readonly code = "WAIT_TIMEOUT";
  constructor(message: string) { super(message); this.name = "WaitTimeoutError"; }
}

/** Run a Playwright action; convert TimeoutError into a precise coded error. */
export async function withActionErrors<T>(loc: Locator, what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      const count = await loc.count().catch(() => 0);
      if (count === 0) {
        throw new ElementNotFoundError(`No element matched the target for "${what}".`);
      }
      throw new ElementNotActionableError(
        `Target for "${what}" matched ${count} element(s) but the action timed out (covered, disabled, or off-screen?).`,
      );
    }
    throw err;
  }
}
```

- [ ] **Step 8: Run error-mapper test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/input-errors.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Typecheck + commit**

```bash
npm run typecheck
git add src/browser/locators.ts src/commands/input-errors.ts tests/unit/browser/locators.test.ts tests/unit/commands/input-errors.test.ts
git commit -m "feat(core-input): add resolveLocator + withActionErrors (robust targeting + coded errors)"
```

---

## Task 3: `click` command

**Files:**
- Create: `src/commands/click.ts`
- Test: `tests/unit/commands/click.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/commands/click.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ClickHandler } from "../../../src/commands/click";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = { click: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("ClickHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("resolves the target and clicks with the default timeout", async () => {
    const result = await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "role", role: "button", name: "Send" } }, ctx);
    expect(resolveLocator).toHaveBeenCalledWith(mockPage, { by: "role", role: "button", name: "Send" });
    expect(fakeLoc.click).toHaveBeenCalledWith({ timeout: 15000 });
    expect(result).toEqual({ pageId: "page_001", clicked: true });
  });

  it("passes a custom timeout and pageId", async () => {
    await new ClickHandler(mockManager as any).execute(
      { sessionId: "ses", pageId: "page_002", target: { by: "css", selector: "#x" }, timeoutMs: 3000 }, ctx);
    expect(mockSession.getPage).toHaveBeenCalledWith("page_002");
    expect(fakeLoc.click).toHaveBeenCalledWith({ timeout: 3000 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/click.test.ts`
Expected: FAIL — cannot find module `../../../src/commands/click`.

- [ ] **Step 3: Implement `click`**

Create `src/commands/click.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    const loc = resolveLocator(page, target);
    await withActionErrors(loc, "click", () => loc.click({ timeout: timeoutMs ?? 15000 }));
    return { pageId: resolvedPageId, clicked: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/click.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/click.ts tests/unit/commands/click.test.ts
git commit -m "feat(core-input): add click command"
```

---

## Task 4: `type` command

**Files:**
- Create: `src/commands/type.ts`
- Test: `tests/unit/commands/type.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/commands/type.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TypeHandler } from "../../../src/commands/type";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = {
  fill: vi.fn().mockResolvedValue(undefined),
  pressSequentially: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(1),
};
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("TypeHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("uses fill by default with the default timeout", async () => {
    const result = await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "placeholder", text: "Message" }, text: "hello world" }, ctx);
    expect(fakeLoc.fill).toHaveBeenCalledWith("hello world", { timeout: 15000 });
    expect(fakeLoc.pressSequentially).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", typed: true });
  });

  it('uses pressSequentially with delay when mode is "sequential"', async () => {
    await new TypeHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "sequential", delayMs: 20, timeoutMs: 5000 }, ctx);
    expect(fakeLoc.pressSequentially).toHaveBeenCalledWith("hi", { delay: 20, timeout: 5000 });
    expect(fakeLoc.fill).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/type.test.ts`
Expected: FAIL — cannot find module `../../../src/commands/type`.

- [ ] **Step 3: Implement `type`**

Create `src/commands/type.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class TypeHandler implements CommandHandler<TypeInput, TypeOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: TypeInput, _ctx: CommandContext): Promise<TypeOutput> {
    const { sessionId, pageId, target, text, mode, delayMs, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    const loc = resolveLocator(page, target);
    const timeout = timeoutMs ?? 15000;
    await withActionErrors(loc, "type", () =>
      mode === "sequential"
        ? loc.pressSequentially(text, { delay: delayMs, timeout })
        : loc.fill(text, { timeout }),
    );
    return { pageId: resolvedPageId, typed: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/type.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/type.ts tests/unit/commands/type.test.ts
git commit -m "feat(core-input): add type command (fill / sequential)"
```

---

## Task 5: `press` command

**Files:**
- Create: `src/commands/press.ts`
- Test: `tests/unit/commands/press.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/commands/press.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PressHandler } from "../../../src/commands/press";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

const fakeLoc = { press: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
const keyboard = { press: vi.fn().mockResolvedValue(undefined) };
const mockPage = { keyboard };
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("PressHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveLocator as any).mockReturnValue(fakeLoc);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
  });

  it("presses on the resolved target when a target is given", async () => {
    const result = await new PressHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#inp" }, key: "Enter" }, ctx);
    expect(fakeLoc.press).toHaveBeenCalledWith("Enter", { timeout: 15000 });
    expect(keyboard.press).not.toHaveBeenCalled();
    expect(result).toEqual({ pageId: "page_001", pressed: "Enter" });
  });

  it("presses on the focused element via keyboard when no target is given", async () => {
    await new PressHandler(mockManager as any).execute({ sessionId: "ses", key: "Enter" }, ctx);
    expect(keyboard.press).toHaveBeenCalledWith("Enter");
    expect(fakeLoc.press).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/press.test.ts`
Expected: FAIL — cannot find module `../../../src/commands/press`.

- [ ] **Step 3: Implement `press`**

Create `src/commands/press.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { PressInput, PressOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

export class PressHandler implements CommandHandler<PressInput, PressOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: PressInput, _ctx: CommandContext): Promise<PressOutput> {
    const { sessionId, pageId, target, key, timeoutMs } = input;
    const { pageId: resolvedPageId, page } = this.manager.get(sessionId).getPage(pageId);
    if (target) {
      const loc = resolveLocator(page, target);
      await withActionErrors(loc, "press", () => loc.press(key, { timeout: timeoutMs ?? 15000 }));
    } else {
      await page.keyboard.press(key);
    }
    return { pageId: resolvedPageId, pressed: key };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/press.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/commands/press.ts tests/unit/commands/press.test.ts
git commit -m "feat(core-input): add press command"
```

---

## Task 6: `wait` command (both flavours)

**Files:**
- Create: `src/commands/wait.ts`
- Test: `tests/unit/commands/wait.test.ts`

Note: the stable-poll test uses **real timers with tiny intervals** (a few ms) to avoid fake-timer/await interleaving fragility; each test completes in well under a second.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/commands/wait.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { errors } from "playwright";
import { WaitHandler } from "../../../src/commands/wait";
import { resolveLocator } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveLocator: vi.fn() }));

let fakeLoc: any;
const mockPage = {};
const mockSession = { getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }) };
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

beforeEach(() => {
  vi.clearAllMocks();
  fakeLoc = {
    waitFor: vi.fn().mockResolvedValue(undefined),
    textContent: vi.fn(),
  };
  (resolveLocator as any).mockReturnValue(fakeLoc);
  mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
  mockManager.get.mockReturnValue(mockSession);
});

describe("WaitHandler — flavour A (element state)", () => {
  it("calls waitFor with the requested state and returns matched:true", async () => {
    const result = await new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#x" }, until: "visible", timeoutMs: 4000 }, ctx);
    expect(fakeLoc.waitFor).toHaveBeenCalledWith({ state: "visible", timeout: 4000 });
    expect(result).toEqual({ pageId: "page_001", matched: true });
  });

  it("maps a Playwright TimeoutError to WAIT_TIMEOUT", async () => {
    fakeLoc.waitFor.mockRejectedValueOnce(new errors.TimeoutError("nope"));
    const run = new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#x" }, until: "visible" }, ctx);
    await expect(run.catch((e) => e.code)).resolves.toBe("WAIT_TIMEOUT");
  });
});

describe("WaitHandler — flavour B (stable)", () => {
  it("does not settle on the empty window, then settles with the final text", async () => {
    // attached first, then: empty, empty, growing, then constant
    const seq = ["", "", "hel", "hello", "hello", "hello", "hello", "hello"];
    let i = 0;
    fakeLoc.textContent.mockImplementation(async () => seq[Math.min(i++, seq.length - 1)]);
    const result = (await new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 20, pollMs: 5, timeoutMs: 5000 },
      ctx)) as { settled: true; text: string; elapsedMs: number };
    expect(fakeLoc.waitFor).toHaveBeenCalledWith({ state: "attached", timeout: 5000 });
    expect(result.settled).toBe(true);
    expect(result.text).toBe("hello");
    expect(result.elapsedMs).toBeGreaterThanOrEqual(20);
  });

  it("throws WAIT_TIMEOUT when text never stabilises", async () => {
    let n = 0;
    fakeLoc.textContent.mockImplementation(async () => `growing-${n++}`); // always changing
    const run = new WaitHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 50, pollMs: 5, timeoutMs: 60 },
      ctx);
    await expect(run.catch((e) => e.code)).resolves.toBe("WAIT_TIMEOUT");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/wait.test.ts`
Expected: FAIL — cannot find module `../../../src/commands/wait`.

- [ ] **Step 3: Implement `wait`**

Create `src/commands/wait.ts`:

```typescript
import { errors } from "playwright";
import type { CommandHandler, CommandContext } from "./handler";
import type { WaitInput, WaitOutput } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { WaitTimeoutError } from "./input-errors";

interface IManager {
  get(sessionId: string): { getPage(pageId?: string): { pageId: string; page: import("playwright").Page } };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class WaitHandler implements CommandHandler<WaitInput, WaitOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: WaitInput, _ctx: CommandContext): Promise<WaitOutput> {
    const { pageId: resolvedPageId, page } = this.manager.get(input.sessionId).getPage(input.pageId);
    const loc = resolveLocator(page, input.target);

    if (input.until === "stable") {
      const quietMs = input.quietMs ?? 1500;
      const pollMs = input.pollMs ?? 250;
      const timeoutMs = input.timeoutMs ?? 30000;
      const startedAt = Date.now();
      await loc.waitFor({ state: "attached", timeout: timeoutMs });

      let lastValue = "";
      let lastChangedAt = Date.now();
      for (;;) {
        const now = Date.now();
        if (now - startedAt > timeoutMs) {
          throw new WaitTimeoutError(`Element text did not settle within ${timeoutMs}ms.`);
        }
        let current: string;
        try {
          current = (await loc.textContent({ timeout: 1000 })) ?? "";
        } catch {
          current = lastValue; // transient read failure (e.g. mid-re-render) → treat as unchanged
        }
        if (current !== lastValue) {
          lastValue = current;
          lastChangedAt = now;
        }
        if (current.trim().length > 0 && now - lastChangedAt >= quietMs) {
          return { pageId: resolvedPageId, settled: true, elapsedMs: now - startedAt, text: current.trim().slice(0, 20000) };
        }
        await sleep(pollMs);
      }
    }

    // flavour A — element state
    try {
      await loc.waitFor({ state: input.until, timeout: input.timeoutMs ?? 15000 });
    } catch (err) {
      if (err instanceof errors.TimeoutError) {
        throw new WaitTimeoutError(`Condition "${input.until}" not met within ${input.timeoutMs ?? 15000}ms.`);
      }
      throw err;
    }
    return { pageId: resolvedPageId, matched: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --config vitest.config.ts tests/unit/commands/wait.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add src/commands/wait.ts tests/unit/commands/wait.test.ts
git commit -m "feat(core-input): add wait command (element-state + streaming-stable)"
```

---

## Task 7: Failing integration test (real Chromium)

This is the route-layer's test, written first (it will 404 until Task 8 wires routes).

**Files:**
- Create: `tests/integration/input-commands.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/input-commands.integration.test.ts`:

```typescript
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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-input-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
  const launched = await api("POST", "/v1/sessions", {
    workspaceId: "input-ws",
    profile: { kind: "disposable" },
    browserMode: "chromium-new-headless",
  });
  sessionId = launched.body.data.sessionId;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

async function goto(html: string) {
  const { status } = await api("POST", `/v1/sessions/${sessionId}/navigate`, { url: dataUrl(html) });
  expect(status).toBe(200);
}

async function readResult() {
  const { body } = await api("POST", `/v1/sessions/${sessionId}/extract`, {
    recipe: { fields: { r: { selector: "#result", type: "text" } } },
  });
  return body.data.r as string | null;
}

describe("Input commands (real Chromium)", () => {
  it("type by placeholder + click by role/name updates the page", async () => {
    await goto(`<input placeholder="Message" id="m">
      <button onclick="document.getElementById('result').textContent=document.getElementById('m').value">Send</button>
      <div id="result"></div>`);
    expect((await api("POST", `/v1/sessions/${sessionId}/type`, {
      target: { by: "placeholder", text: "Message" }, text: "hello world",
    })).status).toBe(200);
    expect((await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "role", role: "button", name: "Send" },
    })).status).toBe(200);
    expect(await readResult()).toBe("hello world");
  });

  it("type fill works on a contenteditable element", async () => {
    await goto(`<div contenteditable id="ed" oninput="document.getElementById('result').textContent=this.textContent"></div>
      <div id="result"></div>`);
    expect((await api("POST", `/v1/sessions/${sessionId}/type`, {
      target: { by: "css", selector: "#ed" }, text: "edited text",
    })).status).toBe(200);
    expect(await readResult()).toBe("edited text");
  });

  it('at:"last" targets the second of two matching elements', async () => {
    await goto(`<button onclick="document.getElementById('result').textContent='0'">Item</button>
      <button onclick="document.getElementById('result').textContent='1'">Item</button>
      <div id="result"></div>`);
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "text", text: "Item", at: "last" } });
    expect(await readResult()).toBe("1");
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "text", text: "Item", at: "first" } });
    expect(await readResult()).toBe("0");
  });

  it("press Enter on a target fires the keydown handler", async () => {
    await goto(`<input id="i" onkeydown="if(event.key==='Enter')document.getElementById('result').textContent='entered'">
      <div id="result"></div>`);
    await api("POST", `/v1/sessions/${sessionId}/type`, { target: { by: "css", selector: "#i" }, text: "x" });
    await api("POST", `/v1/sessions/${sessionId}/press`, { target: { by: "css", selector: "#i" }, key: "Enter" });
    expect(await readResult()).toBe("entered");
  });

  it('wait until:"stable" waits past the empty window and captures the full streamed text', async () => {
    await goto(`<button onclick="start()">Go</button><div id="answer"></div>
      <script>
        function start(){
          var a=document.getElementById('answer');
          setTimeout(function(){
            var words=['hello','streamed','world','done']; var i=0;
            var iv=setInterval(function(){ a.textContent += (i>0?' ':'')+words[i]; i++; if(i>=words.length) clearInterval(iv); }, 200);
          }, 400);
        }
      </script>`);
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "role", role: "button", name: "Go" } });
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/wait`, {
      target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 700, pollMs: 100, timeoutMs: 15000,
    });
    expect(status).toBe(200);
    expect(body.data.settled).toBe(true);
    expect(body.data.text).toBe("hello streamed world done");
    expect(body.data.elapsedMs).toBeGreaterThanOrEqual(900); // proves it didn't settle on the empty node / mid-stream
  });

  it("click on a missing target returns 404 ELEMENT_NOT_FOUND", async () => {
    await goto(`<div>nothing to click</div>`);
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "css", selector: "#does-not-exist" }, timeoutMs: 1000,
    });
    expect(status).toBe(404);
    expect(body.error.code).toBe("ELEMENT_NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/input-commands.integration.test.ts`
Expected: FAIL — the new endpoints 404 (routes not wired yet), so the assertions fail.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/integration/input-commands.integration.test.ts
git commit -m "test(core-input): failing real-Chromium integration test for input commands"
```

---

## Task 8: Wire routes + error mapping

**Files:**
- Modify: `src/transport/routes.ts`

- [ ] **Step 1: Add handler imports**

In `src/transport/routes.ts`, after the existing command imports (after the `OpenTabHandler` import line), add:

```typescript
import { ClickHandler } from "../commands/click";
import { TypeHandler } from "../commands/type";
import { PressHandler } from "../commands/press";
import { WaitHandler } from "../commands/wait";
```

- [ ] **Step 2: Add the Zod schemas**

In `src/transport/routes.ts`, after the existing `ExtractSchema` definition, add:

```typescript
const atField = z.union([z.enum(["first", "last"]), z.number().int().nonnegative()]).optional();
const TargetSchema = z.discriminatedUnion("by", [
  z.object({ by: z.literal("role"), role: z.string().min(1), name: z.string().optional(), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("text"), text: z.string().min(1), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("placeholder"), text: z.string().min(1), at: atField }),
  z.object({ by: z.literal("testid"), testId: z.string().min(1), at: atField }),
  z.object({ by: z.literal("css"), selector: z.string().min(1), at: atField }),
]);

const ClickSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema,
  timeoutMs: z.number().int().positive().optional(),
});

const TypeSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema,
  text: z.string(),
  mode: z.enum(["fill", "sequential"]).optional(),
  delayMs: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

const PressSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema.optional(),
  key: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
});

const WaitSchema = z.union([
  z.object({
    pageId: z.string().optional(),
    target: TargetSchema,
    until: z.enum(["visible", "hidden", "attached", "detached"]),
    timeoutMs: z.number().int().positive().optional(),
  }),
  z.object({
    pageId: z.string().optional(),
    target: TargetSchema,
    until: z.literal("stable"),
    quietMs: z.number().int().positive().optional(),
    pollMs: z.number().int().positive().optional(),
    timeoutMs: z.number().int().positive().optional(),
  }),
]);
```

- [ ] **Step 3: Add the new error codes**

In `src/transport/routes.ts`, extend the `ERROR_STATUS` map with three entries:

```typescript
const ERROR_STATUS: Record<string, number> = {
  SESSION_NOT_FOUND: 404,
  PROFILE_LOCKED: 409,
  SESSION_NOT_RUNNING: 409,
  PAGE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  ELEMENT_NOT_FOUND: 404,
  ELEMENT_NOT_ACTIONABLE: 409,
  WAIT_TIMEOUT: 408,
};
```

- [ ] **Step 4: Instantiate the handlers**

In `registerRoutes`, after the `const openTabHandler = new OpenTabHandler(manager);` line, add:

```typescript
  const clickHandler = new ClickHandler(manager);
  const typeHandler = new TypeHandler(manager);
  const pressHandler = new PressHandler(manager);
  const waitHandler = new WaitHandler(manager);
```

- [ ] **Step 5: Add the four routes**

In `registerRoutes`, after the `extract` route block and before the `screenshot` route block, add:

```typescript
  app.post("/v1/sessions/:sessionId/click", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ClickSchema.parse(request.body);
      const result = await clickHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/type", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = TypeSchema.parse(request.body);
      const result = await typeHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/press", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = PressSchema.parse(request.body);
      const result = await pressHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/wait", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = WaitSchema.parse(request.body);
      const result = await waitHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: exit 0. (If TypeScript flags the `{ sessionId, ...input }` spread for the `wait` union, cast it: `waitHandler.execute({ sessionId, ...input } as WaitInput, ...)` and add `import type { WaitInput } from "../sessions/types";` — but the union members all carry the same `sessionId`/`pageId` shape, so this should compile as-is.)

- [ ] **Step 7: Run the integration test to verify it passes**

Run: `npx vitest run --config vitest.integration.config.ts tests/integration/input-commands.integration.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add src/transport/routes.ts
git commit -m "feat(core-input): wire click/type/press/wait routes + coded error statuses"
```

---

## Task 9: Document the new commands

**Files:**
- Modify: `docs/api-reference.md`

- [ ] **Step 1: Read the existing extract/screenshot sections** to match table formatting.

Run: `sed -n '160,320p' docs/api-reference.md`
Expected: see the `navigate`/`snapshot`/`extract` endpoint sections and their request/response/error tables.

- [ ] **Step 2: Insert the new section**

Insert the following after the `extract` endpoint section and before the `screenshot` endpoint section in `docs/api-reference.md`:

```markdown
### Input (acting on a page)

All four commands locate elements with a shared **Target** object:

| Field | Type | Required | Description |
|---|---|---|---|
| `by` | `"role"` \| `"text"` \| `"placeholder"` \| `"testid"` \| `"css"` | Yes | Locator strategy |
| `role` | string | Yes (if `by="role"`) | ARIA role, e.g. `"button"` |
| `name` | string | No (`by="role"`) | Accessible name to match |
| `text` | string | Yes (if `by="text"` or `"placeholder"`) | Visible text / placeholder text |
| `testId` | string | Yes (if `by="testid"`) | Value of the `data-testid` attribute |
| `selector` | string | Yes (if `by="css"`) | CSS selector |
| `exact` | boolean | No (`role`/`text`) | Exact (not substring) match |
| `at` | `"first"` \| `"last"` \| number | No | Which match to use when several match (default `"first"`) |

#### `POST /v1/sessions/:sessionId/click` — Click an element

| Field | Type | Required | Description |
|---|---|---|---|
| `target` | Target | Yes | Element to click |
| `pageId` | string | No | Page to act on (defaults to the active page) |
| `timeoutMs` | number | No | Action timeout (default 15000) |

Response `data`: `{ "pageId": string, "clicked": true }`

#### `POST /v1/sessions/:sessionId/type` — Type text into a field

| Field | Type | Required | Description |
|---|---|---|---|
| `target` | Target | Yes | Field to type into (`<input>`, `<textarea>`, or `[contenteditable]`) |
| `text` | string | Yes | Text to enter |
| `mode` | `"fill"` \| `"sequential"` | No | `fill` (default) clears + sets; `sequential` types key-by-key (for editors that ignore `fill`) |
| `delayMs` | number | No | Per-keystroke delay (sequential only) |
| `pageId` | string | No | Page to act on |
| `timeoutMs` | number | No | Action timeout (default 15000) |

Response `data`: `{ "pageId": string, "typed": true }`

#### `POST /v1/sessions/:sessionId/press` — Press a key

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | string | Yes | Playwright key, e.g. `"Enter"`, `"Tab"`, `"Control+A"` |
| `target` | Target | No | Element to focus first; omit to press on the focused element |
| `pageId` | string | No | Page to act on |
| `timeoutMs` | number | No | Action timeout (default 15000) |

Response `data`: `{ "pageId": string, "pressed": string }`

#### `POST /v1/sessions/:sessionId/wait` — Wait for an element or for text to settle

| Field | Type | Required | Description |
|---|---|---|---|
| `target` | Target | Yes | Element to watch |
| `until` | `"visible"` \| `"hidden"` \| `"attached"` \| `"detached"` \| `"stable"` | Yes | Condition to wait for |
| `quietMs` | number | No | (`stable`) settle once text is unchanged this long (default 1500) |
| `pollMs` | number | No | (`stable`) poll interval (default 250) |
| `pageId` | string | No | Page to act on |
| `timeoutMs` | number | No | Overall timeout (default 15000; `stable` default 30000) |

Response `data`: `{ "pageId": string, "matched": true }` for element states, or
`{ "pageId": string, "settled": true, "elapsedMs": number, "text": string }` for `until="stable"`.

**Errors (all four commands)**

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body / target fails schema validation |
| 404 | `ELEMENT_NOT_FOUND` | No element matched the target |
| 408 | `WAIT_TIMEOUT` | `wait` condition not met within the timeout |
| 409 | `ELEMENT_NOT_ACTIONABLE` | Target matched but the action timed out (covered, disabled, off-screen) |
```

- [ ] **Step 3: Commit**

```bash
git add docs/api-reference.md
git commit -m "docs(core-input): document click/type/press/wait + Target model"
```

---

## Task 10: Final verification gate

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite**

Run: `npm test`
Expected: all unit tests pass (existing 184 + the new locators/input-errors/click/type/press/wait tests).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 3: Full integration suite (real Chromium)**

Run: `npm run test:integration`
Expected: all integration tests pass, including the 6 in `input-commands.integration.test.ts`.

- [ ] **Step 4: Confirm no stray changes**

Run: `git status`
Expected: clean tree (everything committed).

- [ ] **Step 5: Record the milestone in the journal**

Append one line to `journal/log.md` (use today's date) summarising: Core input commands (`click`/`type`/`press`/`wait`) shipped on `dev` — Feather goes observe-only → act; spec + plan refs; test counts. Then update `journal/context/active.md`'s "Now"/tasks checklist to mark the gating Core work done and point to the next HERO DEMO step (warm ChatGPT session). Commit:

```bash
git add journal/log.md journal/context/active.md journal/ops/tasks.md
git commit -m "ops(core-input): Core input commands shipped — observe-only -> act; next = warm ChatGPT"
```

---

## Self-review notes (already reconciled)

- **Spec coverage:** Target model + `at` (Task 1, 2, 8); `resolveLocator` (Task 2); `withActionErrors` + 3 coded errors (Task 2, 8); `click`/`type`(fill+sequential)/`press`(target+focused)/`wait`(A+stable) (Tasks 3–6); routes + schemas + error statuses (Task 8); contenteditable, `at:"last"`, empty-then-stream, 404 path integration proofs (Task 7); docs (Task 9); no-event-emission consistency (handlers as written); security invariant (no body logging) holds — no logging is introduced anywhere in this plan.
- **Type consistency:** `Target`, `ClickInput/Output`, `TypeInput/Output`, `PressInput/Output`, `WaitInput/Output` defined once in Task 1 and imported everywhere; `resolveLocator`/`withActionErrors`/`WaitTimeoutError` names match across tasks.
- **Defaults:** 15000ms actions / 30000ms stable, applied in handlers (Tasks 3–6) and documented (Task 9).
