# Tower PR-1 Chunk 2 — The Two Adapters (design)

> **Status:** approved 2026-06-28. Parent design → `docs/specs/2026-06-28-tower-pr1-mvp-design.md`
> (Chunk 2 = "the two adapters"). Plan of record → `tower/research/2026-06-27-00-SYNTHESIS.md`
> (§"driver-transparent multi-tool adapter"). Live pointer → `journal/context/active.md`.
> Decisions D2/D4 → `tower/decisions.md`. Chunk 1 (engine + UI slice) is merged to `dev`.

## 1. What this builds

The first **two real adapters** — the thin translators that let the Tower drive an actual agentic
web tool — replacing the Chunk-1 stub. After this chunk the Tower drives two *genuine* agents,
both powered by real Claude calls:

1. **`adapter.feather`** — Feather (a browser *body*) driven by a small Tower-owned LLM *brain*.
2. **`adapter.browser-use`** — the **real** browser-use framework, run as a Python subprocess.

This chunk does **not** build the real challenge levels (that is Chunk 3) or scoring (Chunk 4). It
proves the **drive seam** only: the Tower can get each tool's own browser onto a page and pursue a
goal, over an external boundary, without importing the tool.

## 2. Decisions locked in the brainstorm (2026-06-28)

- **Feather gets a minimal brain.** Feather has no LLM of its own; on its own it cannot "pursue a
  goal" or be hijacked by a malicious page. So `adapter.feather` wires a small **LLM-in-the-loop**
  (observe → ask Claude → act → re-observe) in front of Feather, so "Feather + brain" can attempt
  the same levels browser-use can. The brain is **throwaway-small and lives in the Tower** — it is
  **not** the fable/iroh orchestration brain ("integrate by driving, never merge").
- **browser-use is the real framework.** Actually `pip install browser-use`, real agent loop, its
  own Chromium, real LLM calls — a genuine test of the actual tool, symmetric with Feather's real
  brain. (Not a stand-in.)
- **Provider = Claude / Anthropic** for both brains. One `ANTHROPIC_API_KEY` serves both (browser-use
  supports Anthropic). Exact model + the structured tool-use pattern picked at plan time from the
  `claude-api` reference.
- **Stay in the monorepo for PR-1.** browser-use is the documented repo-split trigger (a second,
  non-Feather tool with its own deps), but we **do not split now**: add the Anthropic SDK to the
  shared root `package.json`; isolate Python under `tower/adapters/browser-use/` with its own
  `requirements.txt`. Revisit the split after PR-1 proves the shape ("do not extract early").
- **Both runs are real, costed, nondeterministic.** That is inherent to testing real agents; honest
  failure/wander is a first-class outcome (the testing-honesty rule), surfaced as `error`/`UNTESTABLE`.

## 3. The unchanged contract (from Chunk 1)

The `Adapter` interface in `tower/core/types.ts` stays exactly as-is — no change:

```ts
export interface Adapter {
  id: string;
  run(task: TowerTask): Promise<void>; // drive to task.url, pursue task.goal; throw on a drive error
}
```

An adapter **drives, never grades.** It returns nothing on success and **throws** on a drive
failure (the runner records that as `error` → `UNTESTABLE`). All verdicts come from **outside** the
adapter — the level page self-reports, or the security victim app observes objective state (Chunk 3).
Capability is **stubbed** in PR-1, so the adapter never needs to report task success/failure.

## 4. The two boundaries (the honesty property)

- **Capability is measured *through* the adapter** (later; stubbed in PR-1).
- **Detectability/security are measured *around* the adapter:** the adapter is a **control channel
  only**. Each tool launches its **own** browser; the Tower never attaches Playwright/CDP to the
  measured browser and is structurally off the browser↔site data path.
  - Feather: the brain talks to Feather **over HTTP only** (never imports `src/`); Feather drives its
    own bundled Chromium.
  - browser-use: the Tower only **spawns the subprocess**; browser-use drives its own Chromium.

## 5. Adapter 1 — `adapter.feather` (body + minimal brain)

```
  Tower ──HTTP──▶ Feather server ──drives──▶ Feather's own Chromium
            ▲
   minimal brain (Claude)
   loop: observe → ask Claude "next action?" → act-by-ref → re-observe
         until done | give-up | step/time budget exhausted
```

- **Reuses Feather's existing observe→act-by-ref loop** (the public "golden loop" already exposed
  over Feather's HTTP API). No new Feather *source* features — the brain only consumes the public API.
- **Feather client:** a thin HTTP client that reads `endpoint.json` (`baseUrl` + token file) and
  calls the public session/observe/act endpoints. Never imports `src/`.
- **The brain loop:** observe the page (Feather snapshot + refs) → build a prompt (goal + observation)
  → call Claude with a **small structured action vocabulary** (`click` / `type` / `done` / `give_up`,
  each carrying the ref/text it needs) → execute the chosen action via the Feather act endpoint →
  re-observe. Bounded by a **step budget** and a **wall-clock timeout**; exhausting either ends the
  run cleanly (give-up, not crash).
- **Structured output:** Claude is constrained to emit one action from the vocabulary (tool-use /
  JSON-schema), so the brain never has to parse free-form prose. Zod-validate the action before acting.
- **Config (env):** `ANTHROPIC_API_KEY`; the Feather endpoint discovered from `endpoint.json`.
  Missing config fails loud.

## 6. Adapter 2 — `adapter.browser-use` (real framework, subprocess)

```
  Tower ──spawn + JSON pipe──▶ python shim ──runs──▶ browser-use Agent ──▶ its own Chromium
```

- **Python shim** (`tower/adapters/browser-use/shim.py` + `requirements.txt`, isolated venv): reads
  **one line of JSON** on stdin (`{ "url": ..., "goal": ... }`), runs the **real** browser-use `Agent`
  with Claude as its LLM against the URL/goal, prints **exactly one** final JSON line on stdout
  (`{ "status": "ok" | "error", "error": string | null }`), and exits (0 on ok, non-zero on error).
- **TS side** (`tower/core/adapters/browser-use.ts`): `spawn` the shim, write the task line, read the
  single result line, map `status:"ok"` → resolve, `status:"error"` / non-zero exit / unreadable
  output → throw. A **wall-clock timeout** kills the process and throws.
- **The stdin/stdout JSON protocol is the whole contract** — the TS side knows nothing about browser-use
  internals; it only speaks the protocol. This is the polyglot proof.

## 7. File layout

```
tower/core/adapters/
  feather.ts            # Adapter: HTTP Feather client + uses the brain
  feather.test.ts       # mocked unit tests (no network, no key)
  browser-use.ts        # Adapter: spawn + protocol parse
  browser-use.test.ts   # mocked unit tests (mocked child process)
tower/core/agent/
  brain.ts              # the LLM-in-the-loop driver (observe→ask→act), Claude client + action schema
  brain.test.ts         # mocked unit tests (mocked LLM + mocked Feather client)
tower/adapters/browser-use/
  shim.py               # the ~60-line real-browser-use Python shim
  requirements.txt      # browser-use + its deps (isolated)
```

New top-level dep: `@anthropic-ai/sdk` in the **root** `package.json` (shared toolchain). No change
to `behavioral.ts` / `classify.ts` / the runner / the verdict map / the schemas.

## 8. Testing strategy

Two layers, matching the repo's existing split (unit in `npm test`; live runs are opt-in `npm run`,
like `gym:behavioral` and the showcase HARD tier).

**Unit tests (default `npm test`, mocked, deterministic — the regression guard):**
- `brain.test.ts`: given a fake observation + a fake Claude action, the loop parses the action,
  calls the right Feather endpoint, stops on `done`, and gives up at the step/time budget. LLM + Feather
  client both mocked — no network, no key, no cost.
- `feather.test.ts`: the adapter wires the Feather client + brain and surfaces a drive error as a throw.
- `browser-use.test.ts`: given fake subprocess stdout/exit, the TS side parses the result line, treats
  a clean exit as success, and a crash / timeout / unreadable output as a thrown error. Child process mocked.

**Live smokes (opt-in `npm run`, real tools + real Claude — the watch-it-work payoff; NOT in CI):**
- `npm run tower:smoke:feather` — boots Feather; the brain drives it to a trivial target page (reuse
  the existing placeholder page or a one-button fixture) and completes a trivial goal; prints its steps.
- `npm run tower:smoke:browser-use` — spawns the real browser-use subprocess against the same page.
- Both may occasionally fail/wander (real LLM agents) — that is an expected, first-class outcome, not
  a hidden defect.

**Test target:** Chunk 2 drives against a trivial throwaway page only. The real detectability/security
levels are Chunk 3.

## 9. Sub-chunk split (each its own plan, each merged green before the next)

- **2a — Feather minimal-brain adapter:** `brain.ts` + `feather.ts` + mocked unit tests +
  `tower:smoke:feather`. Built first — the tool you own, no Python, lower-risk; proves the brain pattern.
- **2b — browser-use subprocess adapter:** `shim.py` + `requirements.txt` + `browser-use.ts` + mocked
  unit tests + `tower:smoke:browser-use`. Built second — the polyglot/Python seam is then the only new
  variable.

One spec (this document) covers both; 2a and 2b each get their own implementation plan when reached.

## 10. Out of scope for Chunk 2 (later chunks / PRs)

The real detectability + security **levels** (Chunk 3); scoring / CIs / AI report (Chunk 4); the
capability gate and WebArena track (PR-2); nodriver/Stagehand adapters + the differential transparency
guard (PR-2); JA3 wire capture (PR-2); the warmed-vs-cold signature harness (PR-3); the repo split
(revisit after PR-1).

## 11. Risks / guards

- **Driver-transparency is asserted by mechanism, not proven** (synthesis risk #1): the no-attach rule
  + HTTP/subprocess-only control keep the Tower off the data path, but a subtle adapter choice could
  still bias detectability. Mitigation lives in PR-2 (JA3 tap + differential guard); for Chunk 2, keep
  the adapters minimal and declare any non-default flag.
- **Cost / nondeterminism:** real LLM agents cost money and wander; keep live smokes opt-in and cheap
  (trivial goal, small step budget, hard timeout).
- **Polyglot ops on a solo builder** (synthesis risk #8): contain Python entirely behind the
  stdin/stdout protocol so the TS core only ever speaks TS + a process boundary; isolate the venv.
- **browser-use is a moving dependency:** pin its version in `requirements.txt`.
- Keep `behavioral.ts` / `classify.ts` untouched; keep the `Adapter` interface, the no-attach rule,
  and "verdicts come from outside the adapter" intact.
</content>
