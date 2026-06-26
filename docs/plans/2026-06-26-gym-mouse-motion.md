# Gym Mouse-Motion Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Feather a dedicated, tunable cursor-move capability so the gym can generate a real mouse trajectory and flip `bot.incolumitas`'s behavioral score off `UNSCORED` — then climb it via trials.

**Architecture:** A pure path generator (`mouse-path.ts`) produces curved, variable-velocity waypoints. A new `move` command drives `page.mouse.move` along them, exposed at `POST /v1/sessions/:id/move`. The gym wanders the cursor across the scoring windows and logs *motion-config → score* as a trial row.

**Tech Stack:** TypeScript 5.4 / Node 20 / Playwright `page.mouse` (native; no CDP) / Zod / Vitest / Fastify.

## Global Constraints

- **Gym is HTTP-only:** `gym/*` MUST NOT import from `src/` — drive Feather over the HTTP API. (Verbatim project rule.)
- **Verify-don't-spoof:** no fingerprint spoofing; motion is real input delivery, not a faked fingerprint. Consistent with `src/browser/stealth.ts`.
- **Native first:** use Playwright `page.mouse` — do NOT reach for CDP `Input.dispatchMouseEvent` unless a trial proves `page.mouse` caps the score (that escalation is 5d.4, out of scope here).
- **Honest tests:** the live gym run is against the real detector Roi does not control and may legitimately fail/under-score; a recorded low/UNSCORED result is a result, not a failure to hide.
- **TDD + frequent commits.** Tasks 1–3 are red→green→commit. Tasks 4–5 are wiring + live verification.
- Branch: `dev` (current). One commit per task.

---

### Task 1: Pure path generator `mouse-path.ts`

**Files:**
- Create: `src/browser/mouse-path.ts`
- Test: `tests/unit/browser/mouse-path.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, no imports).
- Produces:
  - `interface Point { x: number; y: number }`
  - `interface Waypoint { x: number; y: number; delayMs: number }`
  - `interface MousePathOpts { steps?: number; curviness?: number; jitter?: number; overshoot?: number; minDelayMs?: number; maxDelayMs?: number; seed?: number }`
  - `function mousePath(from: Point, to: Point, opts?: MousePathOpts): Waypoint[]`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/browser/mouse-path.test.ts
import { describe, it, expect } from "vitest";
import { mousePath } from "../../../src/browser/mouse-path";

describe("mousePath", () => {
  it("starts at `from`, ends exactly at `to`", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 7 });
    expect(path[0]).toMatchObject({ x: 0, y: 0 });
    const last = path[path.length - 1];
    expect(last.x).toBe(100);
    expect(last.y).toBe(0);
  });

  it("bows off the straight line (a horizontal request is not collinear)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 0 }, { seed: 7 });
    expect(path.some((w) => Math.abs(w.y) > 1)).toBe(true); // curved, not a straight y=0 line
  });

  it("has non-uniform per-step delays (variable velocity)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 200, y: 120 }, { seed: 7 });
    const delays = new Set(path.map((w) => w.delayMs));
    expect(delays.size).toBeGreaterThan(1);
  });

  it("is deterministic for a given seed and varies across seeds", () => {
    const a = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 1 });
    const b = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 1 });
    const c = mousePath({ x: 10, y: 10 }, { x: 300, y: 200 }, { seed: 2 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("returns a single waypoint when from === to", () => {
    const path = mousePath({ x: 50, y: 50 }, { x: 50, y: 50 }, { seed: 1 });
    expect(path).toHaveLength(1);
    expect(path[0]).toMatchObject({ x: 50, y: 50 });
  });

  it("zero delay range yields zero-delay waypoints (fast tests / no waits)", () => {
    const path = mousePath({ x: 0, y: 0 }, { x: 100, y: 100 }, { seed: 1, minDelayMs: 0, maxDelayMs: 0 });
    expect(path.every((w) => w.delayMs === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/mouse-path.test.ts`
Expected: FAIL — `Cannot find module '.../mouse-path'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/browser/mouse-path.ts
// Pure, seedable human-like cursor path generator. No Playwright, no I/O — testable in isolation.
// Consumed by src/commands/move.ts, which drives page.mouse.move waypoint-by-waypoint.

export interface Point { x: number; y: number; }
export interface Waypoint { x: number; y: number; delayMs: number; }

export interface MousePathOpts {
  steps?: number;        // intermediate samples (default 25) — path length is steps+1
  curviness?: number;    // perpendicular bow as a fraction of distance (default 0.15)
  jitter?: number;       // per-step timing jitter, 0..1 (default 0.3)
  overshoot?: number;    // overshoot past target as a fraction of distance, 0 = off (default 0)
  minDelayMs?: number;   // per-step delay floor (default 8)
  maxDelayMs?: number;   // per-step delay ceiling (default 25)
  seed?: number;         // when set, output is deterministic; else random per call
}

const DEFAULTS = { steps: 25, curviness: 0.15, jitter: 0.3, overshoot: 0, minDelayMs: 8, maxDelayMs: 25 };

/** mulberry32 — tiny deterministic PRNG so a seed fully determines the path. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * A curved, variable-velocity path of waypoints from `from` to `to`.
 * Curve = cubic Bezier with randomized perpendicular control offsets (straight lines are the tell).
 * Velocity = ease-in-out sampling (slow-fast-slow) + jittered per-step delayMs.
 * Deterministic when `opts.seed` is set.
 */
export function mousePath(from: Point, to: Point, opts: MousePathOpts = {}): Waypoint[] {
  const o = { ...DEFAULTS, ...opts };
  const seed = opts.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rand = makeRng(seed);

  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return [{ x: to.x, y: to.y, delayMs: o.minDelayMs }];

  const px = -dy / dist, py = dx / dist;           // unit perpendicular to the straight line
  const bow = () => (rand() * 2 - 1) * o.curviness * dist;
  const lerp = (t: number): Point => ({ x: from.x + dx * t, y: from.y + dy * t });
  const c1 = lerp(1 / 3), c2 = lerp(2 / 3);
  const off1 = bow(), off2 = bow();
  const p1: Point = { x: c1.x + px * off1, y: c1.y + py * off1 };
  const p2: Point = { x: c2.x + px * off2, y: c2.y + py * off2 };

  const baseDelay = (o.minDelayMs + o.maxDelayMs) / 2;
  const out: Waypoint[] = [];
  for (let i = 0; i <= o.steps; i++) {
    const t = easeInOut(i / o.steps);
    const pt = cubicBezier(from, p1, p2, to, t);
    const jittered = Math.round(baseDelay * (1 + (rand() * 2 - 1) * o.jitter));
    const delayMs = Math.max(o.minDelayMs, Math.min(o.maxDelayMs, jittered));
    out.push({ x: pt.x, y: pt.y, delayMs });
  }

  if (o.overshoot > 0) {
    const ox = to.x + (dx / dist) * o.overshoot * dist;
    const oy = to.y + (dy / dist) * o.overshoot * dist;
    const settle = Math.max(o.minDelayMs, Math.round(baseDelay));
    out.push({ x: ox, y: oy, delayMs: settle });
    out.push({ x: to.x, y: to.y, delayMs: settle });
  } else {
    out[out.length - 1] = { ...out[out.length - 1], x: to.x, y: to.y }; // land exactly on target
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/mouse-path.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/browser/mouse-path.ts tests/unit/browser/mouse-path.test.ts
git commit -m "feat(gym): pure seedable human-like mouse-path generator"
```

---

### Task 2: Expose `boundingBox` on the `Actionable` surface

**Files:**
- Modify: `src/browser/locators.ts` (interface `Actionable` + both branches in `resolveActionable`)
- Test: `tests/unit/browser/locators.test.ts` (add cases)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Actionable.boundingBox(options?: { timeout?: number }): Promise<{ x: number; y: number; width: number; height: number } | null>`

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/browser/locators.test.ts`:

```ts
import { resolveActionable } from "../../../src/browser/locators";

describe("resolveActionable boundingBox", () => {
  it("locator branch delegates boundingBox to the locator", async () => {
    const loc = {
      first: () => loc, last: () => loc, nth: () => loc,
      boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 20, width: 30, height: 40 }),
      count: vi.fn().mockResolvedValue(1),
    } as any;
    const page = { locator: () => loc } as any;
    const { act } = resolveActionable(page, { by: "css", selector: "#x" });
    await expect(act.boundingBox({ timeout: 1000 })).resolves.toEqual({ x: 10, y: 20, width: 30, height: 40 });
    expect(loc.boundingBox).toHaveBeenCalledWith({ timeout: 1000 });
  });

  it("ref branch delegates boundingBox to the element handle", async () => {
    const handle = { boundingBox: vi.fn().mockResolvedValue({ x: 1, y: 2, width: 3, height: 4 }) } as any;
    const refLookup = (_r: string) => handle;
    const { act } = resolveActionable({} as any, { by: "ref", ref: "e1" }, refLookup);
    await expect(act.boundingBox()).resolves.toEqual({ x: 1, y: 2, width: 3, height: 4 });
    expect(handle.boundingBox).toHaveBeenCalled();
  });
});
```

> Note: `tests/unit/browser/locators.test.ts` already imports `vi`/`describe`/`it`/`expect` from vitest. If a needed import is missing, add it to the existing top-of-file import.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/browser/locators.test.ts`
Expected: FAIL — `act.boundingBox is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `src/browser/locators.ts`, add to the `Actionable` interface (after `typeSequentially`):

```ts
  boundingBox(options?: { timeout?: number }): Promise<{ x: number; y: number; width: number; height: number } | null>;
```

In `resolveActionable`, add to the **ref** branch `act` object (handle ignores the options arg):

```ts
        boundingBox: () => handle.boundingBox(),
```

And to the **locator** branch `act` object:

```ts
      boundingBox: (o) => loc.boundingBox(o),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/browser/locators.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/browser/locators.ts tests/unit/browser/locators.test.ts
git commit -m "feat(gym): expose boundingBox on Actionable for cursor targeting"
```

---

### Task 3: `MoveHandler` command + types

**Files:**
- Modify: `src/sessions/types.ts` (add `MoveInput`/`MoveOutput`, import `MousePathOpts`)
- Create: `src/commands/move.ts`
- Test: `tests/unit/commands/move.test.ts`

**Interfaces:**
- Consumes: `mousePath`, `Point`, `MousePathOpts` (Task 1); `resolveActionable` + `Actionable.boundingBox` (Task 2); `assertPageNotPaused`, `withActionErrors`, `isNavigationTeardown`, `ElementNotActionableError` (existing).
- Produces:
  - `interface MoveInput { sessionId: string; pageId?: string; target?: Target; x?: number; y?: number; opts?: MousePathOpts; timeoutMs?: number }`
  - `interface MoveOutput { pageId: string; x: number; y: number; steps: number; navigated?: true }`
  - `class MoveHandler` with `execute(input: MoveInput, ctx): Promise<MoveOutput>`

- [ ] **Step 1: Add the types**

In `src/sessions/types.ts`, add an import at the top (next to the other type imports):

```ts
import type { MousePathOpts } from "../browser/mouse-path";
```

And add near `ClickInput`/`ClickOutput`:

```ts
export interface MoveInput {
  sessionId: string; pageId?: string;
  target?: Target; x?: number; y?: number;
  opts?: MousePathOpts; timeoutMs?: number;
}
export interface MoveOutput { pageId: string; x: number; y: number; steps: number; navigated?: true; }
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/commands/move.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MoveHandler } from "../../../src/commands/move";
import { resolveActionable } from "../../../src/browser/locators";

vi.mock("../../../src/browser/locators", () => ({ resolveActionable: vi.fn() }));

const ZERO_DELAY = { seed: 1, minDelayMs: 0, maxDelayMs: 0 }; // no real setTimeout waits in tests
const mockMouse = { move: vi.fn().mockResolvedValue(undefined) };
const mockPage = { mouse: mockMouse, viewportSize: () => ({ width: 1280, height: 800 }) };
const mockSession = {
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
  getObserveCache: vi.fn().mockReturnValue(undefined),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test" };

describe("MoveHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockSession.getObserveCache.mockReturnValue(undefined);
    mockManager.get.mockReturnValue(mockSession);
  });

  it("moves to explicit coordinates along a multi-step path ending on target", async () => {
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", x: 400, y: 300, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls.length).toBeGreaterThan(1);   // a path, not a teleport
    const lastCall = mockMouse.move.mock.calls.at(-1);
    expect(lastCall).toEqual([400, 300]);                          // lands exactly on target
    expect(result).toMatchObject({ pageId: "page_001", x: 400, y: 300 });
    expect(result.steps).toBe(mockMouse.move.mock.calls.length);
  });

  it("moves to a target's bounding-box center", async () => {
    (resolveActionable as any).mockReturnValue({
      act: { boundingBox: vi.fn().mockResolvedValue({ x: 100, y: 100, width: 40, height: 20 }) },
      probe: vi.fn().mockResolvedValue(1),
    });
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#btn" }, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls.at(-1)).toEqual([120, 110]);  // center = (100+40/2, 100+20/2)
    expect(result).toMatchObject({ x: 120, y: 110 });
  });

  it("throws when the target has no bounding box", async () => {
    (resolveActionable as any).mockReturnValue({
      act: { boundingBox: vi.fn().mockResolvedValue(null) },
      probe: vi.fn().mockResolvedValue(1),
    });
    await expect(new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", target: { by: "css", selector: "#gone" }, opts: ZERO_DELAY }, ctx))
      .rejects.toThrow(/bounding box/i);
  });

  it("returns navigated when the move dies to navigation teardown", async () => {
    mockMouse.move.mockRejectedValueOnce(new Error("Execution context was destroyed, navigation"));
    const result = await new MoveHandler(mockManager as any).execute(
      { sessionId: "ses", x: 10, y: 10, opts: ZERO_DELAY }, ctx);
    expect(result).toMatchObject({ navigated: true });
  });

  it("continues the next move from where the last one ended (no teleport reset)", async () => {
    await new MoveHandler(mockManager as any).execute({ sessionId: "ses", x: 200, y: 200, opts: ZERO_DELAY }, ctx);
    mockMouse.move.mockClear();
    await new MoveHandler(mockManager as any).execute({ sessionId: "ses", x: 800, y: 600, opts: ZERO_DELAY }, ctx);
    expect(mockMouse.move.mock.calls[0]).toEqual([200, 200]); // 2nd path starts at 1st path's end
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/commands/move.test.ts`
Expected: FAIL — `Cannot find module '.../commands/move'`.

- [ ] **Step 4: Write minimal implementation**

```ts
// src/commands/move.ts
import type { CommandHandler, CommandContext } from "./handler";
import type { MoveInput, MoveOutput } from "../sessions/types";
import type { Page, ElementHandle } from "playwright";
import { resolveActionable } from "../browser/locators";
import { mousePath, type Point } from "../browser/mouse-path";
import { withActionErrors, isNavigationTeardown, ElementNotActionableError } from "./input-errors";
import { assertPageNotPaused } from "./pause-registry";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: Page };
    getObserveCache(pageId: string): { refs: Map<string, ElementHandle> } | undefined;
  };
}

// Playwright doesn't expose the pointer's current position; remember where we left it per page so
// the next move starts a continuous path instead of teleporting back to a default origin each call.
const lastPos = new WeakMap<Page, Point>();
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function startPoint(page: Page): Point {
  const known = lastPos.get(page);
  if (known) return known;
  const vp = page.viewportSize();
  return vp ? { x: Math.round(vp.width / 2), y: Math.round(vp.height / 2) } : { x: 0, y: 0 };
}

export class MoveHandler implements CommandHandler<MoveInput, MoveOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: MoveInput, _ctx: CommandContext): Promise<MoveOutput> {
    const { sessionId, pageId, target, x, y, opts, timeoutMs } = input;
    const session = this.manager.get(sessionId);
    const { pageId: resolvedPageId, page } = session.getPage(pageId);
    assertPageNotPaused(sessionId, resolvedPageId); // a human in control of this page blocks agent motion

    let dest: Point;
    if (target) {
      const refLookup = (r: string) => session.getObserveCache(resolvedPageId)?.refs.get(r);
      const { act, probe } = resolveActionable(page, target, refLookup);
      const box = await withActionErrors(probe, "move", () => act.boundingBox({ timeout: timeoutMs ?? 15000 }));
      if (!box) throw new ElementNotActionableError(`Target for "move" has no bounding box (not visible).`);
      dest = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    } else {
      dest = { x: x as number, y: y as number };
    }

    const path = mousePath(startPoint(page), dest, opts);
    try {
      for (const wp of path) {
        await page.mouse.move(wp.x, wp.y);
        if (wp.delayMs > 0) await sleep(wp.delayMs);
      }
    } catch (err) {
      if (isNavigationTeardown(err)) {
        lastPos.set(page, dest);
        return { pageId: resolvedPageId, x: dest.x, y: dest.y, steps: path.length, navigated: true };
      }
      throw err;
    }
    lastPos.set(page, dest);
    return { pageId: resolvedPageId, x: dest.x, y: dest.y, steps: path.length };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/commands/move.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/sessions/types.ts src/commands/move.ts tests/unit/commands/move.test.ts
git commit -m "feat(gym): MoveHandler — drive page.mouse along a generated path"
```

---

### Task 4: Wire the `POST /v1/sessions/:id/move` route

**Files:**
- Modify: `src/transport/routes.ts` (import, Zod schemas, handler instance, route)

**Interfaces:**
- Consumes: `MoveHandler` (Task 3), `MoveInput` type, existing `TargetSchema`, `tokenAuth`, `getRequestId`, `ok`, `handleRouteError`.
- Produces: `POST /v1/sessions/:sessionId/move` (envelope `{ ok, requestId, data }`).

- [ ] **Step 1: Add the import**

Near the other command imports (the `ClickHandler` import is at `src/transport/routes.ts:25`), add:

```ts
import { MoveHandler } from "../commands/move";
```

And add `MoveInput` to the existing `../sessions/types` type import group used by routes (the file already imports input types like `WaitInput`, `AwaitHumanInput`).

- [ ] **Step 2: Add the Zod schemas**

After `ClickSchema` (`src/transport/routes.ts:133-137`), add:

```ts
const MousePathOptsSchema = z.object({
  steps: z.number().int().positive().optional(),
  curviness: z.number().min(0).optional(),
  jitter: z.number().min(0).optional(),
  overshoot: z.number().min(0).optional(),
  minDelayMs: z.number().int().nonnegative().optional(),
  maxDelayMs: z.number().int().nonnegative().optional(),
  seed: z.number().int().optional(),
});

const MoveSchema = z
  .object({
    pageId: z.string().optional(),
    target: TargetSchema.optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    opts: MousePathOptsSchema.optional(),
    timeoutMs: z.number().int().positive().optional(),
  })
  .refine(
    (d) => (d.target !== undefined) !== (d.x !== undefined && d.y !== undefined),
    { message: "provide either `target` or both `x` and `y` (exactly one)" },
  );
```

- [ ] **Step 3: Instantiate the handler**

Next to `const clickHandler = new ClickHandler(manager);` (`src/transport/routes.ts:247`), add:

```ts
  const moveHandler = new MoveHandler(manager);
```

- [ ] **Step 4: Add the route**

After the `/click` route block (`src/transport/routes.ts:424-432`), add:

```ts
  app.post("/v1/sessions/:sessionId/move", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = MoveSchema.parse(request.body);
      const result = await moveHandler.execute({ sessionId, ...input } as MoveInput, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
```

- [ ] **Step 5: Typecheck + full unit suite**

Run: `npm run typecheck && npm test`
Expected: typecheck clean; suite green (prior count + the new Task 1/2/3 tests).

- [ ] **Step 6: Live smoke (honest, real server)**

Start the server in one shell (`npm run dev`), then in another:

```bash
EP=$(cat "$XDG_RUNTIME_DIR/feather/run/endpoint.json"); BASE=$(echo "$EP" | python3 -c 'import sys,json;print(json.load(sys.stdin)["baseUrl"])'); TOK=$(cat "$XDG_RUNTIME_DIR/feather/run/control-token")
SID=$(curl -s -X POST "$BASE/v1/sessions" -H "X-Feather-Token: $TOK" -H 'Content-Type: application/json' -d '{"profile":{"kind":"disposable"}}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["sessionId"])')
curl -s -X POST "$BASE/v1/sessions/$SID/navigate" -H "X-Feather-Token: $TOK" -H 'Content-Type: application/json' -d '{"url":"https://example.com","waitUntil":"domcontentloaded"}' >/dev/null
curl -s -X POST "$BASE/v1/sessions/$SID/move" -H "X-Feather-Token: $TOK" -H 'Content-Type: application/json' -d '{"x":400,"y":300,"opts":{"seed":1}}'
curl -s -X DELETE "$BASE/v1/sessions/$SID" -H "X-Feather-Token: $TOK" -H 'Content-Type: application/json' -d '{}' >/dev/null
```

Expected: the move call returns `{"ok":true,...,"data":{"pageId":...,"x":400,"y":300,"steps":<n>}}`.
(Stop the server by pid from `endpoint.json` — never `pkill -f`.)

- [ ] **Step 7: Commit**

```bash
git add src/transport/routes.ts
git commit -m "feat(gym): POST /v1/sessions/:id/move route"
```

---

### Task 5: Gym wander + trial log

**Files:**
- Modify: `gym/behavioral.ts` (add `move` helper, wander the cursor, log motion config)
- Modify: `gym/results.md` (one-time: add a `Motion` column to the existing header)

**Interfaces:**
- Consumes: the live `/move` route (Task 4); existing `feather`, `navigate`, `snapshot`, `shoot`, `close`, `sleep`, `classify`.
- Produces: an updated `results.md` row shape with a `Motion` column; `move` added to the reusable export surface.
- **Constraint reminder:** `gym/behavioral.ts` MUST NOT import from `src/`. The motion `opts` is a plain JSON object sent over HTTP — no type import.

- [ ] **Step 1: Add a `move` HTTP helper**

In `gym/behavioral.ts`, next to the other session helpers (after `snapshot`):

```ts
const move = (sid: string, body: Record<string, unknown>) =>
  feather<{ x: number; y: number; steps: number }>("POST", `/v1/sessions/${sid}/move`, body);
```

- [ ] **Step 2: Define the motion trial config**

Above `run()`, add (these knobs are what you turn between trials):

```ts
// MOTION — the trial knobs. Change these, re-run, read results.md to see motion -> score.
const MOTION = {
  label: "v1-bezier-varspeed",
  opts: { steps: 30, curviness: 0.2, jitter: 0.35, overshoot: 0.05 },
  // wander points across the 1280x800 viewport; ~6 moves over ~15s straddle the
  // detector's 1.5/4/7/10/15s scoring windows (recon-findings.md §4).
  waypoints: [
    { x: 200, y: 180 }, { x: 950, y: 240 }, { x: 600, y: 600 },
    { x: 300, y: 500 }, { x: 1050, y: 650 }, { x: 500, y: 300 },
  ] as { x: number; y: number }[],
};
```

- [ ] **Step 3: Replace the "no interaction" wait with the wander**

In `run()`, replace this block:

```ts
    await navigate(sid, "https://bot.incolumitas.com/");
    // No synthetic interaction: the missing signal IS cursor motion (the upgrade under test).
    // The score auto-updates at 1.5/4/7/10/15s — wait past the last window, then read.
    await sleep(17000);
```

with:

```ts
    await navigate(sid, "https://bot.incolumitas.com/");
    // Generate a real cursor trajectory — the signal the behavioral classifier needs to score us.
    // Wander across the viewport, pausing to straddle the 1.5/4/7/10/15s scoring windows.
    for (const wp of MOTION.waypoints) {
      await move(sid, { x: wp.x, y: wp.y, opts: MOTION.opts });
      await sleep(2500);
    }
    await sleep(2000); // settle past the final (15s) scoring window before reading
```

- [ ] **Step 4: Log the motion config alongside the score**

Change `appendResult` to take and record the motion label. Replace the function with:

```ts
function appendResult(v: Verdict, shot: string, motion: string): void {
  const file = join(__dirname, "results.md");
  if (!existsSync(file)) {
    writeFileSync(
      file,
      "# Gym — Behavioral Diagnostic Results\n\n" +
        "Honest record. UNSCORED counts as FAIL (an unscoreable session is itself a tell).\n\n" +
        "| When (UTC) | State | Score | Verdict | Motion | Evidence | Notes |\n" +
        "|---|---|---|---|---|---|---|\n",
    );
  }
  const rel = relative(__dirname, shot);
  appendFileSync(
    file,
    `| ${new Date().toISOString()} | ${v.state} | ${v.score ?? "—"} | ${v.outcome} | ${motion} | ${rel} | ${v.reason} |\n`,
  );
}
```

And update its call site in `run()`:

```ts
    appendResult(verdict, shot, MOTION.label);
```

- [ ] **Step 5: Add `move` to the reusable export surface**

Update the final export line so Step 2's scoreboard wire can reuse motion:

```ts
export { feather, launchHeaded, navigate, snapshot, shoot, close, sleep, move };
```

- [ ] **Step 6: Migrate the existing `results.md` header (one-time)**

The existing `gym/results.md` header has 6 columns. Add the `Motion` column so old + new rows align. Change the header line:

```
| When (UTC) | State | Score | Verdict | Evidence | Notes |
```
to
```
| When (UTC) | State | Score | Verdict | Motion | Evidence | Notes |
```
and the separator line `|---|---|---|---|---|---|` to `|---|---|---|---|---|---|---|`.
(Leave the existing Step-1 row's Motion cell empty — it predates motion.)

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 8: Live run (honest, can-fail)**

With the server running (headed; shell has `WAYLAND_DISPLAY`/`DISPLAY`):

Run: `npm run gym:behavioral`
Expected: a Chromium window opens, the cursor visibly wanders bot.incolumitas, then a verdict prints and a row lands in `results.md`. **Success = the score reads a number (off `...`).** A still-`UNSCORED` or low score is a recorded honest result — note it; that's the trial loop, not a failure to hide. If still UNSCORED, the next move is a trial: adjust `MOTION` knobs and/or confirm `page.mouse` motion is reaching the page, before considering the CDP escalation (out of scope here).

- [ ] **Step 9: Commit**

```bash
git add gym/behavioral.ts gym/results.md gym/runs
git commit -m "feat(gym): wander cursor over the scoring windows + log motion->score trials"
```

---

## Self-Review

**Spec coverage:**
- Part 1 (motion engine, pure/seedable/tunable/curved/variable-velocity) → Task 1. ✓
- Part 2 (`move` capability: types, handler, route, WeakMap last-pos, pause-aware, boundingBox) → Tasks 2–4. ✓
- Part 3 (gym wander across windows + motion→score trial log) → Task 5. ✓
- Honesty guardrail (real detector, can-fail) → Task 5 Step 8 + Global Constraints. ✓
- Deferred items (click/type reuse, CDP) → Global Constraints + Task 5 Step 8 note. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. ✓

**Type consistency:** `Point`/`Waypoint`/`MousePathOpts`/`mousePath` defined Task 1, consumed Tasks 3/4/5. `Actionable.boundingBox` defined Task 2, consumed Task 3. `MoveInput`/`MoveOutput`/`MoveHandler` defined Task 3, consumed Task 4. `MousePathOptsSchema` fields match `MousePathOpts` fields exactly. `move` helper return shape matches `MoveOutput`. ✓
