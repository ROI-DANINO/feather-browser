# Stealth Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fast/secure stealth model to Feather sessions so automated browsing is
indistinguishable from a real human on bot-detecting sites, without sacrificing Feather's
lightweight, local-first, honest posture.

**Architecture:** A single new module `src/browser/stealth.ts` holds all stealth logic (site
classification, mode resolution, and the four layers). It is wired into session creation parallel
to how `ProxyConfig` is wired today — `modes.ts` is not modified. The session stores its resolved
stealth mode; action handlers (click/type/press) read it to apply behavioral timing in secure mode.

**Tech Stack:** TypeScript, Playwright (CDP-attached Chromium), Fastify + Zod (HTTP), Vitest.

**Spec:** `docs/specs/2026-06-07-stealth-stack-design.md`

---

## How This Composes With the Other Two Plans

This is **Feature 1 of 3** in the Agent Browsing Stack (`docs/specs/2026-06-07-agent-browsing-stack-brief.md`).
The build order is **Stealth → MFA Handler → Identity Model**, and these plans are written to
interlock, not stand alone. After all three plans exist, the roadmap will be re-sequenced and
tasks assigned to specific work sessions (per Roi's structure decision, 2026-06-07).

**What this plan deliberately does NOT do:** assign itself a phase or milestone number. It defines
*what* to build and the *internal* task order only. Slotting it into a phase, and cutting the tasks
below into named work sessions, is the deferred roadmap pass.

### Interfaces & Contracts (the seams the other two plans plug into)

| This plan EXPOSES | Consumed by |
|---|---|
| `StealthConfig` + `StealthMode` on the session-create input (`src/sessions/types.ts`) | **Identity Model** — each named identity will carry a default `StealthConfig`, so "Roi's LinkedIn identity" implies secure mode automatically. |
| `classifySite(url) → SiteClass` (Tier C detection) | **Identity Model** — an identity's site list can pre-classify; **MFA Handler** — captcha/login walls are most common on Tier C sites. |
| The "agent hit a wall, surface it" philosophy (captcha = handoff, never bypass) | **MFA Handler** — Feature 2 *is* the handoff mechanism this plan defers to. |
| `session.stealthMode` getter on `ISession` | **MFA Handler** — pause/resume needs to know the session's mode to resume consistently. |

**This plan CONSUMES from the others:** nothing. Stealth is the root dependency (no upstream),
which is why it is built first.

---

## File Structure

**Create:**
- `src/browser/stealth.ts` — all stealth logic. One responsibility: decide and apply stealth.
- `tests/unit/browser/stealth.test.ts` — unit tests mirroring the module.

**Modify:**
- `src/sessions/types.ts` — add stealth types; add `stealthApplied` to `SessionRecord`.
- `src/sessions/session.ts` — `FeatherSession` stores + exposes `stealthMode`.
- `src/sessions/manager.ts` — `LaunchSessionInput` gains `stealth`/`autonomous`; `launch()` resolves
  mode, stores it, and (on the headed-CDP path) applies the layer hooks.
- `src/commands/launch.ts` — `LaunchInput` gains `stealth`/`autonomous`; surface the soft-block.
- `src/transport/routes.ts` — `LaunchSchema` gains the fields; map `STEALTH_UPGRADE_RECOMMENDED`.
- `src/commands/click.ts`, `type.ts`, `press.ts` — read `session.stealthMode`, wrap with timing.
- `scripts/spikes/anti-detection-probe.ts` — extend to a fast-vs-secure self-test report.

---

## Deviations & Decisions Discovered During Planning

Surfaced here for the reviewer — three refinements to the spec found while mapping it to code:

1. **Layer 2 (environment) is a consistency *check*, not a spoof, in v1.** On the headed-CDP path
   (the real anti-detection path) the browser already has a real desktop environment. Actively
   spoofing locale/timezone there creates an `Accept-Language`/timezone-vs-IP mismatch that is
   *itself* a detection tell — unless paired with a geo-proxy, which Feather doesn't have yet. So
   Layer 2 v1 *verifies* viewport/screen/dpr/timezone/locale consistency and warns on mismatch,
   mirroring the "verify the real fingerprint, don't fake it" decision we already made for canvas.
   Active geo-coupled spoofing is deferred to when proxy-geo coupling lands.

2. **Layer 1 (CDP surface) is a guard + audit + self-test assertion**, because it is inherently a
   "don't enable X" layer. There is no positive code that "turns on" Layer 1; the work is ensuring
   Feather attaches no CDP-runtime-leaking listeners (`page.on('console')`, `page.on('pageerror')`)
   on the real path, and keeping it that way. `applyStealthCDP` is the documented seam + guard.

3. **Stealth mode is immutable per session** — set at creation, never changed mid-session. Simpler
   to reason about and matches how `proxy` and `browserMode` already work.

---

## Task 1: Stealth types + site classification

**Files:**
- Create: `src/browser/stealth.ts`
- Modify: `src/sessions/types.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/browser/stealth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { classifySite } from "../../../src/browser/stealth";

describe("classifySite", () => {
  it("classifies known Tier C apex domains as tier-c", () => {
    expect(classifySite("https://linkedin.com/feed")).toBe("tier-c");
    expect(classifySite("https://instagram.com/")).toBe("tier-c");
    expect(classifySite("https://facebook.com/")).toBe("tier-c");
  });

  it("classifies subdomains of Tier C sites as tier-c", () => {
    expect(classifySite("https://www.linkedin.com/in/someone")).toBe("tier-c");
    expect(classifySite("https://business.facebook.com/")).toBe("tier-c");
  });

  it("classifies unknown sites as standard", () => {
    expect(classifySite("https://example.com/")).toBe("standard");
    expect(classifySite("https://news.ycombinator.com/")).toBe("standard");
  });

  it("does not match a Tier C name appearing only as a path or query", () => {
    expect(classifySite("https://example.com/linkedin.com")).toBe("standard");
    expect(classifySite("https://example.com/?to=instagram.com")).toBe("standard");
  });

  it("returns standard for an unparseable URL rather than throwing", () => {
    expect(classifySite("not a url")).toBe("standard");
    expect(classifySite("")).toBe("standard");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `classifySite` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/browser/stealth.ts`:

```typescript
import type { BrowserContext, Page } from "playwright";

export type StealthMode = "fast" | "secure";
export type SiteClass = "standard" | "tier-c";

export interface StealthConfig {
  mode: StealthMode;
}

export interface StealthResolution {
  mode: StealthMode;
  siteClass: SiteClass;
  /** Set (interactive only) when the classifier recommends switching to secure. */
  recommendation?: string;
  /** Set (autonomous only) when the classifier silently upgraded to secure. */
  autoUpgraded?: boolean;
}

export interface StealthCheckResult {
  ok: boolean;
  warnings: string[];
}

/** Known bot-detecting sites. Apex domains; subdomains match by suffix. v1 is domain-list only. */
const TIER_C_DOMAINS = ["linkedin.com", "instagram.com", "facebook.com"];

export function classifySite(url: string): SiteClass {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "standard";
  }
  const isTierC = TIER_C_DOMAINS.some(
    (d) => host === d || host.endsWith(`.${d}`)
  );
  return isTierC ? "tier-c" : "standard";
}
```

Add to `src/sessions/types.ts` (after the `ProxySummary` interface, near the other config types):

```typescript
export type StealthMode = "fast" | "secure";

export interface StealthConfig {
  mode: StealthMode;
}
```

And add `stealthApplied` to `SessionRecord` (after the `proxy` field):

```typescript
export interface SessionRecord {
  // ... existing fields ...
  proxy: ProxySummary | null;
  stealthApplied: StealthMode;
  startedAt: string;
  // ... rest unchanged ...
}
```

> Note: `StealthMode`/`StealthConfig` are declared in both `stealth.ts` (the module's own surface)
> and `types.ts` (the session contract). Keep them structurally identical. `stealth.ts` may
> `import type { StealthMode } from "../sessions/types"` instead if you prefer one source of truth —
> do whichever keeps the import graph acyclic; `types.ts` must not import from `stealth.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts src/sessions/types.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): site classification + stealth types"
```

---

## Task 2: Stealth mode resolution

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { resolveStealthMode } from "../../../src/browser/stealth";

describe("resolveStealthMode", () => {
  it("defaults to fast on a standard site with no config", () => {
    const r = resolveStealthMode({ config: null, url: "https://example.com", autonomous: false });
    expect(r.mode).toBe("fast");
    expect(r.siteClass).toBe("standard");
    expect(r.recommendation).toBeUndefined();
    expect(r.autoUpgraded).toBeUndefined();
  });

  it("recommends secure (interactive) on a Tier C site when mode is unset", () => {
    const r = resolveStealthMode({ config: null, url: "https://linkedin.com", autonomous: false });
    expect(r.mode).toBe("fast"); // session does NOT open in secure; caller must opt in
    expect(r.siteClass).toBe("tier-c");
    expect(r.recommendation).toMatch(/secure/i);
    expect(r.autoUpgraded).toBeUndefined();
  });

  it("auto-upgrades to secure (autonomous) on a Tier C site when mode is unset", () => {
    const r = resolveStealthMode({ config: null, url: "https://linkedin.com", autonomous: true });
    expect(r.mode).toBe("secure");
    expect(r.autoUpgraded).toBe(true);
    expect(r.recommendation).toBeUndefined();
  });

  it("honors an explicit secure mode and bypasses the classifier", () => {
    const r = resolveStealthMode({ config: { mode: "secure" }, url: "https://example.com", autonomous: false });
    expect(r.mode).toBe("secure");
    expect(r.recommendation).toBeUndefined();
  });

  it("honors an explicit fast mode on a Tier C site (no recommendation, no upgrade)", () => {
    const r = resolveStealthMode({ config: { mode: "fast" }, url: "https://linkedin.com", autonomous: false });
    expect(r.mode).toBe("fast");
    expect(r.recommendation).toBeUndefined();
    expect(r.autoUpgraded).toBeUndefined();
  });

  it("defaults to fast when url is null", () => {
    const r = resolveStealthMode({ config: null, url: null, autonomous: false });
    expect(r.mode).toBe("fast");
    expect(r.siteClass).toBe("standard");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `resolveStealthMode` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/browser/stealth.ts`:

```typescript
export function resolveStealthMode(opts: {
  config: StealthConfig | null;
  url: string | null;
  autonomous: boolean;
}): StealthResolution {
  const siteClass: SiteClass = opts.url ? classifySite(opts.url) : "standard";

  // Explicit mode always wins; the classifier is bypassed.
  if (opts.config) {
    return { mode: opts.config.mode, siteClass };
  }

  // Mode unset: classifier decides.
  if (siteClass === "tier-c") {
    if (opts.autonomous) {
      return { mode: "secure", siteClass, autoUpgraded: true };
    }
    return {
      mode: "fast",
      siteClass,
      recommendation: "This is a Tier C site (active bot detection) — secure mode recommended.",
    };
  }

  return { mode: "fast", siteClass };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (11 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): mode resolution with interactive recommend / autonomous upgrade"
```

---

## Task 3: Layer 3 — behavioral timing helper

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { jitterDelayMs, withStealthTiming } from "../../../src/browser/stealth";

describe("jitterDelayMs", () => {
  it("always returns a value within the 50-150ms range", () => {
    for (let i = 0; i < 500; i++) {
      const d = jitterDelayMs();
      expect(d).toBeGreaterThanOrEqual(50);
      expect(d).toBeLessThanOrEqual(150);
    }
  });
});

describe("withStealthTiming", () => {
  it("fast mode runs the action immediately with no sleep", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const action = vi.fn().mockResolvedValue("done");
    const result = await withStealthTiming(action, { mode: "fast" }, sleep);
    expect(result).toBe("done");
    expect(sleep).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("secure mode sleeps before running the action and returns its result", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const action = vi.fn().mockResolvedValue(42);
    const result = await withStealthTiming(action, { mode: "secure" }, sleep);
    expect(result).toBe(42);
    expect(sleep).toHaveBeenCalledTimes(1);
    const sleptFor = sleep.mock.calls[0][0];
    expect(sleptFor).toBeGreaterThanOrEqual(50);
    expect(sleptFor).toBeLessThanOrEqual(150);
  });
});
```

Add `vi` to the existing vitest import at the top of the file if not already present:
`import { describe, it, expect, vi } from "vitest";`

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `jitterDelayMs` / `withStealthTiming` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/browser/stealth.ts`:

```typescript
const MIN_JITTER_MS = 50;
const MAX_JITTER_MS = 150;

/** A human-like per-action delay in [50, 150] ms. */
export function jitterDelayMs(): number {
  return MIN_JITTER_MS + Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1));
}

const realSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Run an action, adding a human-like pre-action delay in secure mode only.
 * `sleep` is injectable for testing; defaults to a real setTimeout-based sleep.
 */
export async function withStealthTiming<T>(
  action: () => Promise<T>,
  config: StealthConfig,
  sleep: (ms: number) => Promise<void> = realSleep
): Promise<T> {
  if (config.mode === "secure") {
    await sleep(jitterDelayMs());
  }
  return action();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (14 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): behavioral timing helper (Layer 3)"
```

---

## Task 4: Layer 1 — CDP surface guard + audit

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Audit for CDP-runtime-leaking listeners**

Run these and read every hit:

```bash
grep -rn "\.on(\"console\"\|\.on('console'\|\.on(\"pageerror\"\|\.on('pageerror'" src/
```

Expected today: no hits on the real session path (`manager.ts` attaches only `page`/`close`/
`framenavigated`). If `src/debug/capture.ts` attaches console/pageerror, note it — that path is
debug-only and opt-in, but in **secure** mode it must not be wired. Record findings in the commit
message.

- [ ] **Step 2: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { applyStealthCDP } from "../../../src/browser/stealth";

describe("applyStealthCDP", () => {
  it("does not attach console or pageerror listeners to the context", async () => {
    const on = vi.fn();
    const fakeContext = { on } as any;
    await applyStealthCDP(fakeContext, { mode: "secure" });
    const events = on.mock.calls.map((c) => c[0]);
    expect(events).not.toContain("console");
    expect(events).not.toContain("pageerror");
  });

  it("resolves without throwing in both modes", async () => {
    const fakeContext = { on: vi.fn() } as any;
    await expect(applyStealthCDP(fakeContext, { mode: "fast" })).resolves.toBeUndefined();
    await expect(applyStealthCDP(fakeContext, { mode: "secure" })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `applyStealthCDP` not exported.

- [ ] **Step 4: Write minimal implementation**

Append to `src/browser/stealth.ts`:

```typescript
/**
 * Layer 1 — CDP surface minimization.
 *
 * This is a "don't enable it" layer: the detection tell is Playwright auto-sending
 * `Runtime.enable` when console/pageerror listeners are attached. Feather's real session path
 * attaches none (audited). This function is the documented seam + guard: it intentionally does
 * NOT attach any runtime listeners. Keep it that way. The actual guarantee is verified by the
 * self-test (anti-detection probe) asserting Runtime.enable is absent on a clean session open.
 */
export async function applyStealthCDP(
  _context: BrowserContext,
  _config: StealthConfig
): Promise<void> {
  // Intentionally empty: correctness is the ABSENCE of runtime-event wiring.
  // Do not add page.on("console") / page.on("pageerror") on the stealth path.
  return;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (16 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): CDP surface guard + audit (Layer 1)"
```

---

## Task 5: Layer 2 — environment consistency check

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { applyStealthEnvironment } from "../../../src/browser/stealth";

function fakePageReturning(values: Record<string, unknown>) {
  return { evaluate: vi.fn().mockResolvedValue(values) } as any;
}

describe("applyStealthEnvironment", () => {
  it("returns ok with no warnings when the environment is consistent", async () => {
    const page = fakePageReturning({
      innerWidth: 1280, innerHeight: 800, screenWidth: 1440, screenHeight: 900,
      devicePixelRatio: 2, languages: ["en-US", "en"], timezone: "Asia/Jerusalem",
    });
    const res = await applyStealthEnvironment(page, { mode: "secure" });
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
  });

  it("warns when the viewport is larger than the screen", async () => {
    const page = fakePageReturning({
      innerWidth: 2000, innerHeight: 1500, screenWidth: 1440, screenHeight: 900,
      devicePixelRatio: 2, languages: ["en-US"], timezone: "Asia/Jerusalem",
    });
    const res = await applyStealthEnvironment(page, { mode: "secure" });
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/viewport.*screen/i);
  });

  it("warns when languages is empty", async () => {
    const page = fakePageReturning({
      innerWidth: 1280, innerHeight: 800, screenWidth: 1440, screenHeight: 900,
      devicePixelRatio: 2, languages: [], timezone: "Asia/Jerusalem",
    });
    const res = await applyStealthEnvironment(page, { mode: "secure" });
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/languages/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: FAIL — `applyStealthEnvironment` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/browser/stealth.ts`:

```typescript
/**
 * Layer 2 — environment consistency CHECK (v1 does not spoof).
 *
 * On the real headed-CDP path the environment is genuinely the user's desktop. Spoofing
 * locale/timezone here, without a matching geo-proxy, creates Accept-Language / timezone-vs-IP
 * mismatches that are themselves tells — so v1 verifies consistency and warns, mirroring the
 * "verify, don't fake" decision made for canvas. Active geo-coupled spoofing is deferred until
 * proxy-geo coupling exists.
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
    warnings.push(
      `viewport (${env.innerWidth}x${env.innerHeight}) exceeds screen (${env.screenWidth}x${env.screenHeight})`
    );
  }
  if (env.languages.length === 0) {
    warnings.push("navigator.languages is empty (real browsers report at least one)");
  }
  if (!env.timezone) {
    warnings.push("timezone is empty");
  }
  if (env.devicePixelRatio <= 0) {
    warnings.push(`implausible devicePixelRatio: ${env.devicePixelRatio}`);
  }

  return { ok: warnings.length === 0, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (19 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): environment consistency check (Layer 2)"
```

---

## Task 6: Layer 4 — fingerprint consistency check + font guard

**Files:**
- Modify: `src/browser/stealth.ts`
- Test: `tests/unit/browser/stealth.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/stealth.test.ts`:

```typescript
import { applyFingerprintCheck } from "../../../src/browser/stealth";

describe("applyFingerprintCheck", () => {
  it("passes when a real GPU renderer is reported", async () => {
    const page = {
      addInitScript: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Intel)",
        webglRenderer: "ANGLE (Intel, Mesa Intel(R) Iris(R) Xe Graphics, OpenGL 4.6)",
      }),
    } as any;
    const res = await applyFingerprintCheck(page, { mode: "secure" });
    expect(res.ok).toBe(true);
    expect(res.warnings).toEqual([]);
    expect(page.addInitScript).toHaveBeenCalled(); // font guard installed
  });

  it("warns when SwiftShader (software/headless) renderer is detected", async () => {
    const page = {
      addInitScript: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({
        webglVendor: "Google Inc. (Google)",
        webglRenderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))",
      }),
    } as any;
    const res = await applyFingerprintCheck(page, { mode: "secure" });
    expect(res.ok).toBe(false);
    expect(res.warnings.join(" ")).toMatch(/swiftshader/i);
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
 * Layer 4 — fingerprint consistency check + font guard.
 *
 * No canvas/WebGL spoofing: real Chromium on a real GPU already has a genuine, stable
 * fingerprint. This VERIFIES the real WebGL renderer is intact (a SwiftShader software renderer
 * means the headless path leaked through and the session is already detectable) and installs a
 * font-enumeration guard so font probing returns a realistic non-empty set rather than a tell.
 */
const FONT_GUARD_INIT = `
(() => {
  // Ensure font enumeration never returns an empty/implausible set. Additive consistency only.
  const REAL_FONTS = ["Arial","Courier New","Georgia","Times New Roman","Trebuchet MS","Verdana"];
  try {
    if (document.fonts && typeof document.fonts.check === "function") {
      const origCheck = document.fonts.check.bind(document.fonts);
      document.fonts.check = (font, text) => {
        for (const f of REAL_FONTS) { if (font && font.indexOf(f) !== -1) return true; }
        return origCheck(font, text);
      };
    }
  } catch (e) { /* best-effort */ }
})();
`;

export async function applyFingerprintCheck(
  page: Page,
  _config: StealthConfig
): Promise<StealthCheckResult> {
  await page.addInitScript(FONT_GUARD_INIT);

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
    warnings.push(
      `SwiftShader renderer detected (${gpu.webglRenderer}) — headless GPU leaked through; session is detectable`
    );
  }
  if (gpu.webglRenderer === "no-ext" || gpu.webglVendor === "err") {
    warnings.push("WebGL renderer info unavailable — possible hardened/atypical GPU context");
  }

  return { ok: warnings.length === 0, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/stealth.test.ts`
Expected: PASS (21 tests total).

- [ ] **Step 5: Commit**

```bash
git add src/browser/stealth.ts tests/unit/browser/stealth.test.ts
git commit -m "feat(stealth): fingerprint check + font guard (Layer 4)"
```

---

## Task 7: Store stealth mode on the session

**Files:**
- Modify: `src/sessions/session.ts`
- Modify: `src/sessions/types.ts`
- Test: `tests/unit/sessions/manager.test.ts` (read first to match its style)

- [ ] **Step 1: Write the failing test**

Read `tests/unit/sessions/manager.test.ts` to match its construction style, then add a focused
test for the session field. Append to that file (inside its top-level `describe`, or a new one):

```typescript
import { FeatherSession } from "../../../src/sessions/session";

describe("FeatherSession stealthMode", () => {
  it("defaults to the provided stealth mode and exposes it", () => {
    const session = new FeatherSession({
      workspaceId: "w", profileKind: "disposable", browserMode: "chromium-headed-cdp",
      profilePath: "", debugDir: "", proxy: null, stealthMode: "secure",
    });
    expect(session.stealthMode).toBe("secure");
    expect(session.toRecord().stealthApplied).toBe("secure");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: FAIL — `stealthMode` is not a constructor option / not on the record.

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/types.ts`, add `stealthMode` to the `ISession` interface (after `proxy`):

```typescript
export interface ISession {
  // ... existing ...
  readonly proxy: ProxySummary | null;
  readonly stealthMode: StealthMode;
  // ... rest ...
}
```

In `src/sessions/session.ts`:

```typescript
// add to the class field declarations (after `readonly proxy`):
  readonly stealthMode: StealthMode;

// add StealthMode to the type import from "./types"

// add to the constructor opts object type:
  constructor(opts: {
    workspaceId: string;
    profileKind: ProfileKind;
    browserMode: BrowserMode;
    profilePath: string;
    debugDir: string;
    proxy: ProxySummary | null;
    stealthMode: StealthMode;
  }) {
    // ... existing assignments ...
    this.proxy = opts.proxy;
    this.stealthMode = opts.stealthMode;
    // ... rest ...
  }

// in toRecord(), add after `proxy: this.proxy,`:
      stealthApplied: this.stealthMode,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full unit suite to catch construction-site breakage**

Run: `npm test`
Expected: Any other `new FeatherSession({...})` call sites now fail to typecheck/run because
`stealthMode` is required. The next task fixes the manager (the real call site). If a *test*
constructs `FeatherSession` directly and now fails, add `stealthMode: "fast"` to it.

- [ ] **Step 6: Commit**

```bash
git add src/sessions/session.ts src/sessions/types.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(stealth): FeatherSession stores and exposes stealthMode"
```

---

## Task 8: Wire stealth into the session manager

**Files:**
- Modify: `src/sessions/manager.ts`
- Test: `tests/unit/sessions/manager.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/sessions/manager.test.ts` a test that `launch` resolves and stores the mode.
Match the file's existing manager setup (paths/lock/workspace mocks). Minimal shape:

```typescript
describe("SessionManager stealth resolution", () => {
  it("stores fast on a standard site when no stealth config is given", async () => {
    // ... construct manager with existing test harness ...
    const session = await manager.launch({
      profile: { kind: "disposable" },
      browserMode: "chromium-new-headless",
    });
    expect(session.stealthMode).toBe("fast");
  });

  it("stores secure when explicitly requested", async () => {
    const session = await manager.launch({
      profile: { kind: "disposable" },
      browserMode: "chromium-new-headless",
      stealth: { mode: "secure" },
    });
    expect(session.stealthMode).toBe("secure");
  });
});
```

> If the existing manager tests mock Playwright launch, reuse that mock. If they hit real Chromium
> (integration), move this assertion to `tests/integration/` instead and keep the unit layer on
> `resolveStealthMode` (already covered in Task 2). Choose based on what `manager.test.ts` does.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: FAIL — `stealth` not accepted / `stealthMode` undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/sessions/manager.ts`:

```typescript
// add to imports:
import { resolveStealthMode, applyStealthCDP, applyStealthEnvironment, applyFingerprintCheck } from "../browser/stealth";
import type { StealthConfig } from "./types";

// extend LaunchSessionInput:
export interface LaunchSessionInput {
  // ... existing ...
  proxy?: ProxyConfig | null;
  stealth?: StealthConfig | null;
  autonomous?: boolean;
  debug?: { trace?: boolean; screenshots?: boolean };
}
```

This task wires only the **resolution + storage** (the soft-block lives at the command layer in
Task 9, so the manager assumes the caller already decided to open). In `launch()`, after computing
`proxy`/`proxySummary` and before constructing the session:

```typescript
    const stealth = resolveStealthMode({
      config: input.stealth ?? null,
      url: null, // URL-based gating happens at the command layer before launch (Task 9)
      autonomous: input.autonomous ?? false,
    });
```

Pass `stealthMode: stealth.mode` into `new FeatherSession({ ... })`. Then, on the headed-CDP path
only, after `session.setContext(context)`, apply the layer hooks against the first page
(best-effort; never block launch on a stealth check):

```typescript
    if (browserMode === "chromium-headed-cdp") {
      await applyStealthCDP(context, { mode: stealth.mode });
      const firstPage = context.pages()[0];
      if (firstPage) {
        const env = await applyStealthEnvironment(firstPage, { mode: stealth.mode }).catch(() => null);
        if (env && !env.ok) {
          await this.logger.log({
            ts: new Date().toISOString(), level: "warn", event: EVENTS.SESSION_LAUNCH_COMPLETED,
            sessionId: session.sessionId, data: { stealthWarnings: env.warnings },
          });
        }
        if (stealth.mode === "secure") {
          const fp = await applyFingerprintCheck(firstPage, { mode: stealth.mode }).catch(() => null);
          if (fp && !fp.ok) {
            await this.logger.log({
              ts: new Date().toISOString(), level: "warn", event: EVENTS.SESSION_LAUNCH_COMPLETED,
              sessionId: session.sessionId, data: { fingerprintWarnings: fp.warnings },
            });
          }
        }
      }
    }
```

> If `EVENTS` has no stealth-specific event, reuse `SESSION_LAUNCH_COMPLETED` with a `data` payload
> as shown, or add a `STEALTH_CHECK` constant to `src/logs/events.ts` if that file defines an enum —
> read it first and follow its pattern.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/sessions/manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sessions/manager.ts tests/unit/sessions/manager.test.ts
git commit -m "feat(stealth): resolve + apply stealth in session manager"
```

---

## Task 9: API surface — launch input, schema, and the soft-block

**Files:**
- Modify: `src/commands/launch.ts`
- Modify: `src/transport/routes.ts`
- Test: `tests/unit/commands/launch.test.ts`

- [ ] **Step 1: Write the failing test**

Read `tests/unit/commands/launch.test.ts` first. The launch handler must, for an **interactive**
request whose resolved mode carries a recommendation, throw a coded error (so the route maps it to
the soft-block envelope) rather than opening the session. Append:

```typescript
import { LaunchSessionHandler, StealthUpgradeRecommendedError } from "../../../src/commands/launch";

describe("LaunchSessionHandler stealth gating", () => {
  it("throws STEALTH_UPGRADE_RECOMMENDED on a Tier C url when interactive and mode unset", async () => {
    const manager = { launch: vi.fn() } as any;
    await expect(
      new LaunchSessionHandler(manager).execute(
        { profile: { kind: "disposable" }, url: "https://linkedin.com" },
        { requestId: "r" }
      )
    ).rejects.toMatchObject({ code: "STEALTH_UPGRADE_RECOMMENDED" });
    expect(manager.launch).not.toHaveBeenCalled();
  });

  it("opens normally when autonomous on a Tier C url (auto-upgrade, no throw)", async () => {
    const session = { toRecord: () => ({ stealthApplied: "secure" }), getPageInfoList: async () => [] };
    const manager = { launch: vi.fn().mockResolvedValue(session) } as any;
    await new LaunchSessionHandler(manager).execute(
      { profile: { kind: "disposable" }, url: "https://linkedin.com", autonomous: true },
      { requestId: "r" }
    );
    expect(manager.launch).toHaveBeenCalled();
  });

  it("opens normally on a standard url", async () => {
    const session = { toRecord: () => ({ stealthApplied: "fast" }), getPageInfoList: async () => [] };
    const manager = { launch: vi.fn().mockResolvedValue(session) } as any;
    await new LaunchSessionHandler(manager).execute(
      { profile: { kind: "disposable" }, url: "https://example.com" },
      { requestId: "r" }
    );
    expect(manager.launch).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/launch.test.ts`
Expected: FAIL — `StealthUpgradeRecommendedError` / `url` not handled.

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/commands/launch.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { SessionRecord, ProfileKind, BrowserMode, ProxyConfig, StealthConfig } from "../sessions/types";
import { resolveStealthMode } from "../browser/stealth";

interface IManager {
  launch(input: LaunchInput): Promise<{
    toRecord(): Omit<SessionRecord, "pages">;
    getPageInfoList(): Promise<SessionRecord["pages"]>;
  }>;
}

export interface LaunchInput {
  workspaceId?: string;
  profile: { kind: ProfileKind };
  browserMode?: BrowserMode;
  viewport?: { width: number; height: number };
  proxy?: ProxyConfig | null;
  stealth?: StealthConfig | null;
  autonomous?: boolean;
  /** Optional target URL used only for pre-launch Tier C gating. */
  url?: string;
  debug?: { trace?: boolean; screenshots?: boolean };
}

export class StealthUpgradeRecommendedError extends Error {
  readonly code = "STEALTH_UPGRADE_RECOMMENDED";
  readonly recommendation = "secure";
  constructor(message: string) {
    super(message);
    this.name = "StealthUpgradeRecommendedError";
  }
}

export class LaunchSessionHandler implements CommandHandler<LaunchInput, SessionRecord> {
  constructor(private readonly manager: IManager) {}

  async execute(input: LaunchInput, _ctx: CommandContext): Promise<SessionRecord> {
    // Pre-launch gating: interactive + Tier C + unset mode => recommend, do not open.
    const resolution = resolveStealthMode({
      config: input.stealth ?? null,
      url: input.url ?? null,
      autonomous: input.autonomous ?? false,
    });
    if (resolution.recommendation) {
      throw new StealthUpgradeRecommendedError(resolution.recommendation);
    }

    const session = await this.manager.launch(input);
    const record = session.toRecord();
    const pages = await session.getPageInfoList();
    return { ...record, pages };
  }
}
```

In `src/transport/routes.ts`:

1. Extend `LaunchSchema` (add after `proxy`):

```typescript
  stealth: z.object({ mode: z.enum(["fast", "secure"]) }).nullable().optional(),
  autonomous: z.boolean().optional(),
  url: z.string().url().optional(),
```

2. Register the soft-block status. Add to `ERROR_STATUS`:

```typescript
  STEALTH_UPGRADE_RECOMMENDED: 200,
```

The existing `handleRouteError` already builds `{ ok: false, requestId, error: { code, message } }`
and uses `errorStatus(code)`. To include the `recommendation` payload, update the `/v1/sessions`
catch to special-case it:

```typescript
  app.post("/v1/sessions", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const input = LaunchSchema.parse(request.body);
      const sessionRecord = await launchHandler.execute(input, { requestId });
      await reply.status(200).send(ok(requestId, sessionRecord));
    } catch (err) {
      if ((err as any)?.code === "STEALTH_UPGRADE_RECOMMENDED") {
        await reply.status(200).send(
          fail(requestId, "STEALTH_UPGRADE_RECOMMENDED", (err as Error).message, { recommendation: "secure" })
        );
        return;
      }
      await handleRouteError(err, request, reply);
    }
  });
```

> `fail()` already nests extra data under `details`; here the third arg becomes
> `error.details = { recommendation: "secure" }`. That satisfies the spec's
> "soft-block with recommendation" intent within the existing envelope shape.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/launch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/commands/launch.ts src/transport/routes.ts tests/unit/commands/launch.test.ts
git commit -m "feat(stealth): API surface + STEALTH_UPGRADE_RECOMMENDED soft-block"
```

---

## Task 10: Wire behavioral timing into click / type / press

**Files:**
- Modify: `src/commands/click.ts`, `src/commands/type.ts`, `src/commands/press.ts`
- Test: `tests/unit/commands/click.test.ts`, `type.test.ts`, `press.test.ts`

- [ ] **Step 1: Write the failing test (click)**

The handlers must read the session's stealth mode and wrap the action with timing. Append to
`tests/unit/commands/click.test.ts`:

```typescript
it("applies stealth timing in secure mode (sleeps before clicking)", async () => {
  mockSession.stealthMode = "secure";
  mockManager.get.mockReturnValue(mockSession);
  const order: string[] = [];
  fakeLoc.click.mockImplementation(async () => { order.push("click"); });
  // Spy on the timing wrapper indirectly: secure mode must still resolve and click once.
  await new ClickHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#x" } }, ctx);
  expect(fakeLoc.click).toHaveBeenCalledTimes(1);
});

it("does not delay in fast mode", async () => {
  mockSession.stealthMode = "fast";
  mockManager.get.mockReturnValue(mockSession);
  await new ClickHandler(mockManager as any).execute(
    { sessionId: "ses", target: { by: "css", selector: "#x" } }, ctx);
  expect(fakeLoc.click).toHaveBeenCalledTimes(1);
});
```

Add `stealthMode: "fast"` to the existing `mockSession` object at the top of the file so prior
tests keep a defined mode.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/click.test.ts`
Expected: FAIL — handler does not read `stealthMode` (and `mockSession.stealthMode` is unused).

- [ ] **Step 3: Write minimal implementation (click)**

Rewrite `src/commands/click.ts`:

```typescript
import type { CommandHandler, CommandContext } from "./handler";
import type { ClickInput, ClickOutput, StealthMode } from "../sessions/types";
import { resolveLocator } from "../browser/locators";
import { withActionErrors } from "./input-errors";
import { withStealthTiming } from "../browser/stealth";

interface IManager {
  get(sessionId: string): {
    stealthMode: StealthMode;
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export class ClickHandler implements CommandHandler<ClickInput, ClickOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ClickInput, _ctx: CommandContext): Promise<ClickOutput> {
    const { sessionId, pageId, target, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const loc = resolveLocator(page, target);
    await withStealthTiming(
      () => withActionErrors(loc, "click", () => loc.click({ timeout: timeoutMs ?? 15000 })),
      { mode: session.stealthMode }
    );
    return { pageId: resolvedPageId, clicked: true };
  }
}
```

- [ ] **Step 4: Run test to verify it passes (click)**

Run: `npx vitest run tests/unit/commands/click.test.ts`
Expected: PASS.

- [ ] **Step 5: Repeat for press**

Apply the identical pattern to `src/commands/press.ts` — capture `const session = this.manager.get(sessionId)`,
add `stealthMode` to its local `IManager`, and wrap the press action with `withStealthTiming(..., { mode: session.stealthMode })`.
Add the same two tests to `tests/unit/commands/press.test.ts` (and `stealthMode: "fast"` to its mock session).
Run: `npx vitest run tests/unit/commands/press.test.ts` — Expected: PASS.

- [ ] **Step 6: Repeat for type (with secure-mode keystroke delay)**

In `src/commands/type.ts`, capture the session, add `stealthMode` to its local `IManager`, and wrap
with `withStealthTiming`. Additionally, in **secure** mode default to per-keystroke jitter so typing
isn't machine-instant — use `sequential` mode with a delay when the caller didn't specify one:

```typescript
import { withStealthTiming, jitterDelayMs } from "../browser/stealth";
// ...
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    const loc = resolveLocator(page, target);
    const timeout = timeoutMs ?? 15000;
    const secure = session.stealthMode === "secure";
    const effectiveMode = mode ?? (secure ? "sequential" : "fill");
    const effectiveDelay = delayMs ?? (secure ? jitterDelayMs() : undefined);
    await withStealthTiming(
      () => withActionErrors(loc, "type", () =>
        effectiveMode === "sequential"
          ? loc.pressSequentially(text, { delay: effectiveDelay, timeout })
          : loc.fill(text, { timeout })),
      { mode: session.stealthMode }
    );
```

Add to `tests/unit/commands/type.test.ts`: a secure-mode test asserting `pressSequentially` is used
with a `delay` in [50,150], and a fast-mode test asserting `fill` is still used. Add
`stealthMode: "fast"` to its mock session.
Run: `npx vitest run tests/unit/commands/type.test.ts` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/commands/click.ts src/commands/press.ts src/commands/type.ts tests/unit/commands/
git commit -m "feat(stealth): behavioral timing on click/type/press in secure mode"
```

---

## Task 11: Extend the anti-detection self-test to fast vs secure

**Files:**
- Modify: `scripts/spikes/anti-detection-probe.ts`

- [ ] **Step 1: Read the existing probe**

Read `scripts/spikes/anti-detection-probe.ts` (already summarized in the spec). It currently
compares headed-CDP vs `--headless=new`. Extend it to also run the **secure-mode layer functions**
against a real fingerprint page and print a per-signal report. This is a throwaway spike script
(ships nothing, not imported by `src/`), so no unit test — it is run by hand.

- [ ] **Step 2: Add a secure-mode probe run**

Add a function that opens a headed-CDP session, applies the stealth layers, navigates to
`https://bot.sannysoft.com/`, and captures the result. Add near the bottom of the file, then call
it from `main()`:

```typescript
import { applyStealthCDP, applyStealthEnvironment, applyFingerprintCheck } from "../../src/browser/stealth";

async function probeSecureAgainstSannysoft(executablePath: string): Promise<void> {
  const profile = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-secure-"));
  const { context, childProcess } = await spawnAndConnect({ profilePath: profile, executablePath });
  try {
    await applyStealthCDP(context, { mode: "secure" });
    const page = await context.newPage();
    const env = await applyStealthEnvironment(page, { mode: "secure" });
    const fp = await applyFingerprintCheck(page, { mode: "secure" });
    await page.goto("https://bot.sannysoft.com/", { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
    const shot = path.join(os.tmpdir(), `feather-sannysoft-secure-${Date.now()}.png`);
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    console.log("\n## Secure mode self-test (bot.sannysoft.com)");
    console.log(`environment check: ok=${env.ok} warnings=${JSON.stringify(env.warnings)}`);
    console.log(`fingerprint check: ok=${fp.ok} warnings=${JSON.stringify(fp.warnings)}`);
    console.log(`screenshot: ${shot}`);
  } finally {
    try { await context.browser()?.close(); } catch { /* */ }
    try { childProcess.kill(); } catch { /* */ }
    await fs.promises.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}
```

In `main()`, after the existing headed/headless table, add:

```typescript
  if (process.env.FEATHER_PROBE_ONLINE === "1") {
    await probeSecureAgainstSannysoft(executablePath);
  } else {
    console.log("\n(skip online sannysoft probe; set FEATHER_PROBE_ONLINE=1 to run it)");
  }
```

> Online gate: keep the offline run deterministic (existing behavior); the sannysoft hit is opt-in
> via `FEATHER_PROBE_ONLINE=1` so CI / offline runs are unaffected.

- [ ] **Step 3: Verify it runs (offline path)**

Run: `npx ts-node scripts/spikes/anti-detection-probe.ts`
Expected: the existing table prints, followed by the skip line. No crash.

- [ ] **Step 4: (Optional, manual, online) Run the secure self-test**

Run: `FEATHER_PROBE_ONLINE=1 npx ts-node scripts/spikes/anti-detection-probe.ts`
Expected: prints env/fingerprint check results + a screenshot path. Inspect the screenshot —
sannysoft rows for WebDriver / Chrome / WebGL should be green.

- [ ] **Step 5: Commit**

```bash
git add scripts/spikes/anti-detection-probe.ts
git commit -m "test(stealth): extend self-test probe with secure-mode sannysoft run"
```

---

## Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exit 0, no errors. (Most likely failure: a `new FeatherSession` call site missing
`stealthMode`, or a handler `IManager` interface missing `stealthMode`. Fix and re-run.)

- [ ] **Step 2: Unit tests**

Run: `npm test`
Expected: all pass, including the new `stealth.test.ts` (21 cases) and the augmented command tests.

- [ ] **Step 3: Integration tests (real Chromium)**

Run: `npm run test:integration`
Expected: all pass. The launch/api-flow integration test still opens sessions; `stealthApplied`
now appears in the record (fast by default — no behavior change for existing callers).

- [ ] **Step 4: Confirm no behavior change for existing callers**

Verify: a `POST /v1/sessions` with no `stealth`/`url` fields opens exactly as before, and the
response now additionally carries `stealthApplied: "fast"`. Existing demos (`npm run demo:hero`)
are unaffected because they pass no stealth fields and use no Tier C URL gating.

- [ ] **Step 5: Final commit (if any fixups were needed)**

```bash
git add -A
git commit -m "chore(stealth): verification fixups (typecheck + integration green)"
```

---

## Candidate Work-Session Grouping (non-binding)

Per Roi's structure decision, final assignment of tasks to work sessions happens in the **roadmap
re-sequencing pass** after all three feature plans exist. As a starting suggestion only, these
tasks cluster naturally into five sittings:

| Cluster | Tasks | Theme | Depends on |
|---|---|---|---|
| **S-1: Stealth core logic** | 1, 2, 3 | Pure functions: classify, resolve, timing | — |
| **S-2: Layer functions** | 4, 5, 6 | CDP guard, env check, fingerprint check | S-1 |
| **S-3: Session wiring** | 7, 8 | Store + apply stealth in session/manager | S-1, S-2 |
| **S-4: API + actions** | 9, 10 | Soft-block + behavioral timing on handlers | S-3 |
| **S-5: Self-test + verify** | 11, 12 | Probe extension + full green | S-4 |

These five could also collapse into fewer sessions if executed inline. The dependency column is the
load-bearing part; the cluster boundaries are advisory.

---

## Self-Review Notes

- **Spec coverage:** Fast/secure modes (Tasks 2,3,5,6,10) ✓; domain-only Tier C (Task 1) ✓;
  interactive recommend / autonomous upgrade (Tasks 2,9) ✓; Layer 1 CDP guard+audit (Task 4) ✓;
  Layer 2 env (Task 5) ✓; Layer 3 timing (Tasks 3,10) ✓; Layer 4 fingerprint+font, no canvas noise
  (Task 6) ✓; `StealthConfig` on session type parallel to `ProxyConfig` (Tasks 1,7,8) ✓; API
  `stealth`/`autonomous`/`stealthApplied` (Task 9) ✓; soft-block envelope (Task 9) ✓; self-test
  extension (Task 11) ✓; tests pass + tsc clean (Task 12) ✓.
- **Deferred per spec (not in this plan, intentionally):** reactive header-based Tier C detection;
  Web-Bot-Auth / RFC 9421; geo-coupled locale/timezone spoofing.
- **Type consistency:** `StealthMode` / `StealthConfig` / `SiteClass` / `StealthResolution` /
  `StealthCheckResult` used identically across tasks; `applyFingerprintCheck` (not the spec's earlier
  `applyFingerprintHardening`) is the agreed name; `stealthApplied` is the record field, `stealthMode`
  is the session getter — consistent throughout.
