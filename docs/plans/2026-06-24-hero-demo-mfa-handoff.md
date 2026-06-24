# Hero Demo v2 — Visible Human Handoff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero demo show Feather's human-handoff mechanism on screen by swapping the silent
console login-poll for the shipped `await-human` handoff (on-page Resume banner + `resumeOn` auto-resume).

**Architecture:** One code change in `scripts/demo/continuity.ts` — `ensureHumanAuth`'s "not logged in"
branch calls `POST /v1/sessions/:id/await-human` instead of polling the console. Then a manual live gate
(does the banner survive Google's login redirect chain), then recording, then a docs touch-up. The
ChatGPT→Gmail errand and the `await-human` server code are untouched.

**Tech Stack:** TypeScript 5.4 / Node 20 / Vitest. `wf-recorder` for capture. Existing Feather HTTP API.

**Spec:** `docs/specs/2026-06-24-hero-demo-mfa-handoff-design.md`

## Global Constraints

- Keep all code, docs, and copy in **English**.
- `scratch` / throwaway Google account only — **never `primary`** (Roi's real Google). The demo's
  burner profile (`/run/user/<uid>/feather-demo`, tmpfs) is the login target; log in with the
  sacrificial account.
- Reuse the shipped `await-human` feature — **no new modules, no new endpoints, no new dependencies.**
- TDD for the code task; `npx tsc --noEmit` must stay clean; existing unit suite must stay green.
- Testing honesty: a banner that does **not** survive Google's redirects is an honest PARTIAL with a
  recorded lesson, not a failure to hide. Record whatever actually happens.

---

### Task 1: Swap `ensureHumanAuth` to the `await-human` handoff

**Files:**
- Modify: `scripts/demo/continuity.ts`
- Test: `tests/unit/scripts/continuity.test.ts`

**Interfaces:**
- Consumes: `IFeatherApi.request<T>(method, route, body?)` (unchanged), the shipped route
  `POST /v1/sessions/:sessionId/await-human` with body
  `{ reason: string, resumeOn?: { target: Target; until: "visible"|"hidden"|"attached"|"detached" }, banner?: boolean, timeoutMs?: number }`.
- Produces: `ensureHumanAuth(api, sessionId, config): Promise<void>` (signature unchanged).
  `ContinuityConfig` loses `pollIntervalMs` (no longer polls); keeps `targetUrl`, `checkTargets`,
  `timeoutMs`. The demo (`hero-chatgpt-gmail.ts`) calls it with only `targetUrl` + `checkTargets`, so
  dropping `pollIntervalMs` breaks no caller.

- [ ] **Step 1: Rewrite the two login tests (failing) + keep the already-authenticated test**

Replace the body of `tests/unit/scripts/continuity.test.ts` with:

```ts
import { describe, it, expect, vi } from "vitest";
import { ensureHumanAuth, IFeatherApi } from "../../../scripts/demo/continuity";

describe("ensureHumanAuth", () => {
  it("returns immediately when already authenticated", async () => {
    const api: IFeatherApi = {
      request: vi.fn()
        .mockResolvedValueOnce({}) // navigate to targetUrl
        .mockResolvedValueOnce({}), // wait — signal found immediately
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
      }),
    ).resolves.toBeUndefined();

    expect(api.request).toHaveBeenCalledTimes(2);
    expect(api.request).toHaveBeenNthCalledWith(
      1, "POST", "/v1/sessions/sid/navigate", expect.objectContaining({ url: "https://gmail.com" }),
    );
    expect(api.request).toHaveBeenNthCalledWith(
      2, "POST", "/v1/sessions/sid/wait", expect.objectContaining({ until: "visible", timeoutMs: 3000 }),
    );
  });

  it("hands off to the human with the on-page banner, then resumes after login", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn()
        .mockResolvedValueOnce({})                   // navigate
        .mockRejectedValueOnce(new Error("timeout")) // fast probe — not logged in
        .mockResolvedValueOnce({})                   // await-human — human/signal resumed
        .mockResolvedValueOnce({}),                  // post-check probe — authenticated
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
      }),
    ).resolves.toBeUndefined();

    expect(api.request).toHaveBeenCalledTimes(4);
    expect(api.request).toHaveBeenNthCalledWith(
      3, "POST", "/v1/sessions/sid/await-human",
      expect.objectContaining({
        banner: true,
        resumeOn: { target: { by: "css", selector: ".compose" }, until: "visible" },
      }),
    );
    expect(api.request).toHaveBeenNthCalledWith(
      4, "POST", "/v1/sessions/sid/wait", expect.objectContaining({ until: "visible", timeoutMs: 5000 }),
    );

    logSpy.mockRestore();
  });

  it("throws when resumed but login never completed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn(async (_method: string, route: string) => {
        if (route.endsWith("/navigate")) return {};
        if (route.endsWith("/await-human")) return {};
        throw new Error("element not found"); // every probe fails
      }),
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
        timeoutMs: 50,
      }),
    ).rejects.toThrow("not authenticated");

    logSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/scripts/continuity.test.ts`
Expected: FAIL — the second test fails because the current code never calls `/await-human` (it polls
`/wait`), so call #3 won't match; the third test fails because the current code throws
"Authentication timed out", not "not authenticated".

- [ ] **Step 3: Rewrite `ensureHumanAuth` and trim the config**

In `scripts/demo/continuity.ts`, remove the `pollIntervalMs` field from `ContinuityConfig`:

```ts
export interface ContinuityConfig {
  /** URL to check for authentication and to navigate to first. */
  targetUrl: string;
  /** Elements that indicate a successful login — any one match = authenticated. */
  checkTargets: Target[];
  /** Total time to wait for the human handoff before giving up (default: 300 000 ms = 5 min). */
  timeoutMs?: number;
}
```

Replace the whole `ensureHumanAuth` function body with:

```ts
/**
 * Ensures the session is authenticated before proceeding.
 *
 * Navigates to targetUrl and checks for a logged-in signal. If absent, hands off to the human using
 * Feather's shipped await-human mechanism: an on-page Resume banner appears (and re-injects across the
 * login redirect chain), the human logs in — completing any 2-step / 2FA in the same window — and the
 * handoff resolves either via the `resumeOn` signal (the inbox loads) or a manual Resume click.
 * The Cookie-Mine pattern: the agent piggybacks on the human's trust.
 */
export async function ensureHumanAuth(
  api: IFeatherApi,
  sessionId: string,
  config: ContinuityConfig,
): Promise<void> {
  const timeoutMs = config.timeoutMs ?? 300000;

  console.log(`\n[Continuity] Checking authentication at ${config.targetUrl}...`);
  await navigateTo(api, sessionId, config.targetUrl);

  if (await probeTargets(api, sessionId, config.checkTargets, 3000)) {
    console.log("[Continuity] Already authenticated. Proceeding...");
    return;
  }

  // Not logged in — hand off to the human with Feather's on-page Resume banner.
  console.log("\n  ⏸  [CONTINUITY] Login required — Feather is paused.");
  console.log("  → Log into Google in the browser window (finish any 2-step / 2FA).");
  console.log("  → Feather resumes automatically once you're in (or click Resume on the page).\n");

  await api.request("POST", `/v1/sessions/${sessionId}/await-human`, {
    reason: "Log into Google here — finish any 2-step / 2FA — then I'll continue (or click Resume)",
    resumeOn: { target: config.checkTargets[0], until: "visible" },
    banner: true,
    timeoutMs,
  });

  // A premature Resume click — or a server-side timeout — resolves the handoff before login finishes.
  if (!(await probeTargets(api, sessionId, config.checkTargets, 5000))) {
    throw new Error(
      "[Continuity] Resumed but Google is not authenticated yet — log in fully, then re-run.",
    );
  }
  console.log("[Continuity] ✓ Authenticated. Resuming demo.\n");
}
```

Leave `navigateTo` and `probeTargets` unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/scripts/continuity.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: Typecheck and full unit suite**

Run: `npx tsc --noEmit && npm test`
Expected: tsc prints nothing (clean); the full unit suite passes (no regression in
`hero-chatgpt-gmail.test.ts` or elsewhere).

- [ ] **Step 6: Commit**

```bash
git add scripts/demo/continuity.ts tests/unit/scripts/continuity.test.ts
git commit -m "feat(demo): hero demo uses await-human handoff for the Google login leg

Swap the silent console poll in continuity.ts for the shipped await-human
mechanism (on-page Resume banner + resumeOn auto-resume), so the human/2FA
handoff is visible on screen. Drops the now-unused pollIntervalMs config.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Live verification gate — banner survives Google's login flow (operate-by-hand)

This is the spec's gate. **Roi drives the human steps.** It proves the one real unknown before recording.

**Files:**
- Create: `docs/v1_wrap/hero-demo-v2/gate-report.md` (record the outcome + evidence)

- [ ] **Step 1: Start the demo against the burner profile**

In a terminal with `WAYLAND_DISPLAY`/`DISPLAY` set (headed):

Run: `npm run demo:hero`
Expected: a headed Chromium window opens on Gmail; because the burner profile is empty, Google
redirects it to the login page, and the console prints the `⏸ [CONTINUITY] Login required` lines.

- [ ] **Step 2: Observe the banner through the login redirect chain**

Watch the window (do NOT log in yet). Confirm, in order:
- The blue **"⏸ Feather paused: Log into Google here…"** banner is visible at the top of the login page.
- It **stays present** (re-injects) as you click through Google's steps: email → password →
  (if challenged) 2-step / 2FA. The page navigates several times (`accounts.google.com` and back); the
  banner should reappear each time.

Pass criterion: the banner is visible on the login page **and** survives at least one full navigation.
If the banner never appears on `accounts.google.com`, that is the CSP/redirect risk from the spec — stop
and record it (go to Step 5, PARTIAL).

- [ ] **Step 3: Complete login with the throwaway account and confirm auto-resume**

Log in fully with the **sacrificial** Google account (never `primary`). When the inbox loads, confirm:
- The console prints `[Continuity] ✓ Authenticated. Resuming demo.`
- The agent proceeds (Opening ChatGPT…) **without** you clicking Resume — proving `resumeOn` fired.

- [ ] **Step 4: Confirm the manual Resume backup (second run, optional but recommended)**

Re-run `npm run demo:hero` only if the burner profile was wiped (reboot) or you want a clean login. This
time click the **Resume ▸** button yourself before the inbox fully settles, then finish login. Confirm
the post-check either passes (you finished in time) or throws the clear
`Resumed but Google is not authenticated yet` message (proving the premature-click guard works).

- [ ] **Step 5: Record the outcome**

Write `docs/v1_wrap/hero-demo-v2/gate-report.md` with: PASS or PARTIAL, which steps held, screenshots of
the banner on the login page, and — if PARTIAL — exactly what broke (e.g. banner absent on
`accounts.google.com`) and the chosen fallback.

**Decision point:**
- **PASS** → proceed to Task 3.
- **PARTIAL (banner doesn't survive)** → before Task 3, either (a) confirm the `domcontentloaded`
  re-inject fires on cross-origin nav and fix if not, or (b) fall back: in `continuity.ts` set
  `banner: false` on the `await-human` call (off-page/console resume) and record the passive version.
  Re-run this gate after the change.

- [ ] **Step 6: Commit the gate report**

```bash
git add docs/v1_wrap/hero-demo-v2/gate-report.md
git commit -m "docs(demo): hero demo v2 banner-survival gate report"
```

---

### Task 3: Record the hero video + recording runbook (operate-by-hand)

**Files:**
- Create: `scripts/demo/RECORDING.md` (the runbook)
- Create: `demo-hero-mfa.mp4` (the recording — or chosen filename)
- Modify: `README.md` (the "Hero Demo" section, lines ~39–58)

- [ ] **Step 1: Write the recording runbook**

Create `scripts/demo/RECORDING.md`:

```markdown
# Recording the hero demo

Operate-by-hand. Uses `wf-recorder` (Wayland). Roi drives the human login.

1. Wipe the burner profile for a clean first-run login (optional, for the "logs in on camera" take):
   `rm -rf /run/user/$(id -u)/feather-demo`
   (Skip this to record the warmed re-run, which has no login step.)
2. Start the screen recorder on the browser region:
   `wf-recorder -g "$(slurp)" -f demo-hero-mfa.mp4`
   (`slurp` lets you drag-select the Chromium window region.)
3. In another terminal: `npm run demo:hero`
4. When the Feather banner appears, log in with the **throwaway** Google account (finish any 2FA).
   The agent auto-resumes (or click Resume ▸).
5. Let the agent finish: ChatGPT reply → Gmail draft (unsent). The script pauses with
   "Record the visible draft now…" — let the draft sit on screen a beat.
6. Stop the recorder (`Ctrl-C` on `wf-recorder`), then press Enter in the demo terminal to close the
   session cleanly.
7. Review `demo-hero-mfa.mp4`. Re-record if the banner/login/draft beats aren't all clearly visible.
```

- [ ] **Step 2: Record the demo**

Follow `scripts/demo/RECORDING.md`. Produce `demo-hero-mfa.mp4` showing: banner on login → human
login (+ 2FA if challenged) → auto-resume → ChatGPT reply → Gmail draft unsent.

- [ ] **Step 3: Point the README at the new video**

In `README.md`, update the "2. Hero Demo (ChatGPT → Gmail)" section so the **Demo video** line points to
`demo-hero-mfa.mp4` and one sentence notes it now shows the human-handoff banner during login. Keep the
existing `npm run demo:hero` command block. Example replacement for the video line:

```markdown
**Demo video:** See it in action — [`demo-hero-mfa.mp4`](demo-hero-mfa.mp4). Watch Feather's on-page
Resume banner during the Google login handoff (complete 2FA yourself if prompted), then the agent
piggybacks on your warmed session to finish the errand.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/demo/RECORDING.md demo-hero-mfa.mp4 README.md
git commit -m "docs(demo): record hero demo v2 (visible login handoff) + recording runbook"
```

---

### Task 4: Add a binary "done" line per version row in `feather.md`

Independent of the demo working — the second Phase 3 checklist item.

**Files:**
- Modify: `feather.md`

- [ ] **Step 1: Read the version rows**

Run: `grep -n -iE 'v1|v2|v3' feather.md | head -40`
Identify the v1 / v2 / v3 rows (the product-version narrative, not the API `/v1` prefix).

- [ ] **Step 2: Add one binary "done when" sentence per version row**

For each of v1, v2, v3 add a single plain sentence stating the binary condition that makes that version
"done" (e.g. v1: "Done when a stranger can clone, run `npm run demo:hero`, and watch the agent finish a
real logged-in errand."). Match the existing tone and the reorientation plan of record
(`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`) — do not invent scope; restate what
each version already promises as one binary check.

- [ ] **Step 3: Commit**

```bash
git add feather.md
git commit -m "docs(feather): add a binary done-line per version row"
```

---

## Self-Review

**Spec coverage:**
- Design change (continuity.ts swap to await-human) → Task 1. ✓
- Already-authenticated fast path preserved → Task 1 test 1 + unchanged code path. ✓
- `resumeOn` = `checkTargets[0]`, `banner: true`, post-check guard → Task 1 Step 3. ✓
- Drop unused `pollIntervalMs` → Task 1 Step 3 (verified no other caller). ✓
- Banner-survival live gate on scratch, PASS/PARTIAL + fallback → Task 2. ✓
- Recording runbook + video + README → Task 3. ✓
- `feather.md` per-version done-lines → Task 4. ✓
- Out of scope (mfa/challenge, mouse, errand logic) → not touched by any task. ✓

**Placeholder scan:** No TBD/TODO; all code shown in full; manual steps have concrete commands and pass
criteria.

**Type consistency:** `ensureHumanAuth(api, sessionId, config)` and `ContinuityConfig` (now without
`pollIntervalMs`) match across the function, its tests, and the demo caller. The `await-human` body
matches `AwaitHumanSchema` (`reason`, `resumeOn{target,until}`, `banner`, `timeoutMs`).
