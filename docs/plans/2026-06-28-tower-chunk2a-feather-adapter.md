# Tower Chunk 2a — Feather Minimal-Brain Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `adapter.feather` — a small LLM "brain" that drives Feather (a browser *body*) over its public HTTP API toward a task goal, conforming to the Chunk-1 `Adapter` interface.

**Architecture:** A pure agent loop (`driveToGoal`: observe → ask the LLM for one action → act → re-observe) over two injected seams — a `BrowserSessionClient` (Feather's HTTP API) and a `Decide` function (Claude tool-use). The adapter is thin wiring over those seams, so the loop and the action-selection logic unit-test with mocked LLM + mocked browser (no network, no API key). The real composition (real Feather client + real Anthropic client) lives only in the live smoke.

**Tech Stack:** TypeScript 5.4 / Node 20 (CommonJS, `ts-node`) / Zod 3 / Vitest / `@anthropic-ai/sdk` (new dep). Feather is driven over HTTP only — never imports `src/`.

## Global Constraints

- **No import of Feather's `src/`** — drive Feather only over its public HTTP API. (Spec §4.)
- **The `Adapter` interface is unchanged** from Chunk 1: `{ id: string; run(task: TowerTask): Promise<void> }`. The adapter **drives, never grades**; `run` returns on a finished drive and **throws only on a drive error**. `give_up` / step-budget-exhausted are normal non-error outcomes. (Spec §3.)
- **No-attach rule:** the brain talks to Feather over HTTP only; Feather drives its own browser. The Tower never attaches Playwright/CDP to the measured browser. (Spec §4.)
- **Brain is throwaway-small and Tower-owned** — not fable/iroh. Action vocabulary is exactly four: `click`, `type`, `done`, `give_up`. (Spec §2, §5.)
- **LLM provider = Claude/Anthropic.** Default model `claude-opus-4-8` (override via env `FEATHER_BRAIN_MODEL`). API key from env `ANTHROPIC_API_KEY` (read by `new Anthropic()`); missing key fails loud at smoke time. (Spec §2, §5.)
- **Stay in the monorepo:** `@anthropic-ai/sdk` goes in the **root** `package.json`. (Spec §2.)
- **Do not touch** `tower/behavioral.ts`, `tower/classify.ts`, the runner, the verdict map, `tower/core/types.ts`, or any Chunk-1 file. New code only.
- **Unit tests run in `npm test` (mocked, deterministic).** The live smoke is opt-in `npm run tower:smoke:feather` — NOT in CI. (Spec §8.)
- Tests live beside source as `*.test.ts`; run a focused file with `npx vitest run <path>`, the whole suite with `npx vitest run`, typecheck with `npm run typecheck`.

Reference spec: `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md`.

---

### Task 1: Action schema (the brain's four-verb vocabulary)

**Files:**
- Create: `tower/core/agent/action.ts`
- Test: `tower/core/agent/action.test.ts`

**Interfaces:**
- Consumes: `zod` (already a dependency).
- Produces:
  - `Action` (Zod discriminated union on `kind`) + `type Action`. Variants:
    - `{ kind: "click", ref: string, reason?: string }`
    - `{ kind: "type", ref: string, text: string, reason?: string }`
    - `{ kind: "done", reason?: string }`
    - `{ kind: "give_up", reason?: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/agent/action.test.ts
import { describe, it, expect } from "vitest";
import { Action } from "./action";

describe("Action", () => {
  it("parses a click action", () => {
    expect(Action.parse({ kind: "click", ref: "obs.e1", reason: "the login button" }))
      .toEqual({ kind: "click", ref: "obs.e1", reason: "the login button" });
  });

  it("parses a type action (ref + text required)", () => {
    expect(Action.parse({ kind: "type", ref: "obs.e0", text: "alice@example.com" }))
      .toEqual({ kind: "type", ref: "obs.e0", text: "alice@example.com" });
  });

  it("parses done and give_up with no extra fields", () => {
    expect(Action.parse({ kind: "done" })).toEqual({ kind: "done" });
    expect(Action.parse({ kind: "give_up", reason: "no path" })).toEqual({ kind: "give_up", reason: "no path" });
  });

  it("rejects a type action missing text", () => {
    expect(Action.safeParse({ kind: "type", ref: "obs.e0" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(Action.safeParse({ kind: "scroll", ref: "obs.e0" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/agent/action.test.ts`
Expected: FAIL — cannot resolve `./action`.

- [ ] **Step 3: Write the implementation**

```ts
// tower/core/agent/action.ts
import { z } from "zod";

/** The brain's entire action vocabulary — four verbs, nothing more (spec §5). */
export const Action = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("click"), ref: z.string(), reason: z.string().optional() }),
  z.object({ kind: z.literal("type"), ref: z.string(), text: z.string(), reason: z.string().optional() }),
  z.object({ kind: z.literal("done"), reason: z.string().optional() }),
  z.object({ kind: z.literal("give_up"), reason: z.string().optional() }),
]);
export type Action = z.infer<typeof Action>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/agent/action.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add tower/core/agent/action.ts tower/core/agent/action.test.ts
git commit -m "feat(tower): brain action vocabulary (click/type/done/give_up)"
```

---

### Task 2: The brain loop (`driveToGoal`) + its seam types

**Files:**
- Create: `tower/core/agent/brain.ts`
- Test: `tower/core/agent/brain.test.ts`

**Interfaces:**
- Consumes: `Action` from `./action` (Task 1).
- Produces:
  - `interface ObservedElement { ref: string; role: string | null; name: string; tag: string; state: string }`
  - `interface Observation { url: string; title: string; elements: ObservedElement[] }`
  - `interface BrowserDriver { observe(): Promise<Observation>; click(ref: string): Promise<void>; type(ref: string, text: string): Promise<void> }`
  - `type Decide = (input: { goal: string; observation: Observation; step: number }) => Promise<Action>`
  - `interface DriveResult { outcome: "done" | "gave_up" | "budget_exhausted"; steps: number }`
  - `interface DriveOptions { maxSteps?: number; onStep?: (info: { step: number; action: Action }) => void }`
  - `function driveToGoal(driver: BrowserDriver, goal: string, decide: Decide, opts?: DriveOptions): Promise<DriveResult>` — default `maxSteps = 12`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/agent/brain.test.ts
import { describe, it, expect, vi } from "vitest";
import { driveToGoal, type BrowserDriver, type Observation, type Action } from "./brain";

const OBS: Observation = {
  url: "https://x.test/login",
  title: "Login",
  elements: [
    { ref: "obs.e0", role: "textbox", name: "Email", tag: "INPUT", state: "actionable" },
    { ref: "obs.e1", role: "button", name: "Log in", tag: "BUTTON", state: "actionable" },
  ],
};

function fakeDriver(): BrowserDriver & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    observe: vi.fn(async () => OBS),
    click: vi.fn(async (ref: string) => { calls.push(`click:${ref}`); }),
    type: vi.fn(async (ref: string, text: string) => { calls.push(`type:${ref}:${text}`); }),
  };
}

/** A Decide that returns each scripted action in order. */
function scripted(actions: Action[]) {
  let i = 0;
  return vi.fn(async () => actions[Math.min(i++, actions.length - 1)]);
}

describe("driveToGoal", () => {
  it("stops immediately on done", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "done" }]));
    expect(res).toEqual({ outcome: "done", steps: 1 });
    expect(d.observe).toHaveBeenCalledTimes(1);
    expect(d.calls).toEqual([]);
  });

  it("executes type then click then done, in order", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([
      { kind: "type", ref: "obs.e0", text: "alice" },
      { kind: "click", ref: "obs.e1" },
      { kind: "done" },
    ]));
    expect(res).toEqual({ outcome: "done", steps: 3 });
    expect(d.calls).toEqual(["type:obs.e0:alice", "click:obs.e1"]);
  });

  it("reports gave_up on give_up", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "give_up", reason: "x" }]));
    expect(res).toEqual({ outcome: "gave_up", steps: 1 });
  });

  it("exhausts the step budget when the goal is never reached", async () => {
    const d = fakeDriver();
    const res = await driveToGoal(d, "log in", scripted([{ kind: "click", ref: "obs.e1" }]), { maxSteps: 3 });
    expect(res).toEqual({ outcome: "budget_exhausted", steps: 3 });
    expect(d.click).toHaveBeenCalledTimes(3);
  });

  it("invokes onStep for each decided action", async () => {
    const d = fakeDriver();
    const seen: Action[] = [];
    await driveToGoal(d, "log in", scripted([{ kind: "click", ref: "obs.e1" }, { kind: "done" }]),
      { onStep: ({ action }) => seen.push(action) });
    expect(seen).toEqual([{ kind: "click", ref: "obs.e1" }, { kind: "done" }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/agent/brain.test.ts`
Expected: FAIL — cannot resolve `./brain`.

- [ ] **Step 3: Write the implementation**

```ts
// tower/core/agent/brain.ts
import type { Action } from "./action";
export type { Action } from "./action";

export interface ObservedElement {
  ref: string;
  role: string | null;
  name: string;
  tag: string;
  state: string;
}

export interface Observation {
  url: string;
  title: string;
  elements: ObservedElement[];
}

/** The browser surface the brain drives — Feather's observe/act, bound to one session. */
export interface BrowserDriver {
  observe(): Promise<Observation>;
  click(ref: string): Promise<void>;
  type(ref: string, text: string): Promise<void>;
}

/** Picks the next action given the goal and the current page. Real impl = Claude; tests = a stub. */
export type Decide = (input: { goal: string; observation: Observation; step: number }) => Promise<Action>;

export interface DriveResult {
  outcome: "done" | "gave_up" | "budget_exhausted";
  steps: number;
}

export interface DriveOptions {
  maxSteps?: number;
  onStep?: (info: { step: number; action: Action }) => void;
}

/** observe → decide → act, until done | give_up | the step budget runs out. Never grades. */
export async function driveToGoal(
  driver: BrowserDriver,
  goal: string,
  decide: Decide,
  opts: DriveOptions = {},
): Promise<DriveResult> {
  const maxSteps = opts.maxSteps ?? 12;
  for (let step = 0; step < maxSteps; step++) {
    const observation = await driver.observe();
    const action = await decide({ goal, observation, step });
    opts.onStep?.({ step, action });
    switch (action.kind) {
      case "done":
        return { outcome: "done", steps: step + 1 };
      case "give_up":
        return { outcome: "gave_up", steps: step + 1 };
      case "click":
        await driver.click(action.ref);
        break;
      case "type":
        await driver.type(action.ref, action.text);
        break;
    }
  }
  return { outcome: "budget_exhausted", steps: maxSteps };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/agent/brain.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add tower/core/agent/brain.ts tower/core/agent/brain.test.ts
git commit -m "feat(tower): driveToGoal brain loop (observe→decide→act, budget-bounded)"
```

---

### Task 3: Claude-backed `Decide` (action selection via tool-use)

**Files:**
- Create: `tower/core/agent/decide-claude.ts`
- Test: `tower/core/agent/decide-claude.test.ts`
- Modify: `package.json` (add `@anthropic-ai/sdk` to `dependencies`)

**Interfaces:**
- Consumes: `Action` from `./action`; `Decide`, `Observation` from `./brain`; `@anthropic-ai/sdk`.
- Produces: `function makeClaudeDecide(client: Pick<Anthropic, "messages">, model: string): Decide`.

- [ ] **Step 1: Install the SDK**

Run: `npm install @anthropic-ai/sdk`
Expected: it is added to `dependencies` in `package.json`; `package-lock.json` updates.

- [ ] **Step 2: Write the failing test**

```ts
// tower/core/agent/decide-claude.test.ts
import { describe, it, expect } from "vitest";
import { makeClaudeDecide } from "./decide-claude";
import type { Observation } from "./brain";

const OBS: Observation = {
  url: "https://x.test/login",
  title: "Login",
  elements: [{ ref: "obs.e1", role: "button", name: "Log in", tag: "BUTTON", state: "actionable" }],
};

/** Fake Anthropic client whose messages.create returns a single scripted content array. */
function fakeClient(content: unknown[]) {
  return { messages: { create: async () => ({ content }) } } as any;
}

describe("makeClaudeDecide", () => {
  it("maps a tool_use block to a validated Action", async () => {
    const client = fakeClient([{ type: "tool_use", name: "click", input: { ref: "obs.e1", reason: "log in" } }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    const action = await decide({ goal: "log in", observation: OBS, step: 0 });
    expect(action).toEqual({ kind: "click", ref: "obs.e1", reason: "log in" });
  });

  it("maps a done tool_use with no fields", async () => {
    const client = fakeClient([{ type: "text", text: "ok" }, { type: "tool_use", name: "done", input: {} }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    expect(await decide({ goal: "x", observation: OBS, step: 1 })).toEqual({ kind: "done" });
  });

  it("throws when the model chose no action", async () => {
    const client = fakeClient([{ type: "text", text: "thinking out loud" }]);
    const decide = makeClaudeDecide(client, "claude-opus-4-8");
    await expect(decide({ goal: "x", observation: OBS, step: 0 })).rejects.toThrow(/did not choose/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tower/core/agent/decide-claude.test.ts`
Expected: FAIL — cannot resolve `./decide-claude`.

- [ ] **Step 4: Write the implementation**

```ts
// tower/core/agent/decide-claude.ts
import type Anthropic from "@anthropic-ai/sdk";
import { Action } from "./action";
import type { Decide, Observation } from "./brain";

const SYSTEM =
  "You drive a web browser to accomplish a goal. Each turn you see the current page's actionable " +
  "elements (each with a ref). Choose exactly ONE action by calling a tool. Use 'click' or 'type' " +
  "to make progress, 'done' when the goal is accomplished, or 'give_up' if it is impossible from here. " +
  "Only use refs that appear in the current element list — never invent a ref.";

// The four-verb vocabulary, expressed as forced tools (tool_choice: "any").
const ACTION_TOOLS: Anthropic.Tool[] = [
  {
    name: "click", description: "Click an element by its ref to progress toward the goal.",
    input_schema: { type: "object", additionalProperties: false, required: ["ref"],
      properties: { ref: { type: "string" }, reason: { type: "string" } } },
  },
  {
    name: "type", description: "Type text into an input/textarea element by its ref.",
    input_schema: { type: "object", additionalProperties: false, required: ["ref", "text"],
      properties: { ref: { type: "string" }, text: { type: "string" }, reason: { type: "string" } } },
  },
  {
    name: "done", description: "The goal has been accomplished. Stop.",
    input_schema: { type: "object", additionalProperties: false, required: [],
      properties: { reason: { type: "string" } } },
  },
  {
    name: "give_up", description: "The goal cannot be accomplished from this page. Stop.",
    input_schema: { type: "object", additionalProperties: false, required: [],
      properties: { reason: { type: "string" } } },
  },
];

function renderPrompt(goal: string, obs: Observation, step: number): string {
  const lines = obs.elements.map(
    (e) => `- ${e.ref} [${e.tag}${e.role ? `/${e.role}` : ""}] "${e.name}" (${e.state})`,
  );
  return [
    `Goal: ${goal}`,
    `Step: ${step}`,
    `Page: ${obs.title} — ${obs.url}`,
    `Actionable elements:`,
    lines.length ? lines.join("\n") : "(none)",
    `Choose one action by calling a tool.`,
  ].join("\n");
}

/** Build a Decide backed by Claude tool-use. The client is injected so tests pass a stub. */
export function makeClaudeDecide(client: Pick<Anthropic, "messages">, model: string): Decide {
  return async ({ goal, observation, step }) => {
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM,
      tools: ACTION_TOOLS,
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: renderPrompt(goal, observation, step) }],
    });
    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("brain: the model did not choose an action (no tool_use block)");
    }
    return Action.parse({ kind: toolUse.name, ...(toolUse.input as Record<string, unknown>) });
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tower/core/agent/decide-claude.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add tower/core/agent/decide-claude.ts tower/core/agent/decide-claude.test.ts package.json package-lock.json
git commit -m "feat(tower): Claude-backed Decide — forced tool-use action selection"
```

---

### Task 4: Feather HTTP client (`BrowserSessionClient`)

**Files:**
- Create: `tower/core/adapters/feather-client.ts`
- Test: `tower/core/adapters/feather-client.test.ts`

**Interfaces:**
- Consumes: `Observation` from `../agent/brain`; Node `fs` + global `fetch` (Node 20).
- Produces:
  - `interface FeatherEndpoint { baseUrl: string; token: string }`
  - `function readFeatherEndpoint(endpointFile: string): FeatherEndpoint` — reads `endpoint.json` (`{ baseUrl, tokenFile }`), then reads the token file.
  - `interface BrowserSessionClient { createSession(): Promise<string>; navigate(sessionId: string, url: string): Promise<void>; observe(sessionId: string): Promise<Observation>; click(sessionId: string, ref: string): Promise<void>; type(sessionId: string, ref: string, text: string): Promise<void>; close(sessionId: string): Promise<void> }`
  - `class FeatherClient implements BrowserSessionClient` — `constructor(endpoint: FeatherEndpoint, fetchImpl?: typeof fetch)`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/adapters/feather-client.test.ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FeatherClient, readFeatherEndpoint, type FeatherEndpoint } from "./feather-client";

const EP: FeatherEndpoint = { baseUrl: "http://127.0.0.1:4000", token: "tok123" };

/** A fake fetch that records the last request and returns a scripted envelope. */
function fakeFetch(envelope: unknown) {
  const seen: { url: string; init: any }[] = [];
  const fn = (async (url: string, init: any) => {
    seen.push({ url, init });
    return { json: async () => envelope } as any;
  }) as unknown as typeof fetch;
  return { fn, seen };
}

describe("readFeatherEndpoint", () => {
  it("reads baseUrl + the token file referenced by endpoint.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "feather-ep-"));
    const tokenFile = join(dir, "token");
    writeFileSync(tokenFile, "secret-token\n");
    writeFileSync(join(dir, "endpoint.json"), JSON.stringify({ baseUrl: "http://127.0.0.1:9", tokenFile }));
    expect(readFeatherEndpoint(join(dir, "endpoint.json"))).toEqual({ baseUrl: "http://127.0.0.1:9", token: "secret-token" });
  });
});

describe("FeatherClient", () => {
  it("createSession POSTs /v1/sessions with the token header and returns sessionId", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { sessionId: "ses_1" } });
    const id = await new FeatherClient(EP, fn).createSession();
    expect(id).toBe("ses_1");
    expect(seen[0].url).toBe("http://127.0.0.1:4000/v1/sessions");
    expect(seen[0].init.method).toBe("POST");
    expect(seen[0].init.headers["X-Feather-Token"]).toBe("tok123");
  });

  it("observe maps actions[] to an Observation", async () => {
    const { fn } = fakeFetch({ ok: true, data: {
      url: "https://x.test", title: "X",
      actions: [{ ref: "obs.e0", role: "button", name: "Go", tag: "BUTTON", state: "actionable", box: {} }],
    }});
    const obs = await new FeatherClient(EP, fn).observe("ses_1");
    expect(obs).toEqual({ url: "https://x.test", title: "X",
      elements: [{ ref: "obs.e0", role: "button", name: "Go", tag: "BUTTON", state: "actionable" }] });
  });

  it("click POSTs a ref target", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { clicked: true } });
    await new FeatherClient(EP, fn).click("ses_1", "obs.e0");
    expect(seen[0].url).toBe("http://127.0.0.1:4000/v1/sessions/ses_1/click");
    expect(JSON.parse(seen[0].init.body)).toEqual({ target: { by: "ref", ref: "obs.e0" } });
  });

  it("type POSTs a ref target + text", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { typed: true } });
    await new FeatherClient(EP, fn).type("ses_1", "obs.e0", "hello");
    expect(JSON.parse(seen[0].init.body)).toEqual({ target: { by: "ref", ref: "obs.e0" }, text: "hello" });
  });

  it("throws on a non-ok envelope", async () => {
    const { fn } = fakeFetch({ ok: false, error: { code: "SESSION_NOT_FOUND" } });
    await expect(new FeatherClient(EP, fn).navigate("ses_x", "https://x.test")).rejects.toThrow(/SESSION_NOT_FOUND/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/adapters/feather-client.test.ts`
Expected: FAIL — cannot resolve `./feather-client`.

- [ ] **Step 3: Write the implementation**

```ts
// tower/core/adapters/feather-client.ts
import { readFileSync } from "node:fs";
import type { Observation } from "../agent/brain";

export interface FeatherEndpoint {
  baseUrl: string;
  token: string;
}

/** Read Feather's endpoint.json ({ baseUrl, tokenFile }) and the token file it points at. */
export function readFeatherEndpoint(endpointFile: string): FeatherEndpoint {
  const ep = JSON.parse(readFileSync(endpointFile, "utf8")) as { baseUrl: string; tokenFile: string };
  return { baseUrl: ep.baseUrl, token: readFileSync(ep.tokenFile, "utf8").trim() };
}

/** The browser-session surface the adapter needs from Feather. Drives over HTTP only. */
export interface BrowserSessionClient {
  createSession(): Promise<string>;
  navigate(sessionId: string, url: string): Promise<void>;
  observe(sessionId: string): Promise<Observation>;
  click(sessionId: string, ref: string): Promise<void>;
  type(sessionId: string, ref: string, text: string): Promise<void>;
  close(sessionId: string): Promise<void>;
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code?: string };
}

export class FeatherClient implements BrowserSessionClient {
  constructor(
    private readonly ep: FeatherEndpoint,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.ep.baseUrl}${path}`, {
      method,
      headers: { "X-Feather-Token": this.ep.token, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const env = (await res.json()) as Envelope<T>;
    if (!env.ok) throw new Error(`feather ${method} ${path} failed: ${env.error?.code ?? "UNKNOWN"}`);
    return env.data as T;
  }

  async createSession(): Promise<string> {
    const d = await this.call<{ sessionId: string }>("POST", "/v1/sessions", {});
    return d.sessionId;
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/navigate`, { url });
  }

  async observe(sessionId: string): Promise<Observation> {
    const d = await this.call<{
      url: string; title: string;
      actions: { ref: string; role: string | null; name: string; tag: string; state: string }[];
    }>("POST", `/v1/sessions/${sessionId}/observe`, {});
    return {
      url: d.url,
      title: d.title,
      elements: d.actions.map((a) => ({ ref: a.ref, role: a.role, name: a.name, tag: a.tag, state: a.state })),
    };
  }

  async click(sessionId: string, ref: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "ref", ref } });
  }

  async type(sessionId: string, ref: string, text: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/type`, { target: { by: "ref", ref }, text });
  }

  async close(sessionId: string): Promise<void> {
    await this.call("DELETE", `/v1/sessions/${sessionId}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/adapters/feather-client.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck` → clean.

```bash
git add tower/core/adapters/feather-client.ts tower/core/adapters/feather-client.test.ts
git commit -m "feat(tower): Feather HTTP client (session/navigate/observe/click/type/close)"
```

---

### Task 5: The Feather adapter (`featherAdapter`)

**Files:**
- Create: `tower/core/adapters/feather.ts`
- Test: `tower/core/adapters/feather.test.ts`

**Interfaces:**
- Consumes: `Adapter`, `TowerTask` from `../types`; `BrowserSessionClient` from `./feather-client`; `BrowserDriver`, `Decide`, `driveToGoal` from `../agent/brain`.
- Produces:
  - `interface FeatherAdapterConfig { client: BrowserSessionClient; decide: Decide; maxSteps?: number; onStep?: (info: { step: number; action: import("../agent/brain").Action }) => void }`
  - `function featherAdapter(cfg: FeatherAdapterConfig): Adapter` — `id` is `"adapter.feather"`.

- [ ] **Step 1: Write the failing test**

```ts
// tower/core/adapters/feather.test.ts
import { describe, it, expect, vi } from "vitest";
import { featherAdapter } from "./feather";
import type { BrowserSessionClient } from "./feather-client";
import type { Observation } from "../agent/brain";

const OBS: Observation = { url: "https://x.test", title: "X", elements: [] };

function fakeClient(over: Partial<BrowserSessionClient> = {}): BrowserSessionClient & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    createSession: vi.fn(async () => { calls.push("create"); return "ses_1"; }),
    navigate: vi.fn(async (_s: string, url: string) => { calls.push(`navigate:${url}`); }),
    observe: vi.fn(async () => OBS),
    click: vi.fn(async () => {}),
    type: vi.fn(async () => {}),
    close: vi.fn(async (s: string) => { calls.push(`close:${s}`); }),
    ...over,
  };
}

describe("featherAdapter", () => {
  it("has the registry id adapter.feather", () => {
    expect(featherAdapter({ client: fakeClient(), decide: vi.fn(async () => ({ kind: "done" })) }).id).toBe("adapter.feather");
  });

  it("creates a session, navigates to the task url, drives, and closes", async () => {
    const client = fakeClient();
    const decide = vi.fn(async () => ({ kind: "done" as const }));
    await featherAdapter({ client, decide }).run({ levelId: "L", url: "https://x.test/go", goal: "do it" });
    expect(client.calls).toEqual(["create", "navigate:https://x.test/go", "close:ses_1"]);
    expect(client.observe).toHaveBeenCalledTimes(1);
  });

  it("closes the session even when the drive throws", async () => {
    const client = fakeClient({ navigate: vi.fn(async () => { throw new Error("nav boom"); }) });
    const decide = vi.fn(async () => ({ kind: "done" as const }));
    await expect(featherAdapter({ client, decide }).run({ levelId: "L", url: "u", goal: "g" })).rejects.toThrow("nav boom");
    expect(client.close).toHaveBeenCalledWith("ses_1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tower/core/adapters/feather.test.ts`
Expected: FAIL — cannot resolve `./feather`.

- [ ] **Step 3: Write the implementation**

```ts
// tower/core/adapters/feather.ts
import type { Adapter, TowerTask } from "../types";
import type { BrowserSessionClient } from "./feather-client";
import { driveToGoal, type BrowserDriver, type Decide, type Action } from "../agent/brain";

export interface FeatherAdapterConfig {
  client: BrowserSessionClient;
  decide: Decide;
  maxSteps?: number;
  onStep?: (info: { step: number; action: Action }) => void;
}

/**
 * adapter.feather — drives Feather (a body) with an injected brain (Decide).
 * Control channel only: talks to Feather over HTTP; never attaches to its browser; never grades.
 * Returns on a finished drive (done | give_up | budget); throws only on a drive error.
 */
export function featherAdapter(cfg: FeatherAdapterConfig): Adapter {
  return {
    id: "adapter.feather",
    async run(task: TowerTask): Promise<void> {
      const sessionId = await cfg.client.createSession();
      try {
        await cfg.client.navigate(sessionId, task.url);
        const driver: BrowserDriver = {
          observe: () => cfg.client.observe(sessionId),
          click: (ref) => cfg.client.click(sessionId, ref),
          type: (ref, text) => cfg.client.type(sessionId, ref, text),
        };
        await driveToGoal(driver, task.goal, cfg.decide, { maxSteps: cfg.maxSteps, onStep: cfg.onStep });
      } finally {
        await cfg.client.close(sessionId);
      }
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tower/core/adapters/feather.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Full suite + typecheck + commit**

Run: `npx vitest run && npm run typecheck`
Expected: all green (prior suite + the new agent/adapter tests), typecheck clean.

```bash
git add tower/core/adapters/feather.ts tower/core/adapters/feather.test.ts
git commit -m "feat(tower): adapter.feather — body + injected brain, drive-then-close"
```

---

### Task 6: Live smoke (`tower:smoke:feather`)

**Files:**
- Create: `tower/smoke/feather.ts`
- Modify: `package.json` (add the `tower:smoke:feather` script)

**Interfaces:**
- Consumes: `featherAdapter` (Task 5); `FeatherClient` + `readFeatherEndpoint` (Task 4); `makeClaudeDecide` (Task 3); `@anthropic-ai/sdk`.

This task has **no unit test** — it is the opt-in live verification (real Feather + real Claude), the same pattern as `tower:behavioral`. It is NOT added to CI.

- [ ] **Step 1: Write the smoke entrypoint**

```ts
// tower/smoke/feather.ts — opt-in live verification. NOT a unit test.
// Prereqs: a running Feather server (`npm run dev`, which writes endpoint.json + the token file)
// and ANTHROPIC_API_KEY in the environment. Drives Feather to a trivial public page and prints each step.
import Anthropic from "@anthropic-ai/sdk";
import { join } from "node:path";
import { featherAdapter } from "../core/adapters/feather";
import { FeatherClient, readFeatherEndpoint } from "../core/adapters/feather-client";
import { makeClaudeDecide } from "../core/agent/decide-claude";

async function main(): Promise<void> {
  const endpointFile = process.env.FEATHER_ENDPOINT_FILE ?? join(process.cwd(), "endpoint.json");
  const model = process.env.FEATHER_BRAIN_MODEL ?? "claude-opus-4-8";

  const endpoint = readFeatherEndpoint(endpointFile); // throws loud if Feather isn't running
  const client = new FeatherClient(endpoint);
  const decide = makeClaudeDecide(new Anthropic(), model); // new Anthropic() reads ANTHROPIC_API_KEY; throws if unset

  const adapter = featherAdapter({
    client,
    decide,
    maxSteps: 8,
    onStep: ({ step, action }) => console.log(`[smoke] step ${step}: ${JSON.stringify(action)}`),
  });

  console.log(`[smoke] driving Feather at ${endpoint.baseUrl} with model ${model}`);
  await adapter.run({
    levelId: "smoke",
    url: "https://example.com",
    goal: "Click the 'More information' link.",
  });
  console.log("[smoke] adapter.run completed — the drive finished (grading is external in PR-1).");
}

main().catch((e) => {
  console.error("[smoke] FAILED:", e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, alongside `"tower:serve": "ts-node tower/serve.ts"`, add:

```json
"tower:smoke:feather": "ts-node tower/smoke/feather.ts",
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean (the smoke compiles even though it isn't run in CI).

- [ ] **Step 4: Live verification (manual — requires a running Feather + ANTHROPIC_API_KEY)**

In one terminal: `npm run dev` (starts Feather; note the `Endpoint:` line → it wrote `endpoint.json`).
In another terminal (same cwd, with `ANTHROPIC_API_KEY` exported):

```bash
npm run tower:smoke:feather
```

Expected: the smoke prints `[smoke] driving Feather …`, then one `[smoke] step N: {...}` line per action (a `type`/`click` toward the link, ending in a `done` or `give_up`), then `[smoke] adapter.run completed`. A real LLM agent may occasionally wander or `give_up` — that is an expected, first-class outcome (record what happened honestly), not a defect to hide. If Feather isn't running, `readFeatherEndpoint` throws loudly (expected). Capture the actual console output in the implementer report.

- [ ] **Step 5: Commit**

```bash
git add tower/smoke/feather.ts package.json
git commit -m "feat(tower): tower:smoke:feather — opt-in live drive of Feather via the brain"
```

---

## Self-Review

**Spec coverage** (against `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md`):
- §3 unchanged `Adapter` interface, drive-never-grade, throw-only-on-drive-error → Task 5 (`featherAdapter` returns `Promise<void>`, `finally`-close, drive outcomes are non-throwing). ✓
- §4 two boundaries / no-attach / HTTP-only / never import `src/` → Task 4 (HTTP client) + Task 5 (driver over the client); no `src/` import anywhere. ✓
- §5 minimal brain: observe→ask→act, four-verb vocabulary, structured tool-use, step+budget bound, Feather client reads `endpoint.json`+token → Tasks 1 (vocabulary), 2 (loop+budget), 3 (tool-use), 4 (endpoint/token). ✓
- §2 Claude provider, default `claude-opus-4-8`, env key, throwaway brain, Anthropic SDK in root `package.json`, monorepo → Tasks 3 (model param + SDK install) + 6 (env defaults). ✓
- §8 mocked units in `npm test` + opt-in live smoke (not CI) → Tasks 1–5 unit tests + Task 6 smoke. ✓
- §7 file layout (`agent/brain.ts`, `agent/action.ts`→folded as the vocabulary file, `adapters/feather.ts`, `adapters/feather-client.ts` for the HTTP seam, `tower/smoke/feather.ts`) → matches; the spec's single `decide`/brain split is realized as `brain.ts` (loop) + `decide-claude.ts` (LLM) + `action.ts` (schema) for testability. ✓
- §9 sub-chunk 2a deliverables (brain + Feather adapter + mocked units + `tower:smoke:feather`) → all six tasks. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to" — every code step shows complete code; the smoke step shows the full entrypoint. ✓

**Type consistency:** `Observation`/`BrowserDriver`/`Decide`/`Action` are defined in Tasks 1–2 and consumed unchanged in Tasks 3–5; `BrowserSessionClient` defined in Task 4 and consumed in Task 5; `makeClaudeDecide(client, model)`, `featherAdapter(cfg)`, `readFeatherEndpoint(file)`, `FeatherClient(endpoint, fetchImpl?)` signatures match across their producer/consumer tasks. `driveToGoal(driver, goal, decide, opts)` is identical in Task 2 (def) and Task 5 (call). ✓

**Note on effort/cost (non-blocking):** `decide-claude` omits an explicit `output_config.effort` (defaults to `high`). If live-smoke cost/latency is high, a follow-up can add `output_config: { effort: "low" }` — left out here to avoid SDK-version type friction and keep the first cut compiling cleanly.
