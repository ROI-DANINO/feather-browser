# S3 — Dependency Currency & Security Checkpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get Feather off an unsupported Fastify runtime (v4 → v5), bring bundled Chromium current (Playwright → latest stable), and run a security checkpoint (`npm audit` + localhost API surface review) — without changing the HTTP API contract or dropping a single test.

**Architecture:** Research-gated sprint on `dev`. A throwaway-branch probe (Step 0) resolves the one real unknown — whether `fastify-sse-v2` survives Fastify v5 — and selects the Fastify path (clean bump vs. hand-rolled SSE handler). Codebase recon already shows the migration surface is thin: routes validate with Zod (no Fastify `schema:` blocks, so the v5 "full schema" break is N/A), `listen()` already uses object form, and no `request.connection`/`hostname`/`getDefaultRoute` usage exists.

**Tech Stack:** Fastify v5, `fastify-sse-v2` (or a hand-rolled `reply.raw` SSE handler), Playwright (latest 1.5x), Zod, Vitest. Node 20.

**Spec:** `docs/specs/2026-06-03-s3-currency-security-design.md`

**Baseline (must hold at every checkpoint):** 137 unit + 33 integration passing, `npm run typecheck` clean.

**Commands:**
- Unit: `npm test` (vitest run) — expect 137 passing
- Integration: `npm run test:integration` — expect 33 passing (real headless Chromium)
- Typecheck: `npm run typecheck`

---

## Task 1: Step 0 — Fastify v5 + `fastify-sse-v2` compatibility probe (the gate)

**Purpose:** Determine empirically whether `fastify-sse-v2@4.2.2` works under Fastify v5. This is a throwaway spike; its result selects Task 2's path. Do NOT keep this branch's state — it's diagnostic.

**Files:** none modified permanently (throwaway branch).

- [ ] **Step 1: Create a throwaway probe branch off `dev`**

```bash
git checkout dev
git checkout -b s3-probe-fastify-v5
```

- [ ] **Step 2: Record the current baseline is green BEFORE changing anything**

```bash
npm test && npm run test:integration && npm run typecheck
```
Expected: 137 unit pass, 33 integration pass, typecheck clean. If not, STOP — baseline is broken; fix or report before probing.

- [ ] **Step 3: Install Fastify v5 (keep sse-v2 as-is)**

```bash
npm install fastify@5
npm view fastify version   # record the exact v5.x resolved
```
Expected: fastify resolves to 5.x. `fastify-sse-v2` stays at 4.2.2 (its peerDep `>=4` permits v5; this probe tests whether that range claim holds in practice).

- [ ] **Step 4: Typecheck against v5**

```bash
npm run typecheck
```
Capture full output. Type errors here reveal v5 API signature changes our code touches (e.g. plugin types, reply augmentation for `reply.sse`).

- [ ] **Step 5: Run the unit suite against v5**

```bash
npm test
```
Capture full output — total passed/failed and the names of any failures.

- [ ] **Step 6: Run the integration suite — the SSE tests are the canary**

```bash
npm run test:integration
```
Capture full output. **Pay specific attention to `sse.integration.test.ts`** — `TAB_UPDATED` rides SSE now, so a silent SSE break is the exact regression this whole gate exists to catch. Note each SSE test's pass/fail individually, not just the aggregate.

- [ ] **Step 7: Manual SSE smoke test (validate beyond the suite)**

The integration tests assert SSE behavior, but confirm the live stream too, since plugin breakage can manifest as a hang rather than an assertion failure:

```bash
# terminal A
npm run dev
# note the printed token + port

# terminal B (replace TOKEN/PORT)
curl -N -H "X-Feather-Token: TOKEN" http://127.0.0.1:PORT/v1/events &
# then launch a session + open a tab via the API and confirm
# session.launch.* and tab.* events actually arrive on the curl stream,
# then Ctrl-C both.
```
Expected (PASS): events stream with correct `event:`/`data:` framing. (FAIL): connection hangs, no framing, or 500.

- [ ] **Step 8: Record the verdict**

Write the probe result to the session log / handoff: resolved Fastify version, typecheck result, unit result, integration result (SSE tests called out), smoke-test result, and the verdict:
- **PASS** (suite green + SSE smoke works) → Task 2A.
- **FAIL** → Task 2B. Capture the *exact* failure (stack/assertion) so 2B's contingency is informed.

- [ ] **Step 9: Discard the probe branch**

```bash
git checkout dev
git branch -D s3-probe-fastify-v5
git checkout -- . 2>/dev/null; git clean -fd node_modules >/dev/null 2>&1 || true
npm install   # restore dev's locked deps
```
The real migration happens cleanly in Task 2 on a fresh branch. (We do not build production work on a spike branch.)

---

## Task 2A: Fastify v5 migration — CLEAN BUMP path (only if Task 1 = PASS)

**Files:**
- Modify: `package.json` (fastify version)
- Verify (likely no change): `src/transport/http.ts`, `src/transport/routes.ts`, `src/transport/sse.ts`

- [ ] **Step 1: Branch for the real work**

```bash
git checkout dev && git checkout -b s3-currency-security
```

- [ ] **Step 2: Install Fastify v5 and update package.json**

```bash
npm install fastify@5
```
Confirm `package.json` `dependencies.fastify` now reads `^5.x.y` (the version the probe validated).

- [ ] **Step 3: Verify the known-N/A items stayed N/A (grep, don't assume)**

```bash
grep -rn "request.connection\|getDefaultRoute\|setDefaultRoute" src/   # expect: none
grep -rn "\.listen(" src/                                              # expect: object form only (http.ts:34)
grep -rn "schema:" src/transport/                                       # expect: none (Zod-only validation)
```
Expected: confirms the migration surface is empty for items 1, 3, 4, 5, 7. If any appear, fix per the spec's migration table before continuing.

- [ ] **Step 4: Run unit + integration + typecheck**

```bash
npm test && npm run test:integration && npm run typecheck
```
Expected: 137 unit, 33 integration, typecheck clean.

- [ ] **Step 5: Verify the DELETE-with-empty-body case (v5 item 6)**

v5 rejects `DELETE` + `Content-Type: application/json` + empty body. Our `DELETE /v1/sessions/:sessionId` does `CloseSchema.parse(request.body ?? {})`.

```bash
grep -rn "delete\|DELETE" test*/ tests/ src/ | grep -i session
```
Inspect how tests/clients call DELETE. If any send `Content-Type: application/json` with an empty body and now get a 400, the fix is to omit the Content-Type header on empty-body DELETEs (client side) — our handler already tolerates an absent body via `?? {}`. Confirm the close integration test passes (it's in the 33).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): migrate Fastify v4 -> v5

v4 LTS ended 2025-06-30. Migration surface was thin: routes use Zod
(no Fastify schema blocks), listen() already object-form, no
request.connection/hostname/getDefaultRoute usage. fastify-sse-v2
compat confirmed by Step 0 probe.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

➡️ **Skip Task 2B. Go to Task 3.**

---

## Task 2B: Fastify v5 migration — HAND-ROLLED SSE path (only if Task 1 = FAIL)

**Rationale:** `fastify-sse-v2` failed under v5. Per the spec, drop the plugin and own the SSE framing directly via `reply.raw`. `sseSource()` (the async generator) already produces `{id, event, data}` records — we only replace the plugin's `reply.sse(iterable)` sugar with explicit writes. (Fork-and-patch was rejected unless the break is a trivial one-liner; if the probe showed a one-line break, reconsider — otherwise hand-roll.)

**Files:**
- Modify: `package.json` (fastify v5; remove `fastify-sse-v2`)
- Modify: `src/transport/sse.ts` (remove plugin import/register; write framing to `reply.raw`)
- Modify: `src/transport/http.ts:30` (remove/empty the `registerSsePlugin` await if it becomes a no-op)
- Test: `tests/unit/sse-framing.test.ts` (new), existing `sse.integration.test.ts`

- [ ] **Step 1: Branch for the real work**

```bash
git checkout dev && git checkout -b s3-currency-security
npm install fastify@5
npm uninstall fastify-sse-v2
```

- [ ] **Step 2: Write the failing unit test for the framing helper**

Create `tests/unit/sse-framing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatSseFrame } from "../../src/transport/sse";

describe("formatSseFrame", () => {
  it("formats id/event/data as an SSE frame ending in a blank line", () => {
    const frame = formatSseFrame({ id: "0", event: "tab.created", data: '{"x":1}' });
    expect(frame).toBe('id: 0\nevent: tab.created\ndata: {"x":1}\n\n');
  });
});
```

- [ ] **Step 3: Run it — expect failure (function not exported yet)**

Run: `npx vitest run tests/unit/sse-framing.test.ts`
Expected: FAIL — `formatSseFrame is not a function` / not exported.

- [ ] **Step 4: Implement the framing helper and the raw handler in `src/transport/sse.ts`**

Remove `import { FastifySSEPlugin } from "fastify-sse-v2";`. Make `registerSsePlugin` a no-op (kept for call-site stability) and rewrite the route to write framing directly. Add the exported helper:

```ts
export function formatSseFrame(msg: { id: string; event: string; data: string }): string {
  return `id: ${msg.id}\nevent: ${msg.event}\ndata: ${msg.data}\n\n`;
}

export async function registerSsePlugin(_app: FastifyInstance): Promise<void> {
  // No plugin needed; SSE is hand-rolled in registerSseRoute via reply.raw.
}

export function registerSseRoute(app: FastifyInstance, tokenAuth: TokenAuthHandler): void {
  app.get("/v1/events", { preHandler: [tokenAuth] }, async (request, reply) => {
    const ac = new AbortController();
    request.socket.on("close", () => ac.abort());

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    // Take Fastify out of the response lifecycle for this hijacked stream.
    reply.hijack();

    try {
      for await (const msg of sseSource(ac.signal)) {
        reply.raw.write(formatSseFrame(msg));
      }
    } finally {
      reply.raw.end();
    }
  });
}
```
(`sseSource` is unchanged. `reply.hijack()` tells Fastify v5 we own the raw response.)

- [ ] **Step 5: Run the framing unit test — expect pass**

Run: `npx vitest run tests/unit/sse-framing.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full unit + integration + typecheck**

```bash
npm test && npm run test:integration && npm run typecheck
```
Expected: 138 unit (137 + new framing test) + 33 integration, typecheck clean. The existing `sse.integration.test.ts` must pass against the hand-rolled handler unchanged — if it asserts plugin-specific behavior, update the assertion to the framing contract, documenting why.

- [ ] **Step 7: Manual SSE smoke test** (same as Task 1 Step 7) — confirm the live stream frames correctly.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/transport/sse.ts src/transport/http.ts tests/unit/sse-framing.test.ts
git commit -m "chore(deps): migrate Fastify v4 -> v5; hand-roll SSE handler

fastify-sse-v2 incompatible with Fastify v5 (Step 0 probe). Dropped the
plugin and own the SSE framing via reply.raw + reply.hijack(); sseSource
generator unchanged. New unit test pins the frame format.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Playwright → latest stable

**Files:**
- Modify: `package.json` (playwright version)
- Possibly flag (no edit): `docs/phase-2-completion.md`, `journal/raw/_inbox/spike-system-chromium-executablepath.md`

- [ ] **Step 1: Record current bundled Chromium revision (before)**

```bash
npx playwright --version
node -e "console.log(require('playwright').chromium.executablePath())"
```
Note the version string and the revision in the path (baseline for comparison).

- [ ] **Step 2: Bump Playwright to latest stable and install the browser**

```bash
npm install playwright@latest
npx playwright install chromium
npx playwright --version   # record the new version
```

- [ ] **Step 3: Run integration suite (real Chromium) + unit + typecheck**

```bash
npm test && npm run test:integration && npm run typecheck
```
Expected: full suite green (137/138 unit + 33 integration). Integration is the real test here — it drives headless Chromium.

- [ ] **Step 4: Compare bundled Chromium major; flag docs if it shifted**

```bash
node -e "console.log(require('playwright').chromium.executablePath())"
```
The system-Chromium spike recorded bundled major **148**. If the new bundled major differs:
- Add a note to the S3 session log that `docs/phase-2-completion.md` RAM/CPU numbers and the system-Chromium spike's "same major (148)" finding are now **stale** (the FEATHER_CHROMIUM_PATH sprint must re-verify).
- Do NOT re-run the measurement scenario (out of scope — spec).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): bump Playwright to latest stable

Keeps bundled Chromium current (stealth: an outdated Chromium is a
fingerprinting tell). Full suite green against real headless Chromium.
[note Chromium major shift + stale measurement docs here if applicable]

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Security checkpoint

**Files:**
- Possibly modify: `package.json`/`package-lock.json` (only if audit fixes are clean)
- Output: findings note in the session log / `/stop` handoff (no standalone doc unless warranted)

### 4a. Dependency vulnerability scan

- [ ] **Step 1: Run npm audit (post-bump, reflects new versions)**

```bash
npm audit
npm audit --json > /tmp/s3-audit.json
```
Capture the summary (counts by severity) and each advisory's package + path.

- [ ] **Step 2: Triage and resolve cleanly resolvable findings**

```bash
npm audit fix          # only the non-breaking fixes
npm test && npm run test:integration && npm run typecheck
```
Run `npm audit fix` (NOT `--force`). After it, re-run the suite — if anything breaks, `git checkout -- package.json package-lock.json` and revert the fix; record the finding as accepted-risk instead. For anything unresolved (transitive, dev-only, no fix), record: advisory, severity, why not fixed.

- [ ] **Step 3: Commit any clean audit fixes**

```bash
git add package.json package-lock.json
git commit -m "chore(security): npm audit fix (non-breaking)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Skip this commit if `npm audit fix` changed nothing.)

### 4b. API surface review (read + spot-check, no feature work)

- [ ] **Step 4: Verify token auth on every `/v1/*` route**

Read `src/transport/routes.ts`. Confirm `{ preHandler: [tokenAuth] }` is present on all `/v1/*` routes (sessions, navigate, tabs, snapshot, extract, screenshot, debug-bundle, delete) AND on `GET /v1/events` (`registerSseRoute`, `sse.ts:70`). Confirm `/health` is intentionally open. Expected: every `/v1/*` gated; only `/health` open.

- [ ] **Step 5: Verify localhost-only binding survived the v5 migration**

Read `src/transport/http.ts:34` (`app.listen({ host, port })`) and trace `host` to its source (config/index). Confirm it resolves to `127.0.0.1`, never `0.0.0.0`. The v5 `.listen()` object form must not have widened the bind. Expected: bound to loopback only.

- [ ] **Step 6: Verify SSE emits only the allowlist**

Read `src/transport/sse.ts`. Confirm `LIFECYCLE_EVENTS` contains only the 10 lifecycle events (session.launch.*, session.close.*, tab.*) and the generator filters on it (`LIFECYCLE_EVENTS.has(evt.event)`), so per-command operation events never leak over the stream. Expected: allowlist enforced; no command payloads on the wire.

- [ ] **Step 7: Verify credential redaction still on the emission path**

```bash
grep -rn "redactProxy\|redactUrl" src/
```
Confirm redaction is applied at the log emission layer (logger) and that the Fastify v5 migration didn't bypass it. Spot-check a proxy launch test asserts the proxy password never appears in logs/responses. Expected: redaction intact.

- [ ] **Step 8: Write the security findings note**

Record in the session log / handoff: audit summary (counts, what was fixed, what's accepted-risk + why) and the API review result (each of steps 4–7: pass / issue found). If step 4–7 surface a real regression, STOP and fix it before closing S3.

---

## Task 5: Close-out

- [ ] **Step 1: Final full verification**

```bash
npm test && npm run test:integration && npm run typecheck
```
Expected: full suite green, typecheck clean.

- [ ] **Step 2: Push `dev`** (per push policy: remote `dev` only; `master` untouched)

```bash
git push origin s3-currency-security   # or merge to dev first per workflow, then push dev
```

- [ ] **Step 3: Update tracking** — PROGRESS.md, journal `phase.md`/`active.md`/`log.md`, desk context: S3 done, program functionally closed (modulo deferred FEATHER_CHROMIUM_PATH + observability/DebugCapture). Next: ROADMAP Phase 4 Step 0.

---

## Self-Review notes (author check vs. spec)

- **Spec Thread 1 (Fastify v5 + sse-v2 gate)** → Task 1 (probe) + Task 2A/2B (both paths fully detailed). ✓
- **Spec Thread 2 (Playwright + Chromium handling)** → Task 3, incl. version-shift doc-flagging, no measurement re-run. ✓
- **Spec Thread 3 (npm audit + API surface review)** → Task 4a/4b, all four review targets (token auth, binding, SSE allowlist, redaction). ✓
- **Spec constraints (suite green, no API change, dev-only, no sudo)** → verification steps in every task; no sudo invoked. ✓
- **Out-of-scope honored** (no FEATHER_CHROMIUM_PATH, no measurement re-run, no threat-model doc, dev-deps only if audit-flagged). ✓
- Type/name consistency: `formatSseFrame`, `sseSource`, `registerSsePlugin`, `registerSseRoute`, `LIFECYCLE_EVENTS` used consistently across tasks. ✓
