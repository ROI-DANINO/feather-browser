> **DISPOSITION — thread CLOSED 2026-06-23.** Actioned by a `cleanup/overengineering-sweep` branch,
> merged to `dev` + pushed (`48d4dbe`; cuts in `b30d43a` + `e97951a`). All gates green (typecheck,
> 435/435 unit, wait + debug-capture integration 9/9 on real Chromium).
>
> - **DONE (safe, behavior-preserving):** #9 `recordCommand` (+`commands.jsonl` write), #10
>   `getDefaultPageId`, #10 `WarmStatus "unknown"`; #4 the two `wait.ts` "stable" loops collapsed
>   into one `pollUntilStable` helper.
> - **KEPT by decision:** #1 `measurement/` (Roi — dev/benchmark tool, on-mission for the
>   lightweight pitch); #3 `holds.observe/has/count` (the read-surface for the policy layer that's
>   on the roadmap — commit `f7afbb8` says so).
> - **DEFERRED / SKIPPED (optional, NOT owed — pull from below one at a time if ever wanted):**
>   #8 `isLocked` + #6 single-grant `revoke` (security-flagged file-locking / capability code;
>   would need rewriting security tests for ~16 lines); #5 HTML-escape dedup (only the escaper is
>   shared, and it lives on the XSS-sensitive approval/MFA pages — wants its own reviewed change);
>   #7 approval double-check (security defense-in-depth, leave it); #2 the 26-file class→function
>   flatten (working code, high churn, touches the MFA contract); the tiny cosmetics; repo-weight
>   (the video is referenced in README and history-rewrite was declined, so not cleanly actionable).
>
> Each finding below still carries its `Verify` + `Action` lines. Re-check before acting — code moves.

---

# Ponytail Audit — Over-Engineering Sweep (repo-wide)

**Date:** 2026-06-23
**Scope:** over-engineering / complexity ONLY (not bugs, security, or perf — those are out of scope for this pass).
**Method:** whole-tree scan of `src/` (~5.9k LOC, ~83 TS files). Findings produced by 5 parallel audit agents, each verified callers before reporting. This file is **intake only** — nothing here is a decision until promoted to `docs/specs/` or actioned.

> **How to use this with your own agent:** each finding has a `Verify` line (a grep/command that proves the claim) and an `Action` line (what to cut). Hand your agent one finding at a time, have it run the `Verify` step first, and only cut if the verification still holds. They were true at audit time but code moves — re-check before deleting. Suggested order: do the **two big structural ones first** (measurement delete, command-class flatten), then the small deletes.

Ranked **biggest cut first**.

---

## 1. `delete` — Entire `src/measurement/` subsystem (~290 lines, **-2 deps**)

A speculative benchmark harness (runner + reporter + sampler). Never wired into the running server — only the `test:measurement` vitest config + `tests/measurement/` reach it. It is also the **only** consumer of the `pidusage` dependency.

- **Verify:**
  ```bash
  grep -rn "measurement/" src/ | grep -v "src/measurement/"   # expect: no hits
  grep -rln "pidusage" src/ tests/ scripts/                   # expect: only src/measurement/sampler.ts
  ```
- **Action:** delete `src/measurement/`, or `git mv` it under `tests/measurement/` if you want to keep the harness for benchmarks. Then `npm rm pidusage @types/pidusage` and drop the `test:measurement` script + `vitest.measurement.config.ts` if you delete outright.
- **Why it's safe:** zero production import path. The only thing that breaks is the measurement test suite, which moves with it.

## 2. `yagni` — Flatten the 24 command classes to functions (~75 lines + kills a dead abstraction)

Every file in `src/commands/` is `class XHandler implements CommandHandler<...> { constructor(private manager){} async execute(input, _ctx){...} }`. The `ctx`/`_ctx` param is **never read by any handler**, and the `CommandHandler` interface is used as a real structural type in exactly one place. `routes.ts` calls each handler by name with a hand-written ctx the handlers ignore — there is no central dispatch table that needs the uniform `execute(input, ctx)` shape.

- **Verify:**
  ```bash
  grep -rn "ctx\." src/commands/                # expect: no real uses of the ctx param
  grep -rn "CommandHandler" src/                 # expect: handler.ts decl + ~1 structural use (mfa/manager.ts)
  ```
- **Action:** convert each handler to a plain exported function `async function click(manager, input) {...}`; delete the `class`/`implements`/ctx param/import line in all 24 files and the `CommandHandler` interface in `handler.ts`. Update the call sites in `routes.ts`. Do **not** build a dispatch helper — just flatten.
- **Note:** the per-file `IManager` micro-interfaces are NOT part of this cut — they're deliberate interface-segregation (each handler declares only the manager slice it needs). Leave them.

## 3. `yagni` — `SessionHoldRegistry.observe()` / `has()` / `count()` (~25 lines)

The "policy layer that observes holds" doesn't exist yet. Production only ever calls `releaseAllForSession`.

- **Verify:** `grep -rn "\.observe(\|\.has(\|\.count(" src/capability/ src/ | grep -i hold` → only `tests/unit/capability/holds.test.ts` touches them.
- **Action:** delete the three methods from `src/capability/holds.ts` (~lines 105-129) and their tests.

## 4. `shrink` — Collapse the two `stable` poll loops in `wait.ts` (~25 lines)

`src/commands/wait.ts` has two near-identical `until === "stable"` poll loops (lines ~32-58 and ~84-113) differing only in a one-line read (`handle.textContent()` vs `loc.textContent({timeout:1000})`).

- **Verify:** open `src/commands/wait.ts`, compare the two blocks.
- **Action:** extract `pollUntilStable(readFn, opts)` and call it from both branches.

## 5. `yagni` — Shared HTML escaping helper (~14 lines)

`esc`+`shell` are duplicated in `transport/resume-page.ts` and `transport/approval-page.ts`, plus a third `escapeHtml` in `mfa/local-page.ts`.

- **Verify:** `grep -rn "function esc\|escapeHtml\|function shell" src/`
- **Action:** hoist one `esc`/`shell` into a new `src/transport/html.ts`; import from all three.

## 6. `yagni` — `CapabilityGrantRegistry.redeem()` + `revoke(id)` (~12 lines)

`redeem()` is only reached internally via `consumeGranted` (inline it). Single-grant `revoke(id)` has no production caller — only `revokeAllForSession` is used.

- **Verify:** `grep -rn "\.redeem(\|\.revoke(" src/ | grep -v revokeAll` → only test files.
- **Action:** inline `redeem` into `consumeGranted`; delete `revoke(id)`. `src/capability/grants.ts` ~lines 122-134, 161-163.

## 7. `shrink` — `service.ts resolveApproval` double-checks (~8 lines)

`resolveApproval` peeks + CSRF-checks, then calls `consume()` which performs the same checks again.

- **Verify:** read `src/capability/service.ts:66-82` against `ApprovalStore.consume`.
- **Action:** collapse to a single `consume()` call and branch on its `ConsumeResult` (which becomes genuinely used).

## 8. `delete` — `ProfileLock.isLocked()` (~8 lines)

No `src/` caller; `read()` (returns `LockData | null`) covers every real need.

- **Verify:** `grep -rn "isLocked" src/` → only `src/profiles/lock.ts` + tests.
- **Action:** delete the method (`src/profiles/lock.ts` ~75-82) and its test.

## 9. `delete` — Dead command-recording in `DebugCapture` (~6 lines)

`recordCommand()` + the `commands` array + the `commands.jsonl` write have zero callers anywhere — the file is always empty.

- **Verify:** `grep -rn "recordCommand" src/ tests/` → declaration only.
- **Action:** remove `recordCommand`, the `commands` field, and the `commands.jsonl` write in `src/debug/capture.ts` (~25, 33, 83-85).

## 10. Small deletes (group these together, ~9 lines total)

- `delete` — three identity error classes set `this.name = "..."` but routing keys off `.code` only; `.name` is never read. `src/identity/types.ts:59,67,75`. **Verify:** `grep -rn "\.name" src/transport/http-helpers.ts` → routing uses `.code`.
- `delete` — `FeatherSession.getDefaultPageId()` has no `src/` caller; `getPage()` covers it. `src/sessions/session.ts:130-132`. **Verify:** `grep -rn "getDefaultPageId" src/`.
- `delete` — `WarmStatus` `"unknown"` member is never produced (only `"cold"`/`"warm"` set). `src/identity/types.ts:15`. **Verify:** `grep -rn '"unknown"' src/identity/`.
- `yagni` — `newId` in `src/commands/screenshot.ts:17` duplicates the helper in `sessions/session.ts:23`; import the existing one.
- `yagni` — `const sleep = ...` redeclared in `wait.ts:14` and `await-human.ts:9`; hoist one shared `sleep` (pairs with finding #4).
- `yagni` — `WorkspaceData` `[key: string]: unknown` index signature: nothing reads/writes beyond `workspaceId`/`createdAt`. `src/profiles/workspace.ts:7`.
- `stdlib` — `randomUUID().replace(/-/g, "").slice(0, n)` (grants.ts:85, holds.ts:69, sessions/session.ts:22): the dash-strip is cosmetic; full `randomUUID()` is already unique/opaque. Cosmetic, optional.

---

## Optional — raises an abstraction, borderline for a "lazy" call

`shrink` — the ~20 POST/GET handlers in `src/transport/routes.ts` are the same try/parse/execute/send/catch block; a `register(app, method, path, schema, fn)` helper collapses each to ~1 line (~80 lines saved) but trades line count for one new layer. **Leave it unless the file grows again.**

---

## Repo weight (not code — but worth a `git mv` / `.gitignore`)

- `demo-final.mp4` — 1.1M binary committed to the repo.
- `docs/v1_wrap/claude-for-chrome/capture/` — 636K of checked-in `.jsonl` panels/timelines (captured artifacts).

Move to a release asset / LFS or gitignore them; they bloat clone size and aren't source.

---

## Explicitly NOT over-engineered (verified — do not "simplify" these)

These looked like ceremony but are load-bearing; the audit checked each and is leaving them:

- Per-file `IManager` micro-interfaces — deliberate interface segregation.
- `MfaNotifier` interface — has 3 real impls (Console/Composite/Telegram), wired in routes.ts.
- `logs/bus.ts` — thin EventEmitter wrapper but 3 real consumers (sse, logger, capability/service).
- `parseAuthority`/`parseUrlAuthority` — handles bare `Host` (no scheme) + bracketed IPv6; not replaceable by plain `new URL()`.
- `closeContextWithTimeout` — Playwright's `context.close()` takes no `timeout` option, so the race is justified.
- Atomic tmp+rename writes, the capability service, CSP page constants, Origin/Host guard — security-critical, spec-backed.
- `ExtractSchema` preprocess wrapper — has tests + a documented real-world failure mode (agents posting flat `{fields}`).
- `VersionedPolicy` / `WorkspaceData` forward-compat seams — flagged low-confidence; per S3/S4 notes they may be deliberate. Confirm intent before touching.

---

## Bottom line

**net: ~-474 lines, -2 deps** taking only safe behavior-preserving cuts — or **~-554 lines** if you also adopt the routes.ts registration helper.

Highest leverage: **#1 (delete `measurement/`)** is the cleanest big win; **#2 (flatten command classes)** is the highest-leverage *structural* simplification.

**Caveat:** this was a complexity pass, not a correctness/test pass. Every cut needs `npm run typecheck && npm test` green before it lands. Do the cuts on a short-lived branch off `dev` per the branch rules.
