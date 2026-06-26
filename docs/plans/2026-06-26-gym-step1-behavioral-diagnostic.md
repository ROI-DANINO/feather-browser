# Gym Step 1 — Behavioral Diagnostic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable, watchable diagnostic that drives one real behavioral detector (`bot.incolumitas.com`) through Feather's HTTP API, reads its own verdict, and records an honest PASS/FAIL — so Roi learns what to upgrade in Feather next.

**Architecture:** A top-level `gym/` directory that is a pure HTTP *client* of a running Feather server — it never imports Feather core. Pure verdict logic (`classify.ts`) is unit-tested; the live drive (`behavioral.ts`) is operate-and-observe. The one unknown — incolumitas's real score field + scored/unscored shape — is resolved by an explicit live-recon task, not guessed.

**Tech Stack:** TypeScript 5.4, Node 20 (built-in global `fetch`, `node:fs`), run via `ts-node` (already a dependency); Vitest for the unit test. No new dependencies.

**Design:** `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`
**Prior art:** `examples/showcase.sh` (the HTTP-drive pattern), `docs/testing/5d2-baseline/baseline-report.md` (the 5d.2 run this reframes).

## Global Constraints

- **Node 20 / TypeScript 5.4.** No new dependencies — use built-in global `fetch` and `node:fs` only.
- **Run via `ts-node`** (the repo's TS runner; `tsx` is not installed).
- **Drive Feather only over HTTP.** No `import` from `src/`. `gym/` is an external client.
- **The detector is not controlled and the test can fail.** Today's expected result is FAIL (UNSCORED). A clean recorded failure with its lesson is a *successful* run (AGENTS.md "Testing Honesty").
- **"No score" = FAIL**, never a skip or an "n/a" (Roi, 2026-06-26 — being unscoreable is itself a tell).
- **English only.** Keep every run's evidence (screenshot + raw field value).
- **API facts (verified in `examples/showcase.sh`):** server location is `endpoint.json` → `baseUrl` + `tokenFile`; auth header `X-Feather-Token`; every response is the envelope `{ ok, requestId, data | error }`. Launch returns `data.sessionId`; screenshot returns `data.path` (a PNG file on disk).

---

### Task 1: Pure verdict logic (`gym/classify.ts`)

The only non-trivial logic, and the only thing unit-tested. Maps a raw detector score field to a verdict, with the load-bearing rule that a missing score is a FAIL.

**Files:**
- Create: `gym/classify.ts`
- Test: `gym/classify.test.ts`
- Modify: `vitest.config.ts` (add `gym/**/*.test.ts` to the `include` glob)

**Interfaces:**
- Produces: `classify(raw: string | null | undefined, cfg: ClassifyConfig): Verdict`, the types `Verdict` (`{ state: "SCORED" | "UNSCORED"; score: number | null; outcome: "PASS" | "FAIL"; reason: string }`) and `ClassifyConfig` (`{ humanThreshold: number; direction: "higherIsHuman" | "lowerIsHuman" }`). Consumed by `gym/behavioral.ts` in Task 4.

- [ ] **Step 1: Add the colocated test glob to vitest**

In `vitest.config.ts`, change the `include` line:

```ts
    include: ["tests/unit/**/*.test.ts", "gym/**/*.test.ts"],
```

- [ ] **Step 2: Write the failing test**

Create `gym/classify.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { classify, type ClassifyConfig } from "./classify";

const higher: ClassifyConfig = { humanThreshold: 0.5, direction: "higherIsHuman" };

describe("classify", () => {
  it("treats a missing score as a FAIL (unscoreable is a tell)", () => {
    const v = classify(null, higher);
    expect(v.state).toBe("UNSCORED");
    expect(v.outcome).toBe("FAIL");
    expect(v.score).toBeNull();
  });

  it("treats an empty / number-less field as UNSCORED FAIL", () => {
    expect(classify("", higher).outcome).toBe("FAIL");
    expect(classify("Your Behavioral Score: ", higher).state).toBe("UNSCORED");
  });

  it("passes a human-like score (higherIsHuman) and parses the number out of text", () => {
    const v = classify("Your Behavioral Score: 0.83", higher);
    expect(v.state).toBe("SCORED");
    expect(v.score).toBe(0.83);
    expect(v.outcome).toBe("PASS");
  });

  it("fails a bot-like score (higherIsHuman)", () => {
    expect(classify("0.10", higher).outcome).toBe("FAIL");
  });

  it("honours the lowerIsHuman direction", () => {
    const lower: ClassifyConfig = { humanThreshold: 0.5, direction: "lowerIsHuman" };
    expect(classify("0.10", lower).outcome).toBe("PASS");
    expect(classify("0.90", lower).outcome).toBe("FAIL");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- gym/classify.test.ts`
Expected: FAIL — `Cannot find module './classify'` (file not created yet).

- [ ] **Step 4: Write the implementation**

Create `gym/classify.ts`:

```ts
// Pure verdict logic for the behavioral diagnostic. No I/O, no Feather.
// Load-bearing honesty rule (Roi, 2026-06-26): "no score" is a FAIL, not neutral —
// a session the detector cannot score at all is itself a detection tell.

export type Outcome = "PASS" | "FAIL";
export type ScoreState = "SCORED" | "UNSCORED";

export interface Verdict {
  state: ScoreState;
  score: number | null;
  outcome: Outcome;
  reason: string;
}

export interface ClassifyConfig {
  /** Boundary between human-like and bot-like once a numeric score exists. */
  humanThreshold: number;
  /** Which side of the boundary reads as human. CONFIRM LIVE for incolumitas (calibration knob). */
  direction: "higherIsHuman" | "lowerIsHuman";
}

/** @param raw text read from the detector's behavioral-score field (or null if absent). */
export function classify(raw: string | null | undefined, cfg: ClassifyConfig): Verdict {
  const score = parseScore(raw);
  if (score === null) {
    return {
      state: "UNSCORED",
      score: null,
      outcome: "FAIL",
      reason:
        "no behavioral score — the detector could not score this session (no cursor path). " +
        "Being unscoreable is itself a tell: real users always emit behavioral signal.",
    };
  }
  const human =
    cfg.direction === "higherIsHuman" ? score >= cfg.humanThreshold : score <= cfg.humanThreshold;
  return {
    state: "SCORED",
    score,
    outcome: human ? "PASS" : "FAIL",
    reason: `scored ${score} — reads ${human ? "human-like" : "bot-like"} (${cfg.direction}, threshold ${cfg.humanThreshold}).`,
  };
}

function parseScore(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const m = String(raw).trim().match(/-?\d+(\.\d+)?/); // first number in e.g. "Your Behavioral Score: 0.83"
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- gym/classify.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: clean (no errors).

- [ ] **Step 7: Commit**

```bash
git add gym/classify.ts gym/classify.test.ts vitest.config.ts
git commit -m "feat(gym): behavioral-diagnostic verdict logic (no-score = FAIL)"
```

---

### Task 2: The runner plumbing + recon harness (`gym/behavioral.ts`)

Build the reusable Feather HTTP client + session helpers, and a `main()` that *recons*: launches a headed session, drives to incolumitas, dumps the page snapshot, and saves a screenshot. Running this in Task 3 is how we discover the real score field — no separate throwaway code.

**Files:**
- Create: `gym/behavioral.ts`
- Modify: `package.json` (add the `gym:behavioral` script)
- Modify: `.gitignore` (ignore run screenshots)

**Interfaces:**
- Consumes: nothing yet (Task 4 adds the `classify` import).
- Produces: the helpers `feather`, `launchHeaded`, `navigate`, `snapshot`, `extract`, `shoot`, `close` — reused by Task 4's full flow.

- [ ] **Step 1: Write the runner plumbing + recon main**

Create `gym/behavioral.ts`:

```ts
// Gym Step 1 — behavioral diagnostic runner. An HTTP client of a running Feather server.
// CommonJS module (repo has no "type":"module") — __dirname is available, no top-level await.
import {
  readFileSync, appendFileSync, existsSync, writeFileSync, copyFileSync, mkdirSync,
} from "node:fs";
import { join } from "node:path";

// --- locate the running Feather server (same precedence as examples/showcase.sh) ---
function endpointFile(): string {
  if (process.env.FEATHER_ENDPOINT_FILE) return process.env.FEATHER_ENDPOINT_FILE;
  if (process.env.XDG_RUNTIME_DIR) return join(process.env.XDG_RUNTIME_DIR, "feather/run/endpoint.json");
  const state = process.env.XDG_STATE_HOME ?? join(process.env.HOME ?? "", ".local/state");
  return join(state, "feather/run/endpoint.json");
}

const ep = endpointFile();
if (!existsSync(ep)) {
  console.error(`ERROR: endpoint.json not found at ${ep}. Is Feather running? Start it with 'npm run dev'.`);
  process.exit(1);
}
const { baseUrl, tokenFile } = JSON.parse(readFileSync(ep, "utf8")) as { baseUrl: string; tokenFile: string };
const token = readFileSync(tokenFile, "utf8").trim();

// --- envelope-unwrapping HTTP helper (Node 20 global fetch) ---
async function feather<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "X-Feather-Token": token, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const env = (await res.json()) as { ok: boolean; data?: T; error?: unknown };
  if (!env.ok) throw new Error(`Feather API error on ${method} ${path}: ${JSON.stringify(env.error)}`);
  return env.data as T;
}

// --- session helpers ---
async function launchHeaded(): Promise<string> {
  const data = await feather<{ sessionId: string }>("POST", "/v1/sessions", {
    profile: { kind: "disposable" },
    browserMode: "chromium-headed-cdp", // headed so Roi watches it; same posture as 5d.2
    viewport: { width: 1280, height: 800 },
  });
  return data.sessionId;
}
const navigate = (sid: string, url: string) =>
  feather("POST", `/v1/sessions/${sid}/navigate`, { url, waitUntil: "domcontentloaded", timeoutMs: 30000 });
const snapshot = (sid: string) =>
  feather<{ markdown?: string; text?: string }>("POST", `/v1/sessions/${sid}/snapshot`, {});
const extract = (sid: string, selector: string) =>
  feather<Record<string, string>>("POST", `/v1/sessions/${sid}/extract`, {
    recipe: { fields: { score: { selector, type: "text" } } },
  }).then((d) => d.score ?? null);
const close = (sid: string) =>
  feather("DELETE", `/v1/sessions/${sid}`, { force: false }).catch(() => {});

async function shoot(sid: string, label: string): Promise<string> {
  const { path } = await feather<{ path: string }>("POST", `/v1/sessions/${sid}/screenshot`, { fullPage: true });
  const runs = join(__dirname, "runs");
  mkdirSync(runs, { recursive: true });
  const dest = join(runs, `${label}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`);
  copyFileSync(path, dest);
  return dest;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- RECON: discover what incolumitas exposes. Replaced by run() in Task 4. ---
async function recon(): Promise<void> {
  const sid = await launchHeaded();
  console.log(`[gym] session ${sid} — recon vs bot.incolumitas.com (headed; watch the window)`);
  try {
    await navigate(sid, "https://bot.incolumitas.com/");
    await sleep(8000); // let the page settle + attempt to score
    const snap = await snapshot(sid);
    console.log("\n===== SNAPSHOT =====\n");
    console.log((snap.markdown ?? snap.text ?? "").slice(0, 8000));
    console.log(`\n[gym] recon screenshot: ${await shoot(sid, "recon")}`);
  } finally {
    await close(sid);
  }
}

recon().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Re-exported so Task 4's edits keep the helpers reachable and lint-clean.
export { feather, launchHeaded, navigate, snapshot, extract, shoot, close, sleep };
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
    "gym:behavioral": "ts-node gym/behavioral.ts",
```

- [ ] **Step 3: Ignore run screenshots**

Append to `.gitignore`:

```
# gym run artifacts (the results.md scoreboard IS committed; the PNGs are not)
gym/runs/
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add gym/behavioral.ts package.json .gitignore
git commit -m "feat(gym): behavioral runner plumbing + recon harness"
```

---

### Task 3: Live recon — confirm incolumitas's real verdict shape (operate-by-hand)

No code. This is the design's "confirm live, no guessing" step. Run the recon harness against the real site and **record concrete findings** that Task 4 hardcodes as calibration.

**Files:**
- Create: `docs/testing/gym-step1/recon-findings.md`

- [ ] **Step 1: Start Feather from a headed-capable shell**

Run (in a shell with `WAYLAND_DISPLAY`/`DISPLAY` set, so headed windows open):

```bash
npm run dev
```

Leave it running. Note the `Endpoint:` / `Token file:` lines it prints.

- [ ] **Step 2: Run the recon harness and watch the window**

In another terminal:

```bash
npm run gym:behavioral
```

Watch the headed Chromium drive `bot.incolumitas.com`. Read the printed SNAPSHOT and open the saved `gym/runs/recon-*.png`.

- [ ] **Step 3: Record the findings**

Create `docs/testing/gym-step1/recon-findings.md` capturing, **concretely**:

1. **Score field** — the exact text label and a CSS selector that returns the behavioral score (e.g. the element holding `Your Behavioral Score: ...`). If the snapshot didn't expose it, note whether it's in canvas/styled HTML and try a more specific selector via a one-off `extract` call.
2. **Scored vs. unscored shape** — what the field reads when the detector *fails to score* (empty? `...`? absent?) vs. when a number is present. (5d.2 saw it never fill in — confirm that's still true.)
3. **Score direction + threshold** — does a *higher* number mean more human or more bot? Pick the `direction` (`higherIsHuman` / `lowerIsHuman`) and a sensible `humanThreshold`. State the evidence (the page's own legend/docs).
4. **Interaction needed** — does the page need form-fill/clicks before it attempts a behavioral score? Record the exact selectors of any form fields / buttons involved (5d.2 filled a "Bot Challenge" form). If no interaction is needed, say so.

- [ ] **Step 4: Stop the recon, commit the findings**

Stop the server (Ctrl-C in its terminal). Then:

```bash
git add docs/testing/gym-step1/recon-findings.md
git commit -m "docs(gym): live recon findings for bot.incolumitas score field"
```

---

### Task 4: Complete the runner — drive, read, classify, record

Turn the recon harness into the real diagnostic using the Task 3 findings. Replace `recon()` with `run()`: drive incolumitas (with any interaction recon found), read the score field, classify it, print the verdict, save labelled evidence, and append a row to the scoreboard.

**Files:**
- Modify: `gym/behavioral.ts`

**Interfaces:**
- Consumes: `classify`, `Verdict`, `ClassifyConfig` from `gym/classify.ts` (Task 1); all helpers from Task 2.

- [ ] **Step 1: Set the calibration constants from your Task 3 findings**

At the top of `gym/behavioral.ts`, just below the imports, add (replacing the example values with your **recorded** findings — this is the calibration knob the design said to confirm live, not a placeholder):

```ts
import { classify, type ClassifyConfig } from "./classify";

// CALIBRATION — set from docs/testing/gym-step1/recon-findings.md (Task 3). Example values shown;
// replace with the selector + direction you confirmed live against bot.incolumitas.com.
const SCORE_SELECTOR = "#behavior-score";                                   // <- from recon
const SCORE_CONFIG: ClassifyConfig = { humanThreshold: 0.5, direction: "higherIsHuman" }; // <- from recon
```

- [ ] **Step 2: Add the results-append helper**

Add to `gym/behavioral.ts` (above `recon`):

```ts
function appendResult(v: Verdict, shot: string): void {
  const file = join(__dirname, "results.md");
  if (!existsSync(file)) {
    writeFileSync(
      file,
      "# Gym — Behavioral Diagnostic Results\n\n" +
        "Honest record. UNSCORED counts as FAIL (an unscoreable session is itself a tell).\n\n" +
        "| When (UTC) | State | Score | Verdict | Evidence | Notes |\n" +
        "|---|---|---|---|---|---|\n",
    );
  }
  const rel = shot.slice(shot.indexOf("runs/")); // path relative to gym/
  appendFileSync(
    file,
    `| ${new Date().toISOString()} | ${v.state} | ${v.score ?? "—"} | ${v.outcome} | ${rel} | ${v.reason} |\n`,
  );
}
```

Note: add `Verdict` to the type import from `./classify`:

```ts
import { classify, type ClassifyConfig, type Verdict } from "./classify";
```

- [ ] **Step 3: Replace `recon()` and its call with `run()`**

Remove the `recon()` function and its `recon().catch(...)` invocation, and add:

```ts
async function run(): Promise<void> {
  const sid = await launchHeaded();
  console.log(`[gym] session ${sid} — behavioral diagnostic vs bot.incolumitas.com (headed; watch it)`);
  try {
    await navigate(sid, "https://bot.incolumitas.com/");

    // INTERACTION — only if Task 3 recon showed the page needs it to attempt a behavioral score.
    // Per 5d.2, that meant filling the challenge form + clicking, e.g.:
    //   await feather("POST", `/v1/sessions/${sid}/type`,
    //     { target: { by: "css", selector: "<field-from-recon>" }, text: "feather", mode: "fill" });
    //   await feather("POST", `/v1/sessions/${sid}/click`,
    //     { target: { by: "css", selector: "<button-from-recon>" } });
    // If recon showed no interaction is needed, leave this out.

    await sleep(15000); // wait past incolumitas' scoring windows (5d.2: 1.5/4/7/10/15s)

    const raw = await extract(sid, SCORE_SELECTOR);
    const verdict = classify(raw, SCORE_CONFIG);
    const shot = await shoot(sid, verdict.outcome);

    console.log(`\n[gym] raw score field: ${raw === null ? "(absent)" : JSON.stringify(raw)}`);
    console.log(`[gym] ${verdict.state} ${verdict.score ?? ""} -> ${verdict.outcome}`);
    console.log(`[gym] ${verdict.reason}`);
    console.log(`[gym] evidence: ${shot}`);
    appendResult(verdict, shot);
  } finally {
    await close(sid);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add gym/behavioral.ts
git commit -m "feat(gym): drive + classify + record the behavioral diagnostic"
```

---

### Task 5: First honest run + record the result

Run the real diagnostic end to end against the live site and record the outcome. The honest expected result today is **FAIL (UNSCORED)** — that is the diagnostic succeeding (it tells Roi the upgrade is mouse-motion).

**Files:**
- Modify (generated): `gym/results.md`

- [ ] **Step 1: Confirm the unit test + typecheck are green**

Run: `npm test -- gym/classify.test.ts && npm run typecheck`
Expected: PASS + clean.

- [ ] **Step 2: Start Feather (headed-capable shell) and run the diagnostic**

```bash
npm run dev          # terminal 1 (with WAYLAND_DISPLAY/DISPLAY set)
npm run gym:behavioral   # terminal 2
```

Watch the window. Confirm the printed verdict matches what the screenshot shows (no self-grading — the evidence backs the verdict).

- [ ] **Step 3: Sanity-check the honest outcome**

Confirm one of these, and that it is recorded truthfully in `gym/results.md`:
- **UNSCORED → FAIL** (expected): Feather is invisible to behavioral scoring → focus area is mouse-motion. The diagnostic worked.
- **SCORED → PASS/FAIL** (surprise): the page *did* score the session — capture the number; this is a new finding worth a note in `recon-findings.md`.

If the verdict and the screenshot disagree, the selector/calibration is wrong — fix `SCORE_SELECTOR`/`SCORE_CONFIG` per the screenshot and re-run before committing.

- [ ] **Step 4: Commit the first scoreboard row**

```bash
git add gym/results.md
git commit -m "test(gym): first honest behavioral-diagnostic run recorded"
```

---

## Self-Review

**Spec coverage:**
- Purpose / diagnostic-not-trophy → Tasks 3–5 (honest run, FAIL expected). ✓
- One detector (incolumitas), agent reads verdict → Tasks 2–4. ✓
- Verdict model incl. "no score = FAIL" → Task 1 (`classify`, fully tested). ✓
- Watchable + recorded "3+1", one command → Task 2 (headed + script) + Task 4 (`results.md`). ✓
- `gym/` top-level, drives core only over HTTP → Task 2 (no `src/` import). ✓
- What gets tested (only `classify`; live run observed) → Task 1 test; Tasks 3/5 observe. ✓
- Honest-test guardrails (not-controlled, can-fail, evidence) → Global Constraints + Tasks 3/5. ✓
- The one live unknown resolved, not guessed → Task 3 (recon) feeds Task 4's calibration. ✓
- Explicitly NOT (fable wire / mouse-fix / 2nd detector) → out of scope; no task touches them. ✓

**Placeholder scan:** The `SCORE_SELECTOR`/`SCORE_CONFIG` example values and the optional interaction block are calibration knobs filled from Task 3's recorded findings (method fully specified), not vague TODOs. No "add error handling"-style gaps.

**Type consistency:** `classify`, `Verdict`, `ClassifyConfig`, and helper signatures (`feather`, `launchHeaded`, `navigate`, `snapshot`, `extract`, `shoot`, `close`, `sleep`) match across Tasks 1, 2, and 4.
