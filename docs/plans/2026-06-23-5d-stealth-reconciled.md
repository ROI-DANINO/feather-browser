# 5d Stealth Stack (Reconciled, Secure-Only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add always-on fingerprint-cleanliness *checks* (verify, never spoof) plus human typing cadence to Feather sessions, secure-only, so agent browsing stays clean on bot-detecting sites without sacrificing the lightweight, local-first, honest posture.

**Architecture:** A single new pure-function module `src/browser/stealth.ts` (no class; mirrors the function-handler style). Two always-on consistency checks (environment, fingerprint) run best-effort on the headed-CDP launch path and surface as `SessionRecord.stealthWarnings`. One behavioral change: the `type` handler defaults to sequential typing with per-call jitter unless the caller overrides `mode`/`delayMs` — routed through a new `Actionable.typeSequentially` seam so it reaches ref targets (the main agent path) as well as selector targets. No mode enum, no mode-switch endpoint, no session mode field; Identity's `stealthPolicy` slot stays dormant.

**Tech Stack:** TypeScript 5.4, Playwright 1.60 (CDP-attached Chromium), Vitest. No new dependencies.

**Spec:** `docs/specs/2026-06-23-5d-stealth-reconciled-design.md` (rev 3).

## Global Constraints

- **Secure-only.** No `secure`/`assisted` enum, no `setStealthMode`, no `POST /v1/sessions/:id/stealth`, no launch-time `stealth` param.
- **Verify, never spoof.** Checks emit warnings; they never patch, inject, or fabricate fingerprint values. **No font guard. No canvas noise.**
- **Never block launch.** The launch-time checks are best-effort (`.catch`) and must never throw out of `launch()`.
- **Per-call override wins.** Explicit `type` `mode` / `delayMs` always take precedence over the secure default.
- **Checks run on the `chromium-headed-cdp` path only** (the real Cookie-Mine path). Headless/CI is SwiftShader by design and is not an anti-detection environment.
- **Target the `dev` branch.** Commit after every task. No new top-level modules or dependencies.

---

## File Structure

**Create:**
- `src/browser/stealth.ts` — all stealth logic (checks, classify, jitter, L1 seam comment).
- `tests/unit/browser/stealth.test.ts` — unit tests for the above.

**Modify:**
- `src/browser/locators.ts` — add `typeSequentially` to `Actionable`; implement per backend in `resolveActionable`.
- `tests/unit/resolve-actionable.test.ts` — cover the new seam for both backends.
- `src/commands/type.ts` — secure-by-default cadence, routed through `resolveActionable`.
- `tests/unit/commands/type.test.ts` — flip the default-behavior test; add override tests.
- `src/sessions/types.ts` — `stealthWarnings` on `SessionRecord`; `setStealthWarnings` on `ISession`.
- `src/sessions/session.ts` — store + expose `stealthWarnings` in `toRecord()`.
- `src/sessions/manager.ts` — run the two checks on the headed-CDP path; store warnings; log site class.
- `scripts/spikes/anti-detection-probe.ts` — hard assertions + opt-in secure-mode report.

**Integration test:**
- `tests/integration/stealth.integration.test.ts` — real headed-CDP launch asserts `stealthWarnings` shape.

---

## Task 1: Stealth module core — classifySite, jitterDelayMs, L1 seam

**Files:**
- Create: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

**Interfaces:**
- Produces: `classifySite(url: string): "standard" | "tier-c"`; `jitterDelayMs(): number`; `interface StealthCheckResult { ok: boolean; warnings: string[] }`; `type SiteClass`.

- [ ] **Step 1: Audit the codebase for CDP-runtime-leaking listeners (Layer 1)**

Run and read every hit:

```bash
grep -rn "\.on(\"console\"\|\.on('console'\|\.on(\"pageerror\"\|\.on('pageerror'" src/
```

Expected: no hits on the real session path (`manager.ts` attaches only `page`/`close`/`framenavigated`). If `src/debug/capture.ts` attaches console/pageerror, note it in the Step 6 commit message — that path is debug-only/opt-in and must not wire onto a non-debug session.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/browser/stealth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { classifySite, jitterDelayMs } from "../../../src/browser/stealth";

describe("classifySite (observability only)", () => {
  it("labels known bot-detecting apex domains tier-c", () => {
    expect(classifySite("https://linkedin.com/feed")).toBe("tier-c");
    expect(classifySite("https://www.instagram.com/")).toBe("tier-c");
  });
  it("labels unknown sites standard", () => {
    expect(classifySite("https://example.com/")).toBe("standard");
  });
  it("does not match a name appearing only in the path", () => {
    expect(classifySite("https://example.com/linkedin.com")).toBe("standard");
  });
  it("returns standard for an unparseable URL", () => {
    expect(classifySite("not a url")).toBe("standard");
  });
});

describe("jitterDelayMs", () => {
  it("always returns a value within [50,150]", () => {
    for (let i = 0; i < 500; i++) {
      const d = jitterDelayMs();
      expect(d).toBeGreaterThanOrEqual(50);
      expect(d).toBeLessThanOrEqual(150);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — module not found / exports missing.

- [ ] **Step 4: Write minimal implementation**

Create `src/browser/stealth.ts`:

```typescript
import type { Page } from "playwright";

export type SiteClass = "standard" | "tier-c";

export interface StealthCheckResult {
  ok: boolean;
  warnings: string[];
}

/**
 * Layer 1 — CDP surface minimization is a "don't enable it" guarantee, not positive code.
 * The detection tell is Playwright auto-sending Runtime.enable when console/pageerror listeners
 * attach. Feather's real session path attaches none (audited; see plan Task 1). Do not add
 * page.on("console") / page.on("pageerror") on the session path. Enforcement lives in the
 * self-test (anti-detection probe) asserting Runtime.enable is absent on a clean session open.
 */

/** OBSERVABILITY ONLY — labels a URL's known bot-detection risk for logging. Never a control-flow gate. */
const TIER_C_DOMAINS = ["linkedin.com", "instagram.com", "facebook.com"];
export function classifySite(url: string): SiteClass {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "standard";
  }
  return TIER_C_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`)) ? "tier-c" : "standard";
}

const MIN_JITTER_MS = 50;
const MAX_JITTER_MS = 150;

/**
 * A human-like per-keystroke delay in [50,150] ms. Called once per `type` call (uniform delay
 * across that call's keystrokes; varies call-to-call). Per-keystroke statistical variation is the
 * deferred kinematic spike — this is the honest v1 cadence.
 */
export function jitterDelayMs(): number {
  return MIN_JITTER_MS + Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(5d-stealth): module core — classifySite, jitter, Layer-1 seam + CDP audit"
```

---

## Task 2: Layer 4 — fingerprint consistency check (no font guard)

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

**Interfaces:**
- Consumes: `StealthCheckResult` (Task 1).
- Produces: `applyFingerprintCheck(page: Page): Promise<StealthCheckResult>`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { vi } from "vitest";
import { applyFingerprintCheck } from "../../../src/browser/stealth";

describe("applyFingerprintCheck", () => {
  it("passes when a real GPU renderer is reported", async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Intel)",
        webglRenderer: "ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics, OpenGL 4.6)",
      }),
    } as any;
    const res = await applyFingerprintCheck(page);
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });

  it("warns when SwiftShader (software/headless) renderer is detected", async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Google)",
        webglRenderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
      }),
    } as any;
    const res = await applyFingerprintCheck(page);
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/swiftshader/i);
  });

  it("does NOT call addInitScript (no font guard / no spoofing)", async () => {
    const page = {
      addInitScript: vi.fn(),
      evaluate: vi.fn().mockResolvedValue({ webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel)" }),
    } as any;
    await applyFingerprintCheck(page);
    expect(page.addInitScript).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `applyFingerprintCheck` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/browser/stealth.ts`:

```typescript
/**
 * Layer 4 — fingerprint consistency CHECK. No spoofing, no canvas noise, NO font guard.
 * Real Chromium on a real GPU already has a genuine, stable fingerprint; detectors look for
 * *tampering* first. This verifies the real WebGL renderer is intact and flags SwiftShader,
 * which means the headless GPU leaked through and the session is already detectable.
 */
export async function applyFingerprintCheck(page: Page): Promise<StealthCheckResult> {
  const gpu = (await page.evaluate(() => {
    try {
      const c = document.createElement("canvas");
      const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
      return {
        webglVendor: dbg ? String(gl!.getParameter(dbg.UNMASKED_VENDOR_WEBGL)) : "no-ext",
        webglRenderer: dbg ? String(gl!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "no-ext",
      };
    } catch (e) {
      return { webglVendor: "err", webglRenderer: String(e) };
    }
  })) as { webglVendor: string; webglRenderer: string };

  const warnings: string[] = [];
  if (/swiftshader/i.test(gpu.webglRenderer)) {
    warnings.push(`SwiftShader renderer detected (${gpu.webglRenderer}) — headless GPU leaked through; session is detectable`);
  }
  if (gpu.webglRenderer === "no-ext" || gpu.webglVendor === "err") {
    warnings.push("WebGL renderer info unavailable — possible hardened/atypical GPU context");
  }
  return { ok: warnings.length === 0, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(5d-stealth): Layer 4 fingerprint consistency check (no font guard)"
```

---

## Task 3: Layer 2 — environment consistency check

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

**Interfaces:**
- Consumes: `StealthCheckResult` (Task 1).
- Produces: `applyStealthEnvironment(page: Page): Promise<StealthCheckResult>`.

- [ ] **Step 1: Write the failing test**

Append:

```typescript
import { applyStealthEnvironment } from "../../../src/browser/stealth";

function envPage(values: Record<string, unknown>) {
  return { evaluate: vi.fn().mockResolvedValue(values) } as any;
}

describe("applyStealthEnvironment", () => {
  const consistent = {
    innerWidth: 1280, innerHeight: 800, screenWidth: 1440, screenHeight: 900,
    devicePixelRatio: 2, languages: ["en-US", "en"], timezone: "Asia/Jerusalem",
  };
  it("ok with no warnings when consistent", async () => {
    const res = await applyStealthEnvironment(envPage(consistent));
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });
  it("warns when viewport exceeds screen", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, innerWidth: 2000 }));
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/viewport.*screen/i);
  });
  it("warns when languages is empty", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, languages: [] }));
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/languages/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `applyStealthEnvironment` not exported.

- [ ] **Step 3: Write minimal implementation**

Append:

```typescript
/**
 * Layer 2 — environment consistency CHECK (never spoof). Spoofing locale/timezone without a
 * matching geo-proxy introduces an Accept-Language / timezone-vs-IP mismatch that is itself a
 * detection tell. On a real desktop the values already match the real IP. We verify and warn.
 */
export async function applyStealthEnvironment(page: Page): Promise<StealthCheckResult> {
  const env = (await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: screen.width,
    screenHeight: screen.height,
    devicePixelRatio: window.devicePixelRatio,
    languages: navigator.languages ? Array.from(navigator.languages) : [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }))) as {
    innerWidth: number; innerHeight: number; screenWidth: number; screenHeight: number;
    devicePixelRatio: number; languages: string[]; timezone: string;
  };

  const warnings: string[] = [];
  if (env.innerWidth > env.screenWidth || env.innerHeight > env.screenHeight) {
    warnings.push(`viewport (${env.innerWidth}x${env.innerHeight}) exceeds screen (${env.screenWidth}x${env.screenHeight})`);
  }
  if (env.languages.length === 0) warnings.push("navigator.languages is empty (real browsers report at least one)");
  if (!env.timezone) warnings.push("timezone is empty");
  if (env.devicePixelRatio <= 0) warnings.push(`implausible devicePixelRatio: ${env.devicePixelRatio}`);

  return { ok: warnings.length === 0, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(5d-stealth): Layer 2 environment consistency check"
```

---

## Task 4: `Actionable.typeSequentially` seam (cadence reaches ref + selector targets)

**Files:**
- Modify: `src/browser/locators.ts`
- Test: `tests/unit/resolve-actionable.test.ts`

**Why:** secure cadence must apply to the **ref path** (the observe→act-by-ref loop is the main agent typing path). `Locator.pressSequentially` and `ElementHandle.type` are the two per-keystroke APIs; this unifies them behind one method so `type.ts` calls it uniformly.

**Interfaces:**
- Produces: `Actionable.typeSequentially(value: string, options?: { delay?: number; timeout?: number }): Promise<void>` on both backends from `resolveActionable`.

- [ ] **Step 1: Read the existing test to match its style**

Read `tests/unit/resolve-actionable.test.ts` (how it builds fake `Page`/handles and asserts the returned `act`/`probe`).

- [ ] **Step 2: Write the failing test**

Append a `describe` that drives `typeSequentially` through both backends. Use the file's existing fake-page/fake-handle helpers if present; otherwise:

```typescript
import { resolveActionable } from "../../src/browser/locators";

describe("resolveActionable typeSequentially seam", () => {
  it("delegates to Locator.pressSequentially for selector targets", async () => {
    const loc = { pressSequentially: vi.fn().mockResolvedValue(undefined), count: vi.fn().mockResolvedValue(1) };
    const page = { locator: vi.fn().mockReturnValue({ first: () => loc, last: () => loc, nth: () => loc }) } as any;
    const { act } = resolveActionable(page, { by: "css", selector: "#x" });
    await act.typeSequentially("hi", { delay: 70, timeout: 5000 });
    expect(loc.pressSequentially).toHaveBeenCalledWith("hi", { delay: 70, timeout: 5000 });
  });

  it("delegates to ElementHandle.type for ref targets", async () => {
    const handle = { type: vi.fn().mockResolvedValue(undefined), evaluate: vi.fn().mockResolvedValue(1) } as any;
    const refLookup = (_r: string) => handle;
    const { act } = resolveActionable({} as any, { by: "ref", ref: "obs.e1" }, refLookup);
    await act.typeSequentially("hi", { delay: 70, timeout: 5000 });
    expect(handle.type).toHaveBeenCalledWith("hi", { delay: 70, timeout: 5000 });
  });
});
```

> If `resolve-actionable.test.ts` lacks a `vi` import, add `import { vi } from "vitest"`.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/resolve-actionable.test.ts`
Expected: FAIL — `act.typeSequentially is not a function`.

- [ ] **Step 4: Write minimal implementation**

In `src/browser/locators.ts`, add the method to the interface:

```typescript
export interface Actionable {
  click(options?: { timeout?: number }): Promise<void>;
  fill(value: string, options?: { timeout?: number }): Promise<void>;
  press(key: string, options?: { timeout?: number }): Promise<void>;
  selectOption(values: string | string[], options?: { timeout?: number }): Promise<string[]>;
  // ponytail: ref path is an ElementHandle (no pressSequentially) — Locator uses pressSequentially,
  // handle uses the deprecated-but-present .type(). Upgrade path: drop the handle branch when refs
  // carry a Locator instead of an ElementHandle.
  typeSequentially(value: string, options?: { delay?: number; timeout?: number }): Promise<void>;
}
```

Replace the two `as unknown as Actionable` casts in `resolveActionable` with explicit adapters:

```typescript
export function resolveActionable(
  page: Page, target: Target, refLookup?: RefLookup,
): { act: Actionable; probe: () => Promise<number> } {
  if (target.by === "ref") {
    const handle = refLookup?.(target.ref);
    if (!handle) throw new RefExpiredError(`Ref "${target.ref}" is from a superseded observe — re-observe and use a fresh ref.`);
    return {
      act: {
        click: (o) => handle.click(o),
        fill: (v, o) => handle.fill(v, o),
        press: (k, o) => handle.press(k, o),
        selectOption: (v, o) => handle.selectOption(v, o),
        typeSequentially: (v, o) => handle.type(v, o),
      },
      probe: () => handle.evaluate((e: Element) => (e.isConnected ? 1 : 0)).catch(() => 0),
    };
  }
  const loc = resolveLocator(page, target);
  return {
    act: {
      click: (o) => loc.click(o),
      fill: (v, o) => loc.fill(v, o),
      press: (k, o) => loc.press(k, o),
      selectOption: (v, o) => loc.selectOption(v, o),
      typeSequentially: (v, o) => loc.pressSequentially(v, o),
    },
    probe: () => loc.count(),
  };
}
```

- [ ] **Step 5: Run the new test + the existing input-handler tests (no regressions)**

Run:
```bash
npx vitest run tests/unit/resolve-actionable.test.ts tests/unit/commands/click.test.ts tests/unit/commands/press.test.ts tests/unit/commands/select-option.test.ts
```
Expected: PASS (the explicit adapters preserve the prior 4-method behavior; click/press/select are unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/browser/locators.ts tests/unit/resolve-actionable.test.ts
git commit -m "feat(5d-stealth): typeSequentially seam on Actionable (ref + selector backends)"
```

---

## Task 5: `stealthWarnings` on the session record

**Files:**
- Modify: `src/sessions/types.ts`, `src/sessions/session.ts`
- Test: `tests/unit/sessions/manager.test.ts` (or the file that constructs `FeatherSession` directly — match where session-record tests live)

**Interfaces:**
- Produces: `SessionRecord.stealthWarnings: string[]`; `ISession.setStealthWarnings(w: string[]): void`; `FeatherSession.toRecord().stealthWarnings`.

- [ ] **Step 1: Write the failing test**

Read the file's existing `FeatherSession` construction style, then append:

```typescript
import { FeatherSession } from "../../../src/sessions/session";

describe("FeatherSession stealthWarnings", () => {
  const opts = {
    workspaceId: "w", profileKind: "disposable" as const, browserMode: "chromium-headed-cdp" as const,
    profilePath: "", debugDir: "", proxy: null,
  };
  it("defaults to an empty array", () => {
    expect(new FeatherSession(opts).toRecord().stealthWarnings).toEqual([]);
  });
  it("records collected warnings", () => {
    const s = new FeatherSession(opts);
    s.setStealthWarnings(["SwiftShader renderer detected"]);
    expect(s.toRecord().stealthWarnings).toEqual(["SwiftShader renderer detected"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: FAIL — `setStealthWarnings` missing / `stealthWarnings` not on record.

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/types.ts`, add to `SessionRecord` (after `proxy`):

```typescript
  stealthWarnings: string[];   // L2 + L4 consistency-check output (empty when clean)
```

And to `ISession` (place near the other mutators):

```typescript
  setStealthWarnings(warnings: string[]): void;
```

In `src/sessions/session.ts`, add a private field (with the other private fields):

```typescript
  private _stealthWarnings: string[] = [];
```

Add the mutator (near `setDebugCapture`):

```typescript
  setStealthWarnings(warnings: string[]): void {
    this._stealthWarnings = warnings;
  }
```

And in `toRecord()`, add the field (after `proxy: this.proxy,`):

```typescript
      stealthWarnings: this._stealthWarnings,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/types.ts src/sessions/session.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(5d-stealth): stealthWarnings on SessionRecord + setter"
```

---

## Task 6: Secure-by-default typing cadence in the `type` handler

**Files:**
- Modify: `src/commands/type.ts`
- Test: `tests/unit/commands/type.test.ts`

**Interfaces:**
- Consumes: `resolveActionable` + `Actionable.typeSequentially` (Task 4); `jitterDelayMs` (Task 1).

- [ ] **Step 1: Update the existing test mock + flip the default-behavior test**

In `tests/unit/commands/type.test.ts`, add `typeSequentially` to `fakeLoc`:

```typescript
const fakeLoc = {
  fill: vi.fn().mockResolvedValue(undefined),
  pressSequentially: vi.fn().mockResolvedValue(undefined),
  typeSequentially: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(1),
};
```

Replace the `"uses fill by default"` test with the secure default, and add an explicit-`fill` override test:

```typescript
it("secure default: types sequentially with a per-keystroke delay in [50,150]", async () => {
  const result = await new TypeHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "placeholder", text: "Message" }, text: "hello world" }, ctx);
  expect(fakeLoc.typeSequentially).toHaveBeenCalledTimes(1);
  const [value, opts] = fakeLoc.typeSequentially.mock.calls[0];
  expect(value).toBe("hello world");
  expect(opts.delay).toBeGreaterThanOrEqual(50);
  expect(opts.delay).toBeLessThanOrEqual(150);
  expect(opts.timeout).toBe(15000);
  expect(fakeLoc.fill).not.toHaveBeenCalled();
  expect(result).toEqual({ pageId: "page_001", typed: true });
});

it("explicit mode:fill overrides the secure default (fast path)", async () => {
  await new TypeHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "fill" }, ctx);
  expect(fakeLoc.fill).toHaveBeenCalledWith("hi", { timeout: 15000 });
  expect(fakeLoc.typeSequentially).not.toHaveBeenCalled();
});
```

Update the existing `'uses pressSequentially with delay when mode is "sequential"'` test to assert `typeSequentially` instead (the handler now routes sequential through the seam):

```typescript
it('honors explicit mode:"sequential" + delayMs', async () => {
  await new TypeHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#e" }, text: "hi", mode: "sequential", delayMs: 20, timeoutMs: 5000 }, ctx);
  expect(fakeLoc.typeSequentially).toHaveBeenCalledWith("hi", { delay: 20, timeout: 5000 });
  expect(fakeLoc.fill).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/type.test.ts`
Expected: FAIL — handler still defaults to `fill`; `typeSequentially` not called.

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/commands/type.ts` to route everything through `resolveActionable` and apply the secure default:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import { resolveActionable } from "../browser/locators";
import { withActionErrors } from "./input-errors";
import { assertPageNotPaused } from "./pause-registry";
import { jitterDelayMs } from "../browser/stealth";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
    getObserveCache(pageId: string): { refs: Map<string, import("playwright").ElementHandle> } | undefined;
  };
}

export class TypeHandler implements CommandHandler<TypeInput, TypeOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: TypeInput, _ctx: CommandContext): Promise<TypeOutput> {
    const { sessionId, pageId, target, text, mode, delayMs, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    // A human in control of this page blocks agent typing — EXCEPT the MFA resolve path, whose own
    // pause would otherwise block Feather from typing the human-relayed code into the target field.
    if (!input.allowDuringHumanControl) assertPageNotPaused(sessionId, resolvedPageId);
    const timeout = timeoutMs ?? 15000;

    // Secure by default: caller specified neither mode nor delay → human cadence (sequential + jitter).
    // Explicit mode:"fill" or an explicit delay is the per-call fast escape hatch and always wins.
    const secureDefault = mode === undefined && delayMs === undefined;
    const useSequential = mode === "sequential" || secureDefault;
    const delay = delayMs ?? (secureDefault ? jitterDelayMs() : undefined);

    const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
    const { act, probe } = resolveActionable(page, target, refLookup);
    await withActionErrors(probe, "type", () =>
      useSequential
        ? act.typeSequentially(text, { delay, timeout })
        : act.fill(text, { timeout }),
    );
    return { pageId: resolvedPageId, typed: true };
  }
}
```

> `resolveLocator` is no longer imported here — the seam handles both backends. Click/press stay native (a pre-click sleep before a teleport-click is not human behavior; kinematic mouse paths are the deferred spike).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/type.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/type.ts tests/unit/commands/type.test.ts
git commit -m "feat(5d-stealth): secure-by-default typing cadence (per-call override wins)"
```

---

## Task 7: Wire the always-on checks into the session manager

**Files:**
- Modify: `src/sessions/manager.ts`
- Test: `tests/integration/stealth.integration.test.ts` (real headed-CDP — the checks need a real page)

**Interfaces:**
- Consumes: `applyStealthEnvironment`, `applyFingerprintCheck`, `classifySite` (Tasks 1–3); `setStealthWarnings` (Task 5).

- [ ] **Step 1: Write the failing integration test**

Read an existing headed-CDP integration test (e.g. an `attach-cdp` test) for the launch/teardown harness and env guard, then create `tests/integration/stealth.integration.test.ts`:

```typescript
import { describe, it, expect, afterAll } from "vitest";
import { SessionManager } from "../../src/sessions/manager";
// ...reuse the existing integration harness's paths/manager construction...

describe("stealth checks on headed-CDP launch", () => {
  it("records a stealthWarnings array (empty on a real GPU)", async () => {
    const manager = /* construct as the other integration tests do */;
    const session = await manager.launch({ profile: { kind: "disposable" }, browserMode: "chromium-headed-cdp" });
    const record = session.toRecord();
    expect(Array.isArray(record.stealthWarnings)).toBe(true);
    // On this Intel/Mesa box the headed-CDP path is a real GPU → no SwiftShader warning.
    expect(record.stealthWarnings.join(" ")).not.toMatch(/swiftshader/i);
    await manager.close(session.sessionId);
  });
});
```

> Match the exact harness (paths, `manager.close`, env-guard `it.skipIf`) used by the sibling headed-CDP integration tests. The behavioral logic is already unit-covered in Tasks 2–3; this proves the wiring on a real page.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/stealth.integration.test.ts`
Expected: FAIL — `stealthWarnings` is `[]` only by the record default; checks not yet wired (or field undefined before Task 5 lands — Task 5 precedes this).

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/manager.ts`, add the import (with the other `../browser/*` imports):

```typescript
import { applyStealthEnvironment, applyFingerprintCheck, classifySite } from "../browser/stealth";
```

Insert the check block after `session.setContext(context);` (currently line 170), gated to the headed-CDP path, best-effort:

```typescript
    if (browserMode === "chromium-headed-cdp") {
      const firstPage = context.pages()[0];
      if (firstPage) {
        const warnings: string[] = [];
        const env = await applyStealthEnvironment(firstPage).catch(() => null);
        if (env) warnings.push(...env.warnings);
        const fp = await applyFingerprintCheck(firstPage).catch(() => null);
        if (fp) warnings.push(...fp.warnings);
        if (warnings.length) session.setStealthWarnings(warnings);
      }
    }
```

Then surface `stealthWarnings` + `siteClass` in the existing `SESSION_LAUNCH_COMPLETED` log (currently lines 199–210) by extending its `data`:

```typescript
      data: {
        workspaceId,
        profileKind,
        browserMode,
        proxy: proxySummary,
        stealthWarnings: session.toRecord().stealthWarnings,
        siteClass: classifySite(context.pages()[0]?.url() ?? ""),
      },
```

> Best-effort: each check is `.catch(() => null)`, so a flaky `page.evaluate` never blocks `launch()`. Non-headed paths are untouched (their `stealthWarnings` stays `[]`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/stealth.integration.test.ts`
Expected: PASS (headed-CDP launches; `stealthWarnings` is an empty array on the real GPU).

- [ ] **Step 5: Commit**

```bash
git add src/sessions/manager.ts tests/integration/stealth.integration.test.ts
git commit -m "feat(5d-stealth): run always-on checks on headed-CDP launch; log site class"
```

---

## Task 8: Self-test — hard assertions + secure-mode report

**Files:**
- Modify: `scripts/spikes/anti-detection-probe.ts`

This probe is a throwaway developer tool (not imported by `src/`). It compares headed-CDP vs `--headless=new`. Extend it; no unit test (run by hand).

- [ ] **Step 1: Read the existing probe**

Read `scripts/spikes/anti-detection-probe.ts` — note how it captures the headed vector (it already reads `webdriver`) and where `main()` prints its table.

- [ ] **Step 2: Add the hard assertions (exit non-zero on failure)**

Add after the headed vector is captured:

```typescript
function assertHardTells(headed: Record<string, unknown>): void {
  const failures: string[] = [];
  if (headed.webdriver !== false) failures.push(`navigator.webdriver is ${headed.webdriver} (must be false)`);
  // Runtime.enable absence: the probe attaches no console/pageerror listeners on the session path
  // (Layer 1). If a CDP-level Runtime.enable check is added later, assert it here.
  if (failures.length) {
    console.error("HARD TELL FAILURES:\n - " + failures.join("\n - "));
    process.exit(2);
  }
  console.log("\nhard tells OK: webdriver === false");
}
```

Call `assertHardTells(headed)` in `main()` after the table prints (use the variable name the probe already uses for the headed vector).

- [ ] **Step 3: Add an opt-in secure-mode report (online)**

```typescript
import { applyStealthEnvironment, applyFingerprintCheck } from "../../src/browser/stealth";

async function probeSecureAgainstSannysoft(executablePath: string): Promise<void> {
  const profile = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-secure-"));
  const { context, childProcess } = await spawnAndConnect({ profilePath: profile, executablePath });
  try {
    const page = await context.newPage();
    const env = await applyStealthEnvironment(page);
    const fp = await applyFingerprintCheck(page);
    await page.goto("https://bot.sannysoft.com/", { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
    const shot = path.join(os.tmpdir(), `feather-sannysoft-${Date.now()}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    console.log("\n## Secure-mode self-test (bot.sannysoft.com)");
    console.log(`environment: ok=${env.ok} ${JSON.stringify(env.warnings)}`);
    console.log(`fingerprint: ok=${fp.ok} ${JSON.stringify(fp.warnings)}`);
    console.log(`screenshot: ${shot}`);
  } finally {
    try { await context.browser()?.close(); } catch { /* */ }
    try { childProcess.kill(); } catch { /* */ }
    await fs.promises.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}
```

In `main()` (reuse the probe's existing `executablePath` variable + its `spawnAndConnect`/`fs`/`os`/`path` imports — add any missing import):

```typescript
  if (process.env.FEATHER_PROBE_ONLINE === "1") await probeSecureAgainstSannysoft(executablePath);
  else console.log("\n(skip online sannysoft probe; set FEATHER_PROBE_ONLINE=1 to run it)");
```

- [ ] **Step 4: Verify (offline)**

Run: `npx tsx scripts/spikes/anti-detection-probe.ts` (or the runner the probe's header comment specifies — check the top of the file).
Expected: table prints, `hard tells OK` line prints, skip line prints, exit 0.

- [ ] **Step 5: (Manual, online — optional) full run**

Run: `FEATHER_PROBE_ONLINE=1 npx tsx scripts/spikes/anti-detection-probe.ts`
Expected: env/fingerprint report + screenshot path; inspect that sannysoft WebDriver/WebGL rows read clean.

- [ ] **Step 6: Commit**

```bash
git add scripts/spikes/anti-detection-probe.ts
git commit -m "test(5d-stealth): self-test hard assertions (webdriver) + secure sannysoft report"
```

---

## Task 9: Full verification + secure-by-default reconciliation

**Files:** none (verification only; a fixup commit if needed)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exit 0. Likely fixups: an `ISession` implementer missing `setStealthWarnings`, or a `SessionRecord` literal in a test/fixture missing `stealthWarnings`.

- [ ] **Step 2: Unit tests**

Run: `npm test`
Expected: all pass, including `stealth.test.ts` (11), the updated `type.test.ts`, `resolve-actionable.test.ts`, and the session-record test.

- [ ] **Step 3: Integration tests**

Run: `npm run test:integration`
Expected: all pass, including `stealth.integration.test.ts`. The one pre-existing niri `attach-cdp` viewport red is unrelated (env-specific) — confirm it is the *only* red and was red before this branch.

- [ ] **Step 4: Reconcile the secure-by-default behavior change**

Sessions with no explicit `type` `mode`/`delayMs` now type **sequentially with jitter** instead of `fill()`. Verify nothing downstream asserted the old `fill` default:

```bash
grep -rn "\.fill\b\|pressSequentially\|toHaveBeenCalledWith" tests/ | grep -i "type\|fill"
```

- The hero demo (`scripts/demo/hero-chatgpt-gmail.ts`) still works — secure typing is *more* human, just slower. If any demo/integration asserts `fill()` was used for a `type` call, update it to the secure path or pass `mode: "fill"` where fast typing is intended.
- Confirm `extract`/`snapshot`/`observe` callers are unaffected (additive `stealthWarnings` only).

- [ ] **Step 5: Final commit (only if fixups were needed)**

```bash
git add -A
git commit -m "chore(5d-stealth): verification fixups (secure-by-default reconciliation)"
```

---

## Deferred (NOT in this plan — filed for later, per the spec)

- **Kinematic input synthesis** (the real Layer 3) — spike-first: curved mouse trajectories + per-keystroke statistical cadence, measured against real detectors. Needs a cursor-position model the action handlers don't have.
- **Observe-walk isolated-world swap** — move `walk.ts`'s `frame.evaluateHandle(WALK_SRC)` into a CDP isolated world (escape page DOM-method traps).
- **niri viewport-pin** — pin render viewport via CDP `Emulation.setDeviceMetricsOverride`, flag-gated.
- **Live probes** — typed-code proof vs a real TOTP wall, IG password-rotation stealth probe, LinkedIn exit test.

## Self-Review Notes

- **Spec coverage:** secure-only model (Tasks 1,6 — no enum/endpoint/field) ✓; L1 seam + CDP audit (Task 1) ✓; L4 fingerprint check, no font guard (Task 2) ✓; L2 env check (Task 3) ✓; cadence reaches ref + selector via the seam (Tasks 4,6) ✓; `stealthWarnings` surfaced (Task 5) + run on headed-CDP launch + site-class log (Task 7) ✓; self-test hard assertions + secure report (Task 8) ✓; Identity slot stays dormant (no task — intentional) ✓; kinematic/isolated-world/viewport-pin/live-probes deferred (listed) ✓.
- **Dropped from rev-2 plan (intentionally, see spec):** `secure`/`assisted` enum, mutable mode, `setStealthMode`, `POST …/stealth`, launch `stealth` param, the needs-confirmation result-type convention, Identity resolve task.
- **Type consistency:** `StealthCheckResult { ok, warnings }`, `SiteClass`, `classifySite`, `applyStealthEnvironment`, `applyFingerprintCheck`, `jitterDelayMs`, `Actionable.typeSequentially`, `SessionRecord.stealthWarnings`, `ISession.setStealthWarnings` used identically across tasks.
