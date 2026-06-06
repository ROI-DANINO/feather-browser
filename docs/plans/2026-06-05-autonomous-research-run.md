# Autonomous Research Run — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan
> task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is an **unattended** run — Roi
> is out of the loop. Honor the spec's iron rules at all times.

**Goal:** Work Feather's backlog unattended — ship safe tech-debt code, execute the live cookie/anti-detection
spikes on a burnable `scratch` account, and seed Phase-5 research — stopping only at a genuine you-only wall.

**Architecture:** Ratchet order (bank guaranteed wins → high-information spike → rest of code → research
tail). All live browser work runs against `scratch` ONLY; the real `primary` session is never touched.
Code is TDD + frequent commits to `dev`; the spike and research are procedure/objective driven.

**Tech Stack:** TypeScript/Node, Playwright 1.60 + CDP, system Chromium 148, Fastify, vitest.

**Spec:** `docs/specs/2026-06-05-autonomous-research-run-design.md` (read it first — it owns the rationale,
constraints, and hard-stop conditions).

---

## Iron rules (repeat before every workstream)

1. **`scratch` only** for live browser work. `primary` is never opened/cloned/driven (one read-only
   "still logged in?" check at the very end is the only exception).
2. **Push `dev` only.** Never master. Each code task its own green commit. Never leave the tree broken.
3. **Lightweight lens:** for every artifact, ask *does this add shipped weight? can it be thin/opt-in?*
4. **Research-driven:** let spikes answer; record findings honestly, including negative results.
5. **Auto-revert** any code change that can't go green; leave a findings note instead.

## Pre-flight (executor, before Task 1)

- [ ] Confirm `scratch` was warmed: check for a `scratch` profile under Feather's data dir (the path
      `warm-session` prints as `profile : …/profiles/scratch`; resolve via `resolveDirs()` →
      `FeatherPaths.profileDir("scratch")`). If the `scratch` profile dir is absent, **do not run the
      live spike (②)** — do ①, ③, ④ and record that ② is blocked on the `scratch` warm-up.
- [ ] `git status` clean, on `dev`, `dev == origin/dev`. `npm ci` if needed.
- [ ] Baseline green: `npm test && npm run test:integration && npm run test:measurement`. Record counts.

---

# Workstream ① — ozone-platform configurable + un-gate tests (CODE → dev)

**Goal:** Stop hardcoding `--ozone-platform=wayland` so the headed CDP-attach path runs on CI/X11/headless,
then un-gate the 2 Wayland-pinned tests. Bank the first guaranteed win and put the anti-detection path
under CI.

**Files:**
- Modify: `src/browser/modes.ts` (the `spawnAndConnect` arg list, ~lines 39–48)
- Create: `tests/browser/modes-ozone.test.ts` (unit test for the new arg resolver)
- Modify: `tests/integration/attach-cdp.integration.test.ts:12` (remove the `WAYLAND_DISPLAY` gate)
- Modify: `tests/integration/system-chromium.integration.test.ts:43` (drop only the `WAYLAND_DISPLAY`
  clause; keep the system-binary presence guard)
- Modify: `.github/workflows/ci.yml` (run integration under Xvfb)

### Task 1.1: Extract a testable ozone/headless arg resolver

- [ ] **Step 1: Write the failing test** — `tests/browser/modes-ozone.test.ts`

```ts
import { describe, it, expect, afterEach } from "vitest";
import { resolveSpawnExtraArgs } from "../../src/browser/modes";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

describe("resolveSpawnExtraArgs", () => {
  it("uses wayland when FEATHER_OZONE_PLATFORM unset but WAYLAND_DISPLAY present", () => {
    delete process.env.FEATHER_OZONE_PLATFORM;
    process.env.WAYLAND_DISPLAY = "wayland-0";
    expect(resolveSpawnExtraArgs()).toContain("--ozone-platform=wayland");
  });

  it("omits the ozone flag when neither var is set (Chromium default / X11 / Xvfb)", () => {
    delete process.env.FEATHER_OZONE_PLATFORM;
    delete process.env.WAYLAND_DISPLAY;
    expect(resolveSpawnExtraArgs().some((a) => a.startsWith("--ozone-platform"))).toBe(false);
  });

  it("honors an explicit FEATHER_OZONE_PLATFORM override", () => {
    process.env.FEATHER_OZONE_PLATFORM = "x11";
    expect(resolveSpawnExtraArgs()).toContain("--ozone-platform=x11");
  });

  it("treats FEATHER_OZONE_PLATFORM=default as 'omit the flag'", () => {
    process.env.FEATHER_OZONE_PLATFORM = "default";
    expect(resolveSpawnExtraArgs().some((a) => a.startsWith("--ozone-platform"))).toBe(false);
  });

  it("adds --headless=new when FEATHER_SPAWN_HEADLESS is truthy", () => {
    process.env.FEATHER_SPAWN_HEADLESS = "1";
    expect(resolveSpawnExtraArgs()).toContain("--headless=new");
  });
});
```

- [ ] **Step 2: Run, verify it fails** — `npx vitest run tests/browser/modes-ozone.test.ts`
      Expected: FAIL (`resolveSpawnExtraArgs` is not exported).

- [ ] **Step 3: Implement** in `src/browser/modes.ts` (add above `spawnAndConnect`):

```ts
/**
 * Resolve env-driven spawn args for the headed CDP path.
 * - Ozone: explicit FEATHER_OZONE_PLATFORM wins ("default"/"none"/"" => omit the flag and let
 *   Chromium auto-pick, which is correct on X11/Xvfb). Unset => wayland only if WAYLAND_DISPLAY is
 *   present, else omit. This replaces the previous hardcoded `--ozone-platform=wayland`, which
 *   crashed on X11/headless/CI.
 * - Headless: FEATHER_SPAWN_HEADLESS truthy => `--headless=new` (lets a display-less runner attach
 *   over CDP). Prefer Xvfb in CI to keep the headed fingerprint faithful; this is the fallback.
 */
export function resolveSpawnExtraArgs(): string[] {
  const out: string[] = [];
  const explicit = process.env.FEATHER_OZONE_PLATFORM;
  if (explicit !== undefined) {
    const v = explicit.trim().toLowerCase();
    if (v && v !== "default" && v !== "none") out.push(`--ozone-platform=${explicit.trim()}`);
  } else if (process.env.WAYLAND_DISPLAY) {
    out.push("--ozone-platform=wayland");
  }
  const hl = (process.env.FEATHER_SPAWN_HEADLESS ?? "").toLowerCase();
  if (hl === "1" || hl === "true" || hl === "yes") out.push("--headless=new");
  return out;
}
```

- [ ] **Step 4: Run, verify pass** — `npx vitest run tests/browser/modes-ozone.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(browser): env-driven ozone/headless spawn args (resolveSpawnExtraArgs)"`

### Task 1.2: Use the resolver in spawnAndConnect

- [ ] **Step 1:** In `src/browser/modes.ts`, replace the hardcoded line `"--ozone-platform=wayland",`
      (currently `modes.ts:44`) so the arg list becomes:

```ts
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${opts.profilePath}`,
    "--no-first-run",
    "--no-default-browser-check",
    ...resolveSpawnExtraArgs(),
    "--disable-blink-features=AutomationControlled",
  ];
```

- [ ] **Step 2: Typecheck** — `npm run typecheck` → exit 0.
- [ ] **Step 3: Wayland regression** — on the Wayland dev box, `npm run test:integration` must still
      show the headed tests passing (WAYLAND_DISPLAY is set → wayland arg unchanged → behavior identical).
      Record the count.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(browser): spawnAndConnect uses resolveSpawnExtraArgs (no hardcoded wayland)"`

### Task 1.3: Un-gate the two headed integration tests

- [ ] **Step 1:** In `tests/integration/attach-cdp.integration.test.ts`, replace line 12
      (`const waylandIt = process.env.WAYLAND_DISPLAY ? it : it.skip;`) with `const waylandIt = it;`
      and update the comment block (lines 8–11) to note the ozone arg is now configurable. (Optionally
      rename `waylandIt` → `it` usage; minimal change is fine.)
- [ ] **Step 2:** In `tests/integration/system-chromium.integration.test.ts`, change line 43 to drop the
      `WAYLAND_DISPLAY` clause but **keep** the binary-presence guard:
      `const probe = systemBin && systemBuild ? it : it.skip;` and update the comment (lines 40–42).
- [ ] **Step 3: Run locally (Wayland)** — `npm run test:integration` → both un-gated tests run + pass.
- [ ] **Step 4: Simulate CI headless** — run the attach-cdp test with `FEATHER_SPAWN_HEADLESS=1` and
      `WAYLAND_DISPLAY` unset to confirm webdriver stays `false` headless:
      `env -u WAYLAND_DISPLAY FEATHER_SPAWN_HEADLESS=1 npx vitest run --config vitest.integration.config.ts tests/integration/attach-cdp.integration.test.ts`
      **If webdriver flips to `true` headless** → that's a finding: record it in the anti-detection report
      (Task ②.3) and rely on Xvfb (Task 1.4) instead of headless for CI. Do NOT force a passing test by
      weakening the assertion.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "test(integration): un-gate attach-cdp + system-chromium (ozone now configurable)"`

### Task 1.4: Run integration under Xvfb in CI (faithful headed path)

- [ ] **Step 1:** Read `.github/workflows/ci.yml`. In the integration job, install Xvfb and wrap the
      integration run: add `xvfb-run -a ` before `npm run test:integration` (and add a step
      `sudo apt-get update && sudo apt-get install -y xvfb` if not already present). Leave
      `FEATHER_OZONE_PLATFORM` unset so the resolver omits the flag (Chromium auto-picks X11 under Xvfb).
- [ ] **Step 2:** Keep `FEATHER_SPAWN_HEADLESS` UNSET in CI (Xvfb gives a real headed surface — more
      faithful for the anti-detection tests). Headless is only the fallback if Xvfb proves flaky.
- [ ] **Step 3: Commit + push** — `git add -A && git commit -m "ci: run integration suite under Xvfb so headed CDP tests un-gate" && git push origin dev`
- [ ] **Step 4: Watch CI.** Confirm the integration job is green with the 2 tests now RUNNING (not
      skipped). If red, diagnose from the run log; if Xvfb is the problem, fall back to
      `FEATHER_SPAWN_HEADLESS=1` (set in the workflow env) per the Task 1.3 finding. Update README's
      "35 passed + 2 skipped" line to the new reality once green.

---

# Workstream ② — Live spike block on `scratch` (RESEARCH; runs only if scratch warmed)

> **Procedure/objective driven — NOT test-first.** Record findings honestly, including negative results.
> Touch `scratch` ONLY. If Google challenges/invalidates `scratch`, record it as a finding and move on.

**Output artifacts:**
- `research/2026-06-05-cookie-isolation-spike-findings.md`
- `research/2026-06-05-anti-detection-self-test.md`
- `research/2026-06-05-cookie-mine-loop-demo.md` (pre-shell #6 / ADR-0007 gate evidence)

### Task ②.1: Cookie-isolation spike

- [ ] **Objective:** Determine whether cloning `scratch`'s Google cookies into a fresh isolated context
      keeps the user authenticated, and whether DBSC device-binding flags/invalidates the clone.
- [ ] **Procedure:**
  1. Launch `scratch` headed via the existing path; confirm logged-in (load `myaccount.google.com`,
     assert account chip present). If NOT logged in → stop ②, record "scratch session not live".
  2. Snapshot first (read-only): export `storageState()` (cookies + origin storage) to a temp file.
     Inspect for DBSC/session-bound cookies (e.g. `__Secure-1PSIDTS`, `__Secure-3PSIDTS`, any
     `DBSC`/device-bound markers). Record which cookies look device-bound.
  3. Create a SEPARATE fresh context (new `--user-data-dir` temp profile, same Chromium), inject the
     exported cookies, navigate to `myaccount.google.com`. Record: did auth survive? Any re-challenge?
  4. Wait/refresh and re-check the ORIGINAL `scratch` session: still valid, or did the clone trip a
     "session theft" invalidation? Record either outcome.
- [ ] **Acceptance / record:** auth-survival yes/no in the clone; original-session impact yes/no; the
      role of DBSC binding. Write the findings doc. **This answers whether copy-to-isolated is viable for
      `primary` later — but the decision for `primary` is Roi's (do NOT act on primary).**
- [ ] **Commit** the findings doc: `git add research/ && git commit -m "research: cookie-isolation spike findings (scratch)"`

### Task ②.2: Pre-shell #6 — Cookie Mine loop demo (ADR-0007 gate)

- [ ] **Objective:** Demonstrate the end-to-end loop on `scratch`: human-warmed session → agent
      piggybacks on the persistent context → completes a background task using the inherited auth —
      proving the *mechanism* (not the specific account).
- [ ] **Procedure:**
  1. With `scratch` warmed + logged in, launch a Feather session against the `scratch` persistent
     workspace (the agent side — same on-disk context, no human typing creds).
  2. Drive a simple authenticated background task that only a logged-in user can do (e.g. read the
     signed-in account email from `myaccount.google.com`, or fetch an authenticated Google page that
     returns user-specific content). Confirm it succeeds *because* of the inherited cookies.
  3. Capture evidence (screenshot/text proof of the authenticated result) into the debug dir.
- [ ] **Acceptance / record:** the loop closed (persistent human-warmed auth → agent used it →
      authenticated result) with `navigator.webdriver === false`. Write `cookie-mine-loop-demo.md` citing
      this as the ADR-0007 gate evidence. Note any rough edges for the GUI design.
- [ ] **Commit:** `git add research/ && git commit -m "research: pre-shell #6 Cookie Mine loop demo (scratch, ADR-0007 gate)"`

### Task ②.3: Anti-detection self-test (with headless/headed/Xvfb comparison)

- [ ] **Objective:** Empirically measure how detectable Feather's automated session is right now, and
      quantify the headless vs headed-CDP vs Xvfb-headed gap (answers "can we ever run this headless?").
- [ ] **Procedure:** Build a throwaway probe script (under `scripts/` or `research/`; **ships nothing**)
      that, for each mode below, opens a page and records a fingerprint vector:
  - `navigator.webdriver`; `navigator.plugins.length`; `navigator.languages`;
  - WebGL `UNMASKED_RENDERER_WEBGL` + `UNMASKED_VENDOR_WEBGL` (software-renderer tell);
  - `window.chrome` presence; `Notification.permission` vs `navigator.permissions` consistency;
  - User-Agent + UA-CH; canvas hash stability; a CDP-artifact check (e.g. `Runtime.enable` leakage if
    observable); basic timing/`performance` sanity.
  - Optionally point at a public detector (e.g. a bot-detection test page) and capture its verdict.
  - **Modes to compare:** (a) headed-CDP on Wayland (current default), (b) `--headless=new`,
    (c) headed under Xvfb (`xvfb-run`). Run each, tabulate the vector.
- [ ] **Acceptance / record:** a table of signals × modes; call out which signals leak in which mode;
      conclude on the headless question with evidence. Tie back to the spec §6 framing (anti-detection =
      user-authorized continuity, defensive). Write `anti-detection-self-test.md`.
- [ ] **Lightweight note:** confirm the probe harness is throwaway (not wired into shipped code).
- [ ] **Commit:** `git add research/ scripts/ && git commit -m "research: anti-detection self-test + headless/headed/Xvfb comparison"`

---

# Workstream ③ — Rest of the code (CODE → dev)

### Task 3.1: warm-session password-manager-disable-by-policy

**Goal:** Keep raw creds out of the shared cookie jar by disabling Chromium's built-in password manager
on the warmed profile, via profile Preferences (NO sudo, NO system-wide policy). Develop + verify on
`scratch` ONLY; do not modify `primary`'s profile in this run.

**Files:**
- Create: `src/browser/profile-policy.ts`
- Create: `tests/browser/profile-policy.test.ts`
- Modify: `src/tools/warm-session.ts` (call the policy before `manager.launch`)

- [ ] **Step 1: Write the failing test** — `tests/browser/profile-policy.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { disablePasswordManager } from "../../src/browser/profile-policy";

let dir: string;
beforeEach(async () => { dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-pol-")); });
afterEach(async () => { await fs.promises.rm(dir, { recursive: true, force: true }); });

describe("disablePasswordManager", () => {
  it("creates Default/Preferences with the password-manager keys off when none exists", async () => {
    await disablePasswordManager(dir);
    const prefs = JSON.parse(await fs.promises.readFile(path.join(dir, "Default", "Preferences"), "utf8"));
    expect(prefs.credentials_enable_service).toBe(false);
    expect(prefs.profile.password_manager_enabled).toBe(false);
  });

  it("merges into existing Preferences without clobbering other keys", async () => {
    const def = path.join(dir, "Default");
    await fs.promises.mkdir(def, { recursive: true });
    await fs.promises.writeFile(path.join(def, "Preferences"),
      JSON.stringify({ profile: { name: "keep-me" }, other: 1 }));
    await disablePasswordManager(dir);
    const prefs = JSON.parse(await fs.promises.readFile(path.join(def, "Preferences"), "utf8"));
    expect(prefs.other).toBe(1);
    expect(prefs.profile.name).toBe("keep-me");
    expect(prefs.profile.password_manager_enabled).toBe(false);
    expect(prefs.credentials_enable_service).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run tests/browser/profile-policy.test.ts` → FAIL.
- [ ] **Step 3: Implement** — `src/browser/profile-policy.ts`

```ts
import * as fs from "fs";
import * as path from "path";

/**
 * Disable Chromium's built-in password manager on a profile by merging the relevant prefs into
 * <profilePath>/Default/Preferences. Keeps raw creds out of the shared cookie jar (they belong in a
 * dedicated vault, separate from the context agents piggyback on). Merge-not-clobber so it never
 * destroys warmed session state. Must run while Chromium for this profile is NOT running.
 */
export async function disablePasswordManager(profilePath: string): Promise<void> {
  const defaultDir = path.join(profilePath, "Default");
  const prefsPath = path.join(defaultDir, "Preferences");
  await fs.promises.mkdir(defaultDir, { recursive: true });
  let prefs: Record<string, unknown> = {};
  try {
    prefs = JSON.parse(await fs.promises.readFile(prefsPath, "utf8")) as Record<string, unknown>;
  } catch {
    /* no existing prefs — start fresh */
  }
  prefs.credentials_enable_service = false;
  const profile = (prefs.profile as Record<string, unknown> | undefined) ?? {};
  profile.password_manager_enabled = false;
  prefs.profile = profile;
  await fs.promises.writeFile(prefsPath, JSON.stringify(prefs));
}
```

- [ ] **Step 4: Run, verify pass** — `npx vitest run tests/browser/profile-policy.test.ts` → PASS.
- [ ] **Step 5: Wire into warm-session** — in `src/tools/warm-session.ts`, after computing
      `paths`/`WORKSPACE_ID` and BEFORE `manager.launch`, add:

```ts
import { disablePasswordManager } from "../browser/profile-policy";
// ...inside main(), before `session = await manager.launch(...)`:
await disablePasswordManager(paths.profileDir(WORKSPACE_ID));
```

- [ ] **Step 6: Verify on `scratch`** — run `FEATHER_WARM_WORKSPACE=scratch npm run warm-session` long
      enough to confirm it launches; Ctrl-C; re-open the `scratch` `Default/Preferences` and confirm both
      keys are `false` and the session state survived. Record in the commit body. (Full "no save-password
      bubble" confirmation is deferred to the next real login — note this.)
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(warm-session): disable built-in password manager on the warmed profile (keep raw creds out of the jar)"`

### Task 3.2: vitest ^2 → ^4 (auto-revert on any trouble)

**Goal:** Clear the dev-only audit by jumping vitest two majors. **Time-boxed + auto-revert** — never
leave a half-broken test config.

- [ ] **Step 1: Checkpoint** — ensure clean tree (`git status`). Note current `HEAD`.
- [ ] **Step 2: Bump** — `npm i -D vitest@^4` and update the three `vitest.*.config.ts` for any v3/v4
      breaking changes (config API/threads/`environment` defaults; consult the vitest 3 & 4 migration
      notes). Use context7 docs if available for exact breaking changes.
- [ ] **Step 3: Run ALL suites** — `npm test && npm run test:integration && npm run test:measurement`
      plus `npm run typecheck`.
- [ ] **Step 4 (PASS path):** if everything is green → `npm audit` to confirm the dev-chain advisories
      cleared → commit `git add -A && git commit -m "chore(deps): bump vitest ^2 -> ^4; clear dev-only audit"` → push `dev`.
- [ ] **Step 4 (FAIL path):** if it is not cleanly green within a reasonable box → **auto-revert**:
      `git checkout -- package.json package-lock.json vitest.config.ts vitest.integration.config.ts vitest.measurement.config.ts && npm ci`
      then write `research/2026-06-05-vitest-bump-blocked.md` documenting exactly what broke (error
      excerpts + which config/API). Do NOT leave the bump half-applied. Move on.

---

# Workstream ④ — Research tail (DECISION DOCS; objectives, not pre-scripted answers)

> Depth-adaptive. Mark each artifact **complete** or **stubbed**. Carry the lightweight lens explicitly.

### Task 4.1: Shell-stack R&D + draft ADR

- [ ] **Objective:** Evidence-based comparison of **Tauri/WebKitGTK** vs **GTK4-native** (both with
      Playwright-managed Chromium) on Wayland for the Phase-4 shell, ending in a *recommendation* (the
      final pick is a joint call). Electron stays eliminated (bundles a 2nd Chromium).
- [ ] **Procedure:** Use context7/web for current state of Tauri on Linux/WebKitGTK + GTK4 + Wayland
      browser-surface embedding. Evaluate against: shipped weight/footprint, Wayland browser-surface
      viability, dev velocity, language fit, security/isolation. Anchor to ADR-0007.
- [ ] **Embed the two sub-analyses (Roi's questions):**
  - **Process boundaries vs "microservices":** microservices-as-distributed = anti-Feather (weight/IPC
    for a local single-user tool); but **process boundaries for security/fault isolation** (vault
    memory-isolation; crashed browser not killing the hub) earn their keep — map where a boundary pays
    vs is overhead.
  - **Language strategy:** language is irrelevant to stealth (site sees only Chromium); marginal to
    weight (Chromium dominates → no gut rewrite, YAGNI); the one narrow win is precise input timing for
    behavioral fidelity, which converges for free if Tauri (Rust) wins the shell. Defend "let the shell
    decision + fidelity-timing drive any language addition."
- [ ] **Output:** `docs/specs/adr-0009-shell-stack.md` (🚧 CANDIDATE / non-accepted) + recommendation.
      Commit. Mark complete vs stubbed.

### Task 4.2: Phase-4 GUI architecture sketch

- [ ] **Objective:** How the Zen-shell consumes the Phase-3 SSE event stream (`GET /v1/events`) to drive
      the vertical tab sidebar + session state; where the browser surface sits; thin-shell boundary.
- [ ] **Procedure:** Read `research/2026-06-02-sse-event-stream-spec.md` + the SSE route; sketch the
      data flow (events → UI state) and the shell↔core API boundary. Keep it thin (no agent panels).
- [ ] **Output:** `research/2026-06-05-phase4-gui-architecture-sketch.md`. Commit. Mark complete/stubbed.

### Task 4.3: Behavioral-fidelity design + (budget permitting) capture harness

- [ ] **Objective:** Design how Feather captures Roi's browsing signature (mouse paths, typing cadence,
      scroll/dwell), stores it as a **sensitive, credential-grade** profile, and replays it with
      fidelity — as a **thin, opt-in, off-by-default layer on the stealth path** (never core weight).
      This is Phase-5 forward work; the recording itself is a hard you-in-the-loop wall.
- [ ] **Procedure:** Anchor to `research/2026-06-03-phase-5-agent-perception-layer-notes.md`,
      `journal/raw/archive/2026-06-04-session-insights-behavioral-fidelity-security.md`, and the open
      inbox file `journal/raw/_inbox/2026-06-03-browser-agent-security-risks.md`. Decide the signal set,
      the secure storage model (treat like a credential; ties to the frozen vault — storage backend is a
      joint call, do NOT pick it), and the replay approach (CDP input timing).
- [ ] **Output (always):** `docs/specs/2026-06-05-behavioral-fidelity-design.md`. Commit.
- [ ] **Output (budget permitting):** a ready-to-run capture harness wired into the headed session so
      next session Roi just browses and it records. If budget runs short, ship the design + a clearly
      labeled harness **stub** with a TODO of exactly what's left. Commit. Mark complete vs stubbed.

---

# Closeout (always, even if the run is cut short)

- [ ] **Optional read-only primary check (the ONLY primary touch):** briefly confirm `primary` is still
      logged in (load an account page, read the chip, close). Record yes/no. Do not modify anything.
- [ ] **Update the journal handoff** (the next session resumes from these):
  - `journal/context/active.md` — new state + next action.
  - `journal/context/next.md` — a dated snapshot: what shipped, what each spike found, what's stubbed.
  - `journal/ops/tasks.md` — tick off ozone-platform/vitest/password-mgr/#6 as their status warrants.
  - `journal/log.md` — append the run summary line(s).
  - `journal/ops/sessions/autonomous-research-run-20260605.md` — full session record.
- [ ] **Deliverables manifest check** (spec §8): confirm each promised artifact exists or is explicitly
      marked blocked/stubbed with the reason.
- [ ] **Do NOT** merge to master, run sudo, touch `primary` beyond the read-only check, or pick any of
      the joint-call decisions (shell stack / cookie-iso-for-primary / vault backend). Leave those for Roi.
- [ ] **Final push** of `dev` (code commits only; research docs may stay local or push per the standing
      "push dev only" policy). Report a concise summary of what landed and what needs Roi.
