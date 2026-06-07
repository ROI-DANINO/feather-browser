# Stealth Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `secure`/`assisted` stealth model to Feather sessions — secure by default, with
always-on fingerprint-cleanliness checks and human typing cadence — so automated browsing stays
clean on bot-detecting sites without sacrificing Feather's lightweight, local-first, honest posture.

**Architecture:** A single new module `src/browser/stealth.ts` (parallel to `ProxyConfig`;
`modes.ts` untouched). Three always-on layers (CDP-surface guard, environment check, fingerprint
check) plus one mode-differentiated behavioral layer (typing cadence in v1). Mode is **mutable** and
defaults to `secure`. Site classification exists for **observability only**, never as a gate.

**Tech Stack:** TypeScript, Playwright (CDP-attached Chromium), Fastify + Zod (HTTP), Vitest.

**Spec:** `docs/specs/2026-06-07-stealth-stack-design.md` (rev 2)
**Audit that shaped this:** `research/2026-06-07-council-audit-stealth-stack.md`

---

## How This Composes With the Other Two Plans

Feature 1 of 3 in the Agent Browsing Stack (`docs/specs/2026-06-07-agent-browsing-stack-brief.md`).
Build order **Stealth → MFA Handler → Identity Model**. This plan assigns itself **no phase/milestone
number** — that is the deferred roadmap re-sequencing pass (Roi's structure decision).

**Interfaces & Contracts (seams the other two plug into):**

| This plan EXPOSES | Consumed by |
|---|---|
| `StealthConfig` / `StealthMode` on session-create | **Identity** — an identity carries a default `StealthConfig`. |
| `session.stealthMode` getter + `setStealthMode()` + `POST /v1/sessions/:id/stealth` | **MFA** — human takeover = `secure → assisted → secure`. |
| `classifySite(url)` (observability) | **Identity** / **MFA** — label site risk. |
| Convention: "needs human decision" = first-class result type, **not** a thrown exception | **MFA** — establishes the handoff result shape. |

Consumes nothing upstream (root dependency).

---

## File Structure

**Create:**
- `src/browser/stealth.ts` — all stealth logic.
- `tests/unit/browser/stealth.test.ts` — unit tests.

**Modify:**
- `src/sessions/types.ts` — stealth types; `stealthApplied` + `stealthWarnings` on `SessionRecord`; mutable `stealthMode` on `ISession`.
- `src/sessions/session.ts` — `FeatherSession` stores/exposes/mutates `stealthMode`; warnings in record.
- `src/sessions/manager.ts` — resolve (default secure), apply L2+L4 on headed path, collect warnings, log site class.
- `src/commands/launch.ts` — `LaunchInput` gains `stealth`.
- `src/transport/routes.ts` — `LaunchSchema` gains `stealth`; add mode-switch endpoint.
- `src/commands/type.ts` — typing cadence in secure mode.
- `scripts/spikes/anti-detection-probe.ts` — self-test: `webdriver`/`Runtime.enable` hard assertions + secure-mode report.

**Research (no code shipped):**
- `research/2026-06-07-kinematic-input-spike.md` — Task 11 output (gates the deferred behavioral build).

---

## Task 1: Stealth types, mode resolution (default secure), site classification

**Files:**
- Create: `src/browser/stealth.ts`
- Modify: `src/sessions/types.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/browser/stealth.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { resolveStealthMode, classifySite } from "../../../src/browser/stealth";

describe("resolveStealthMode", () => {
  it("defaults to secure when no config is given", () => {
    expect(resolveStealthMode(null)).toBe("secure");
  });
  it("honors an explicit assisted mode", () => {
    expect(resolveStealthMode({ mode: "assisted" })).toBe("assisted");
  });
  it("honors an explicit secure mode", () => {
    expect(resolveStealthMode({ mode: "secure" })).toBe("secure");
  });
});

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/browser/stealth.ts`:

```typescript
import type { Page } from "playwright";

export type StealthMode = "secure" | "assisted";
export type SiteClass = "standard" | "tier-c";

export interface StealthConfig {
  mode: StealthMode;
}

export interface StealthCheckResult {
  ok: boolean;
  warnings: string[];
}

/** Secure-by-default. No classification gate — the agent path is always secure unless a human opts into assisted. */
export function resolveStealthMode(config: StealthConfig | null): StealthMode {
  return config?.mode ?? "secure";
}

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
```

Add to `src/sessions/types.ts` (near `ProxySummary`):

```typescript
export type StealthMode = "secure" | "assisted";
export interface StealthConfig { mode: StealthMode; }
```

And to `SessionRecord` (after `proxy`):

```typescript
  stealthApplied: StealthMode;
  stealthWarnings: string[];
```

> Keep `StealthMode`/`StealthConfig` structurally identical in both files, or have `stealth.ts`
> `import type { StealthMode } from "../sessions/types"`. `types.ts` must not import from `stealth.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts src/sessions/types.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): types, secure-by-default resolution, site classification (observability)"
```

---

## Task 2: Layer 4 — fingerprint consistency check (no font guard)

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```typescript
import { applyFingerprintCheck } from "../../../src/browser/stealth";

describe("applyFingerprintCheck", () => {
  it("passes when a real GPU renderer is reported", async () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Intel)",
        webglRenderer: "ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics, OpenGL 4.6)",
      }),
    } as any;
    const res = await applyFingerprintCheck(page, { mode: "secure" });
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
    const res = await applyFingerprintCheck(page, { mode: "secure" });
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/swiftshader/i);
  });

  it("does NOT call addInitScript (no font guard / no spoofing)", async () => {
    const page = {
      addInitScript: vi.fn(),
      evaluate: vi.fn().mockResolvedValue({ webglVendor: "Google Inc. (Intel)", webglRenderer: "ANGLE (Intel, ...)" }),
    } as any;
    await applyFingerprintCheck(page, { mode: "secure" });
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
export async function applyFingerprintCheck(
  page: Page,
  _config: StealthConfig
): Promise<StealthCheckResult> {
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
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): fingerprint consistency check, no font guard (Layer 4)"
```

---

## Task 3: Layer 2 — environment consistency check

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

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
    const res = await applyStealthEnvironment(envPage(consistent), { mode: "secure" });
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });
  it("warns when viewport exceeds screen", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, innerWidth: 2000 }), { mode: "secure" });
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/viewport.*screen/i);
  });
  it("warns when languages is empty", async () => {
    const res = await applyStealthEnvironment(envPage({ ...consistent, languages: [] }), { mode: "secure" });
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
export async function applyStealthEnvironment(
  page: Page,
  _config: StealthConfig
): Promise<StealthCheckResult> {
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
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): environment consistency check (Layer 2)"
```

---

## Task 4: Typing cadence helper

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```typescript
import { jitterDelayMs } from "../../../src/browser/stealth";

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `jitterDelayMs` not exported.

- [ ] **Step 3: Write minimal implementation**

Append:

```typescript
const MIN_JITTER_MS = 50;
const MAX_JITTER_MS = 150;

/** A human-like per-keystroke delay in [50,150] ms. Used by secure-mode typing. */
export function jitterDelayMs(): number {
  return MIN_JITTER_MS + Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): per-keystroke typing-cadence helper"
```

---

## Task 5: Session stores, exposes, and mutates stealthMode

**Files:**
- Modify: `src/sessions/session.ts`, `src/sessions/types.ts`
- Test: `tests/unit/sessions/manager.test.ts`

- [ ] **Step 1: Write the failing test**

Read `tests/unit/sessions/manager.test.ts` for style, then append:

```typescript
import { FeatherSession } from "../../../src/sessions/session";

describe("FeatherSession stealthMode (mutable)", () => {
  it("stores the provided mode, exposes it, and records it", () => {
    const s = new FeatherSession({
      workspaceId: "w", profileKind: "disposable", browserMode: "chromium-headed-cdp",
      profilePath: "", debugDir: "", proxy: null, stealthMode: "secure",
    });
    expect(s.stealthMode).toBe("secure");
    expect(s.toRecord().stealthApplied).toBe("secure");
    expect(s.toRecord().stealthWarnings).toEqual([]);
  });
  it("can switch mode (human takeover seam)", () => {
    const s = new FeatherSession({
      workspaceId: "w", profileKind: "disposable", browserMode: "chromium-headed-cdp",
      profilePath: "", debugDir: "", proxy: null, stealthMode: "secure",
    });
    s.setStealthMode("assisted");
    expect(s.stealthMode).toBe("assisted");
    expect(s.toRecord().stealthApplied).toBe("assisted");
  });
  it("records collected stealth warnings", () => {
    const s = new FeatherSession({
      workspaceId: "w", profileKind: "disposable", browserMode: "chromium-headed-cdp",
      profilePath: "", debugDir: "", proxy: null, stealthMode: "secure",
    });
    s.setStealthWarnings(["SwiftShader renderer detected"]);
    expect(s.toRecord().stealthWarnings).toEqual(["SwiftShader renderer detected"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: FAIL — constructor option / methods / record fields missing.

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/types.ts`, add to `ISession` (after `proxy`):

```typescript
  stealthMode: StealthMode;          // mutable; reflects who is driving now
  setStealthMode(mode: StealthMode): void;
```

In `src/sessions/session.ts`:

```typescript
// import StealthMode from "./types"
// replace `readonly stealthMode` intent with a private mutable field:
  private _stealthMode: StealthMode;
  private _stealthWarnings: string[] = [];

// constructor opts gains: stealthMode: StealthMode;
// in constructor body:
    this._stealthMode = opts.stealthMode;

// getters / mutators:
  get stealthMode(): StealthMode { return this._stealthMode; }
  setStealthMode(mode: StealthMode): void { this._stealthMode = mode; }
  setStealthWarnings(w: string[]): void { this._stealthWarnings = w; }

// in toRecord(), after `proxy: this.proxy,`:
      stealthApplied: this._stealthMode,
      stealthWarnings: this._stealthWarnings,
```

> `ISession` declares `stealthMode: StealthMode` (a property); a TS `get` accessor satisfies it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/session.ts src/sessions/types.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(stealth): mutable stealthMode + warnings on FeatherSession"
```

---

## Task 6: Wire stealth into the session manager

**Files:**
- Modify: `src/sessions/manager.ts`
- Test: `tests/unit/sessions/manager.test.ts`

- [ ] **Step 1: Write the failing test**

Append (reuse the file's existing manager harness/mocks):

```typescript
describe("SessionManager stealth", () => {
  it("defaults to secure when no stealth config is given", async () => {
    const session = await manager.launch({ profile: { kind: "disposable" }, browserMode: "chromium-new-headless" });
    expect(session.stealthMode).toBe("secure");
  });
  it("honors explicit assisted mode", async () => {
    const session = await manager.launch({ profile: { kind: "disposable" }, browserMode: "chromium-new-headless", stealth: { mode: "assisted" } });
    expect(session.stealthMode).toBe("assisted");
  });
});
```

> If `manager.test.ts` hits real Chromium, move these to `tests/integration/` and keep the unit
> layer on `resolveStealthMode` (Task 1). Match what the file already does.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: FAIL — `stealth` not accepted.

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/manager.ts`:

```typescript
import { resolveStealthMode, applyStealthEnvironment, applyFingerprintCheck, classifySite } from "../browser/stealth";
import type { StealthConfig } from "./types";

// extend LaunchSessionInput:
  stealth?: StealthConfig | null;
```

In `launch()`, compute the mode and pass it to the session:

```typescript
    const stealthMode = resolveStealthMode(input.stealth ?? null);
    // ... pass stealthMode into new FeatherSession({ ... }) ...
```

After `session.setContext(context)`, on the headed-CDP path only, run the always-on checks
best-effort (never block launch) and record warnings + site class:

```typescript
    if (browserMode === "chromium-headed-cdp") {
      const firstPage = context.pages()[0];
      if (firstPage) {
        const warnings: string[] = [];
        const env = await applyStealthEnvironment(firstPage, { mode: stealthMode }).catch(() => null);
        if (env) warnings.push(...env.warnings);
        const fp = await applyFingerprintCheck(firstPage, { mode: stealthMode }).catch(() => null);
        if (fp) warnings.push(...fp.warnings);
        if (warnings.length) {
          session.setStealthWarnings(warnings);
          await this.logger.log({
            ts: new Date().toISOString(), level: "warn", event: EVENTS.SESSION_LAUNCH_COMPLETED,
            sessionId: session.sessionId, data: { stealthWarnings: warnings },
          });
        }
        await this.logger.log({
          ts: new Date().toISOString(), level: "info", event: EVENTS.SESSION_LAUNCH_COMPLETED,
          sessionId: session.sessionId, data: { stealthMode, siteClass: classifySite(firstPage.url()) },
        });
      }
    }
```

> If `src/logs/events.ts` defines an enum, read it and add a `STEALTH_CHECK` constant rather than
> reusing `SESSION_LAUNCH_COMPLETED`; follow that file's pattern.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/manager.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(stealth): resolve + apply always-on checks in session manager"
```

---

## Task 7: API surface — stealth input + mode-switch endpoint

**Files:**
- Modify: `src/commands/launch.ts`, `src/transport/routes.ts`
- Test: `tests/unit/commands/launch.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/commands/launch.test.ts`:

```typescript
it("passes stealth config through to the manager", async () => {
  const session = { toRecord: () => ({ stealthApplied: "assisted", stealthWarnings: [] }), getPageInfoList: async () => [] };
  const manager = { launch: vi.fn().mockResolvedValue(session) } as any;
  await new LaunchSessionHandler(manager).execute(
    { profile: { kind: "disposable" }, stealth: { mode: "assisted" } }, { requestId: "r" });
  expect(manager.launch).toHaveBeenCalledWith(expect.objectContaining({ stealth: { mode: "assisted" } }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/launch.test.ts`
Expected: FAIL — `stealth` not on `LaunchInput`.

- [ ] **Step 3: Write minimal implementation**

In `src/commands/launch.ts`, add to `LaunchInput`:

```typescript
import type { /* ... */ StealthConfig } from "../sessions/types";
// ...
  stealth?: StealthConfig | null;
```

(No gating logic — secure-by-default is resolved in the manager. The handler just forwards.)

In `src/transport/routes.ts`:

1. Extend `LaunchSchema` (after `proxy`):

```typescript
  stealth: z.object({ mode: z.enum(["secure", "assisted"]) }).nullable().optional(),
```

2. Add the mode-switch endpoint (the MFA seam). Near the other session routes:

```typescript
const StealthModeSchema = z.object({ mode: z.enum(["secure", "assisted"]) });

app.post("/v1/sessions/:sessionId/stealth", { preHandler: [tokenAuth] }, async (request, reply) => {
  const requestId = getRequestId(request);
  try {
    const { sessionId } = request.params as { sessionId: string };
    const { mode } = StealthModeSchema.parse(request.body);
    manager.get(sessionId).setStealthMode(mode);
    await reply.status(200).send(ok(requestId, { stealthApplied: mode }));
  } catch (err) { await handleRouteError(err, request, reply); }
});
```

> `manager.get(sessionId)` already throws `SESSION_NOT_FOUND` (mapped to 404). `ISession` now exposes
> `setStealthMode`, so no manager change is needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/launch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/launch.ts src/transport/routes.ts tests/unit/commands/launch.test.ts
git commit -m "feat(stealth): API stealth input + mode-switch endpoint (MFA seam)"
```

---

## Task 8: Typing cadence in secure mode

**Files:**
- Modify: `src/commands/type.ts`
- Test: `tests/unit/commands/type.test.ts`

- [ ] **Step 1: Write the failing test**

Read `tests/unit/commands/type.test.ts`, add `stealthMode: "secure"` capability to its mock session,
then append:

```typescript
it("secure mode types sequentially with a per-keystroke delay in [50,150]", async () => {
  mockSession.stealthMode = "secure";
  mockManager.get.mockReturnValue(mockSession);
  await new TypeHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#x" }, text: "hello" }, ctx);
  expect(fakeLoc.pressSequentially).toHaveBeenCalledTimes(1);
  const opts = fakeLoc.pressSequentially.mock.calls[0][1];
  expect(opts.delay).toBeGreaterThanOrEqual(50);
  expect(opts.delay).toBeLessThanOrEqual(150);
});

it("assisted mode uses fast fill", async () => {
  mockSession.stealthMode = "assisted";
  mockManager.get.mockReturnValue(mockSession);
  await new TypeHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#x" }, text: "hello" }, ctx);
  expect(fakeLoc.fill).toHaveBeenCalledTimes(1);
});
```

Ensure the mock locator has both `fill` and `pressSequentially` as `vi.fn().mockResolvedValue(undefined)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/type.test.ts`
Expected: FAIL — handler ignores `stealthMode`.

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/commands/type.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { TypeInput, TypeOutput, StealthMode } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";
import { jitterDelayMs } from "../browser/stealth";

interface IManager {
  get(sessionId: string): {
    stealthMode: StealthMode;
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export class TypeHandler implements CommandHandler<TypeInput, TypeOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: TypeInput, _ctx: CommandContext): Promise<TypeOutput> {
    const { sessionId, pageId, target, text, mode, delayMs, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const loc = resolveLocator(page, target);
    const timeout = timeoutMs ?? 15000;

    const secure = session.stealthMode === "secure";
    // Explicit caller mode/delay always wins; otherwise secure => sequential + jitter, assisted => fill.
    const effectiveMode = mode ?? (secure ? "sequential" : "fill");
    const effectiveDelay = delayMs ?? (secure ? jitterDelayMs() : undefined);

    await withActionErrors(loc, "type", () =>
      effectiveMode === "sequential"
        ? loc.pressSequentially(text, { delay: effectiveDelay, timeout })
        : loc.fill(text, { timeout }));
    return { pageId: resolvedPageId, typed: true };
  }
}
```

> **Click/press stay native in both modes for v1** — a pre-click *sleep* before a teleport-click is
> not human behavior (council finding) and may be a worse signal. Genuine click realism needs
> kinematic mouse paths, which is the deferred spike (Task 11). Leave `click.ts`/`press.ts` unchanged;
> add a one-line comment in each pointing to the spike doc as the future secure-mode seam.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/type.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/type.ts tests/unit/commands/type.test.ts
git commit -m "feat(stealth): human typing cadence in secure mode"
```

---

## Task 9: Layer 1 — CDP surface audit + seam

**Files:**
- Modify: `src/browser/stealth.ts` (comment-only seam) and audit `src/`
- No new unit test (testing an empty function is ceremony — the real check is the audit + self-test in Task 10)

- [ ] **Step 1: Audit for CDP-runtime-leaking listeners**

Run and read every hit:

```bash
grep -rn "\.on(\"console\"\|\.on('console'\|\.on(\"pageerror\"\|\.on('pageerror'" src/
```

Expected today: no hits on the real session path (`manager.ts` attaches only `page`/`close`/
`framenavigated`). If `src/debug/capture.ts` attaches console/pageerror, note it — that path is
debug-only/opt-in, but must not be wired on a `secure` session. Record findings in the commit.

- [ ] **Step 2: Add a documented seam comment in `src/browser/stealth.ts`**

```typescript
/**
 * Layer 1 — CDP surface minimization is a "don't enable it" guarantee, not positive code.
 * The detection tell is Playwright auto-sending Runtime.enable when console/pageerror listeners
 * attach. Feather's real session path attaches none (audited; see plan Task 9). Do not add
 * page.on("console") / page.on("pageerror") on the stealth path. Enforcement lives in the
 * self-test (anti-detection probe) asserting Runtime.enable is absent on a clean session open.
 */
```

(If any debug-only console wiring exists, gate it behind `stealthMode === "assisted"` in that file.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/browser/stealth.ts
git commit -m "docs(stealth): CDP surface audit + Layer 1 seam comment"
```

---

## Task 10: Self-test — hard assertions + secure-mode report

**Files:**
- Modify: `scripts/spikes/anti-detection-probe.ts`

- [ ] **Step 1: Read the existing probe**

It compares headed-CDP vs `--headless=new`. It is a throwaway spike (not imported by `src/`); run by
hand, no unit test.

- [ ] **Step 2: Add the two hard assertions the council flagged**

After the probe captures the headed vector, assert the load-bearing tells and exit non-zero on
failure:

```typescript
function assertHardTells(headed: Record<string, unknown>): void {
  const failures: string[] = [];
  if (headed.webdriver !== false) failures.push(`navigator.webdriver is ${headed.webdriver} (must be false)`);
  // Runtime.enable absence: the probe attaches no console listeners; assert none were added.
  // (If a CDP-level check is added later, assert here.)
  if (failures.length) {
    console.error("HARD TELL FAILURES:\n - " + failures.join("\n - "));
    process.exit(2);
  }
  console.log("\nhard tells OK: webdriver === false");
}
```

Call `assertHardTells(headed)` in `main()` after the table prints. The existing PROBE already
captures `webdriver`; ensure it stays.

- [ ] **Step 3: Add a secure-mode report (opt-in, online)**

```typescript
import { applyStealthEnvironment, applyFingerprintCheck } from "../../src/browser/stealth";

async function probeSecureAgainstSannysoft(executablePath: string): Promise<void> {
  const profile = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-secure-"));
  const { context, childProcess } = await spawnAndConnect({ profilePath: profile, executablePath });
  try {
    const page = await context.newPage();
    const env = await applyStealthEnvironment(page, { mode: "secure" });
    const fp = await applyFingerprintCheck(page, { mode: "secure" });
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

In `main()`:

```typescript
  if (process.env.FEATHER_PROBE_ONLINE === "1") await probeSecureAgainstSannysoft(executablePath);
  else console.log("\n(skip online sannysoft probe; set FEATHER_PROBE_ONLINE=1 to run it)");
```

- [ ] **Step 4: Verify (offline)**

Run: `npx ts-node scripts/spikes/anti-detection-probe.ts`
Expected: table prints, `hard tells OK` line prints, skip line prints, exit 0.

- [ ] **Step 5: (Manual, online) full run**

Run: `FEATHER_PROBE_ONLINE=1 npx ts-node scripts/spikes/anti-detection-probe.ts`
Expected: env/fingerprint report + screenshot path. Inspect — sannysoft WebDriver/Chrome/WebGL rows green.

- [ ] **Step 6: Commit**

```bash
git add scripts/spikes/anti-detection-probe.ts
git commit -m "test(stealth): self-test hard assertions (webdriver) + secure sannysoft report"
```

---

## Task 11: Kinematic input synthesis spike (research — gates the deferred behavioral build)

**Files:**
- Create: `research/2026-06-07-kinematic-input-spike.md`
- Optional throwaway: `scripts/spikes/kinematic-input-probe.ts` (not imported by `src/`)

This is the **single highest-value deferred piece** (both reviewers). Per Roi's decision —
**spike first, then build.** This task produces *findings*, not shipped behavior. The actual
kinematic build is a follow-up plan gated on these findings.

- [ ] **Step 1: Research the approaches**

Read up and record concrete options for:
- **Mouse trajectories:** bezier/spline paths with overshoot-and-correct, variable speed, non-center
  target points; Fitts's-Law-based movement time. Drive via Playwright `page.mouse.move(x, y, { steps })`
  + `mouse.down()/up()` (real `Input.dispatchMouseEvent` moves a detector can see), which requires a
  **cursor-position model** (track where the mouse "is" — `loc.click()` hides this).
- **Typing cadence:** statistically-modeled inter-keystroke intervals (bursts, typo micro-pauses) vs
  the flat jitter v1 ships.
- Reference (understand, do not import): `puppeteer-extra-plugin-stealth`, `ghost-cursor`.

- [ ] **Step 2: Measure, don't assert**

If feasible, prototype a curved-path click in a throwaway script and observe it against
`bot.sannysoft.com` / a mouse-entropy demo / CreepJS. Record what changes vs native `click()`.

- [ ] **Step 3: Write findings**

Write `research/2026-06-07-kinematic-input-spike.md`: recommended approach, the cursor-model design
implication for the action handlers, cost/complexity, and a go/no-go for the build. Keep the
lightweight lens — ships nothing.

- [ ] **Step 4: Commit**

```bash
git add research/2026-06-07-kinematic-input-spike.md scripts/spikes/kinematic-input-probe.ts 2>/dev/null
git commit -m "spike(stealth): kinematic input synthesis findings (gates deferred Layer-3 build)"
```

---

## Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck** — `npm run typecheck` → exit 0. (Likely fixups: a `new FeatherSession`
  call site missing `stealthMode`, or an action handler `IManager` missing `stealthMode`.)

- [ ] **Step 2: Unit tests** — `npm test` → all pass, including `stealth.test.ts` (15) + augmented
  session/type/launch tests.

- [ ] **Step 3: Integration tests** — `npm run test:integration` → all pass.

- [ ] **Step 4: Reconcile secure-by-default behavior change** — sessions with no `stealth` field now
  default to **secure**, so `type` becomes sequential-with-jitter instead of `fill`. Verify:
  - The hero demo (`npm run demo:hero`) still works — secure typing is *more* human, expected to be
    fine, just slower. If any integration/demo test asserts `fill()` was used, update it to accept
    the secure path or pass `stealth: { mode: "assisted" }` where fast typing is intended.
  - Existing callers gain `stealthApplied`/`stealthWarnings` in the record (additive).

- [ ] **Step 5: Final commit (if fixups needed)**

```bash
git add -A
git commit -m "chore(stealth): verification fixups (secure-by-default reconciliation)"
```

---

## Candidate Work-Session Grouping (non-binding)

Final assignment to work sessions happens in the roadmap re-sequencing pass. Starting suggestion:

| Cluster | Tasks | Theme | Depends on |
|---|---|---|---|
| **S-1: Core + always-on checks** | 1, 2, 3, 4 | types, resolution, L2/L4 checks, typing helper | — |
| **S-2: Session + manager wiring** | 5, 6 | mutable mode, warnings, apply on launch | S-1 |
| **S-3: API + typing behavior** | 7, 8 | stealth input, mode-switch endpoint, secure typing | S-2 |
| **S-4: Audit + self-test** | 9, 10 | Layer 1 audit, hard assertions, sannysoft report | S-3 |
| **S-5: Spike + verify** | 11, 12 | kinematic research, full green | S-4 (11 independent) |

---

## Self-Review Notes

- **Spec coverage:** secure/assisted mode + secure-by-default (Tasks 1,6,7) ✓; mutable mode +
  switch endpoint (Tasks 5,7) ✓; always-on L2/L4 checks, no spoof (Tasks 2,3,6) ✓; **no font guard**
  (Task 2) ✓; L1 audit + seam, no ceremony test (Task 9) ✓; typing cadence, no pre-click sleep
  (Task 8) ✓; `classifySite` observability-only (Tasks 1,6) ✓; `stealthApplied`/`stealthWarnings`
  surfaced (Tasks 5,6) ✓; self-test hard assertions (Task 10) ✓; kinematic deferred to spike
  (Task 11) ✓.
- **Deleted from rev-1 plan (intentionally):** `StealthUpgradeRecommendedError`, soft-block route
  special-case, `url` launch param, `autonomous` flag, auto-upgrade branching, `withStealthTiming`,
  `FONT_GUARD_INIT`, `applyStealthCDP` empty-fn unit test.
- **Type consistency:** `StealthMode = "secure" | "assisted"`, `StealthConfig`, `SiteClass`,
  `StealthCheckResult` used identically across tasks; `stealthApplied`/`stealthWarnings` are the
  record fields; `stealthMode` (getter) + `setStealthMode` on the session.
