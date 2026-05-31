# Tech Stack Analysis Report

**Date:** 2026-05-31  
**Scope:** Feather Browser — server-side code audit + external research (Playwright 1.50+, Fastify 4.x, Node.js patterns)

---

## 1. Codebase Audit

### Architecture Strengths

The structural decisions in this codebase are sound and should be preserved:

- **CommandHandler\<TIn,TOut\> pattern** — clean separation of transport, command, and session layers; each concern is independently testable
- **Dependency injection** — `SessionManager` and handlers are injected rather than imported as singletons; facilitates testing and future replacement
- **Custom error hierarchy** — `SessionNotFoundError`, `PageNotFoundError`, `ProfileLockedError` each carry a `.code` property; enables precise error discrimination at route boundaries
- **Zod validation at route boundary** — validation is centralized and consistent; not scattered across handlers
- **`Promise.allSettled` in index.ts** — graceful shutdown does not abort on first failure; all cleanup paths run to completion
- **`fs.promises` throughout** — no sync I/O in hot paths

### Issues — Severity-Ranked

#### Critical (fix before any production use)

| # | File | Issue | Impact |
|---|------|-------|--------|
| 1 | `middleware.ts` lines 17–18 | Token auth sends 401 but does **not** `return` early; handler execution continues after rejection | Auth bypass on any rejected request |
| 2 | `snapshot.ts` | Uses `new Function()` for page evaluation | CSP violation risk; use Playwright's `.evaluate()` with arrow functions |
| 3 | `manager.ts` | `context.close()` has no timeout | Can hang indefinitely on unresponsive browser; blocks session cleanup |
| 4 | `lock.ts` | File lock uses read-then-write (check-then-create); not atomic | Race condition between two concurrent launchers; second launcher may miss the lock |
| 5 | `manager.ts` line ~156 | Session removed from registry **before** profile cleanup | If cleanup fails, profile directory leaks silently with no record of it |

#### High Severity

| # | File | Issue | Impact |
|---|------|-------|--------|
| 6 | `capture.ts` line ~42 | `void Promise.resolve(request.response()).then(...)` — fire-and-forget | Thrown errors are silently swallowed; no observable failure |
| 7 | `snapshot.ts` / `extract.ts` | Schema defines `limits` field (`textChars`, `linkCount`) but handlers hardcode limits (20,000 chars, 200 links) and ignore schema values | Schema contract is broken; callers cannot control extraction limits |
| 8 | `extract.ts` | Bare `catch` returns `null` with no logging | Silent field extraction failures; no diagnostic path |
| 9 | `session.ts` `toRecord()` | Hardcodes `pages: []` instead of calling `getPageInfoList()` | Inconsistent state representation; callers cannot trust session record |

#### Medium Severity / Race Conditions

| # | File | Issue | Impact |
|---|------|-------|--------|
| 10 | `manager.ts` | No per-session command lock | Two concurrent `navigate`/`snapshot` calls on the same session can race |
| 11 | `workspace.ts` `ensureExists()` | Read-then-write race | Two concurrent launches could both pass the existence check and both write |
| 12 | `capture.ts` | Context event listeners (network, console, pageerror) added but never removed | Potential listener leak over session lifetime |
| 13 | `logger.ts` | Silently skips logging when `sessionId` is missing | `SERVICE_STARTED` and other global events are not logged; silent gap in observability |
| 14 | `debug/capture.ts` | `DebugCapture` is wired only in the debug-bundle handler; not integrated into normal command flow | Large subsystem with partial integration; debug data is incomplete under normal operation |

### Positive Patterns Worth Preserving

- SIGTERM/SIGINT signal handler pattern in `index.ts`
- `ProfileLock.release()` handles `ENOENT` gracefully (idempotent release)
- Immutable session metadata via `Object.defineProperty`
- Fastify middleware chain: request ID injection and token auth as separate concerns
- `DebugBundle` manifest generation is clean and version-aware

---

## 2. Research Findings

### Playwright 1.50+

**Context model.** The recommended pattern is one `Browser` instance per process, one `BrowserContext` per session. `BrowserContext` creation is fast (~10–50ms); `Browser` startup is expensive (~500–2000ms). The current codebase uses `launchPersistentContext()`, which bundles both — appropriate for the persistent-profile use case, but it means browser instances cannot be reused across sessions.

**Headless shell.** `chromium-headless-shell` (default since v1.45) is the correct choice for a multi-session server. Chrome for Testing uses ~20GB per instance — it must not be used in this context.

**Memory.** Playwright has known gradual memory growth with page loads; memory is not fully freed after `page.close()` across all versions. Explicit `context.close()` is essential for reclamation — and the missing timeout on that call (issue #3 above) is therefore a higher-risk defect than it may appear.

**Breaking changes in range.**
- v1.52: glob URL patterns no longer support `?` or `[]`
- `page.type()` deprecated — prefer `locator.fill()`
- Neither change affects the current codebase directly.

**Verdict on current Playwright usage:** Architecturally sound. The `launchPersistentContext` pattern is correct for the persistent/disposable profile model. The primary risk is the missing `context.close()` timeout.

---

### Fastify 4.x

**Schema validation.** Fastify natively recommends JSON Schema (TypeBox or Ajv) for performance. Zod performs deep cloning on each validation, which adds measurable overhead at high throughput. At the traffic levels of a browser automation server — where sessions, not HTTP validation, are the bottleneck — Zod overhead is acceptable.

**Graceful shutdown.** The idiomatic Fastify integration point for cleanup is `fastify.addHook('onClose', ...)`, not signal handlers in `index.ts`. The current approach works but bypasses Fastify's lifecycle and could miss cleanup registered via Fastify plugins.

**Request context propagation.** `@fastify/request-context` (AsyncLocalStorage-based) is the recommended pattern for propagating `requestId` into nested async calls. The current approach injects `requestId` at route level only; it does not flow automatically into deep async call chains.

**Verdict on current Fastify usage:** Solid. Fastify 4.28 is current stable. No API deprecations affect current code. Zod at this traffic level is fine.

---

### Node.js Patterns

**Session registry (`Map`).** `Map` is the correct choice for explicit lifecycle management. `WeakMap` cannot be iterated — it would be wrong for a registry that needs enumeration on shutdown. No TTL mechanism exists, but sessions are explicitly closed, which is acceptable for a controlled-use server.

**File-based locking (`lock.ts`).** Linux file locks (`fcntl`/`flock`) have poor crash-recovery semantics and are unreliable for cross-process coordination. For a single-process server (current architecture), this is tolerable. The check-then-create pattern in `lock.ts` compounds this with a race condition (issue #4 above). Recommended fix: use `fs.open` with the exclusive flag (`wx`) for atomic creation. If single-process deployment is guaranteed, an in-process `Map`-based lock is simpler and race-free.

---

## 3. The Verdict

**Decision: Maintain As-Is & Apply Forward**

With a targeted exception list of critical bugs that must be fixed before production deployment. The architecture does not need to be reversed or restructured.

### Technical Justification

| Factor | Assessment |
|--------|------------|
| Architectural decisions | Sound. The layered design (transport / command / session), DI, and `CommandHandler` pattern are all correct choices. No inversion required. |
| Critical bugs | Small, targeted fixes — not refactors. The five critical issues (middleware no-return, `new Function()` eval, missing timeout, lock race, registry/cleanup ordering) each have obvious, localized fixes. |
| Dependency choices | Fastify + Playwright + TypeScript remain the right choices at current scale. No upgrades are required. |
| High/medium issues | All addressable in-place without architectural change. |
| Scope of risk | Implementation-level, not structural. The bugs are real and must be fixed, but they do not indicate that the design is wrong. |

### Required Actions Before Production

1. Fix `middleware.ts` auth no-return (issue #1) — one line
2. Replace `new Function()` in `snapshot.ts` with Playwright `.evaluate()` (issue #2)
3. Add timeout to `context.close()` in `manager.ts` (issue #3)
4. Make `lock.ts` atomic using `fs.open` with `wx` flag (issue #4)
5. Swap registry removal and profile cleanup order in `manager.ts` (issue #5)

The high-severity issues (silent promise swallowing, ignored schema `limits`, bare-catch nulls, broken `toRecord()`) should follow in the same release. The medium issues can be addressed incrementally.

No dependency changes, no architectural refactoring, and no migration work are required.
