# A0 — Transport Hardening (Origin / Referer / Host Guard) — Implementation Plan

> **For agentic workers:** this is a **plan only**. No product code lands from this document.
> Implementation happens in a *separate* A0 code PR after this plan is reviewed and approved.
> Steps use checkbox (`- [ ]`) syntax for tracking when the code PR begins.

**Goal:** Add a single global request guard that rejects DNS-rebinding (`Host` mismatch) and
cross-origin browser-driven requests (`Origin`/`Referer` foreign) before any route handler runs.
This is the **A0** slice of Gate A — the cheap, self-contained transport hardening that closes the
worst concrete hole (the MFA/CSRF drive-by + DNS-rebind) and depends on **none** of the A1
capability machinery.

**Scope (hard boundaries, per the approving instruction):**

- ✅ Global `Host` / `Origin` / `Referer` validation hook.
- ❌ **No** A1 capability logic, tiers, or session-hold primitive.
- ❌ **No** grant registry / capability grants.
- ❌ **No** approval-page implementation.
- ❌ **No** MFA implementation.
- ❌ **No** product behavior change beyond transport hardening — every request that is legitimate
  today must stay legitimate after A0.

**Spec / parent decision:** `docs/specs/adr-0010-local-control-plane-capability-model.md` (§3),
`docs/specs/2026-06-11-gate-a-capability-system-design.md` (the A0 section).

**Tech Stack:** TypeScript, Fastify 5, Vitest. All new code follows existing patterns in
`src/transport/` and `tests/{unit,integration}/transport/`.

**Classification:** Core browser stability / security (transport hardening). No new dependencies, no
new top-level modules.

---

## The model A0 implements

| Header | Rule | Rationale |
|---|---|---|
| **Host** | Reject unless host portion ∈ `{ 127.0.0.1, localhost, [::1] }`. | A DNS-rebinding attacker controls DNS (resolves `evil.com` → `127.0.0.1`) but **not** the `Host` header the browser sends (`evil.com`). Requiring a loopback host name kills rebind. **This is the load-bearing check.** |
| **Origin** | If **present and foreign** → reject. If **absent** → allow. | A browser CSRF drive-by always sends `Origin` on cross-origin POST/`no-cors`. Non-browser callers (the agent's HTTP client, `curl`) send none — so absent must pass. |
| **Referer** | Same as Origin: present-and-foreign → reject; absent → allow. Only consulted as a fallback when `Origin` is absent. | Some browser requests carry `Referer` but not `Origin`; checking both widens coverage without breaking non-browser callers. |

"Foreign" = the `Origin`/`Referer` URL's `host:port` is not the server's own loopback origin. Loopback
bind stays unchanged.

---

## Critical pre-implementation verification (BLOCKER — resolve before writing the guard)

`src/transport/http.ts:31-33` carries a comment asserting there is an **on-page banner cross-origin
form POST to the `/resume` route**. If that flow is live, a blanket foreign-`Origin` rejection on the
resume routes would **break the await-human resume banner** — a product behavior change, which A0
forbids.

**Evidence is contradictory and must be settled first:**

- `src/transport/http.ts:31-33` — comment says the urlencoded body parser exists *because of* a
  cross-origin banner POST to `/resume`.
- `journal/archive/next/2026-06-09/0219-...md:68-69` — says the banner "no longer needs"
  `getBaseUrl`, implying the cross-origin POST was removed.
- `src/transport/resume-page.ts:19` — the served resume page form is `action=""` → **same-origin**
  POST (the human opens the `127.0.0.1` resume link directly, per `await-human.ts:27` surfacing
  `resumePath`). This path is same-origin and unaffected by an Origin check.

**Action:** grep the codebase + run the `await-human` integration test headed to confirm whether any
live flow performs a **cross-origin** POST to `/resume`. Record the finding in the code PR. The
result decides the resume-route question below.

---

## Design decision needed at review: resume-route Origin handling

The **Host** check applies to **all** routes unconditionally (the resume banner, wherever it posts
from, still targets `127.0.0.1` with a loopback `Host`). The open question is only about the
**Origin/Referer** check on the two `/resume` routes:

- **Option R1 (recommended if verification shows resume is same-origin):** apply Origin/Referer
  foreign-reject **globally**, resume routes included. Simplest, strongest. Safe *iff* no live
  cross-origin banner POST exists.
- **Option R2 (if a cross-origin banner POST is still live):** apply the **Host** check globally but
  **exempt the `/resume` routes from the Origin/Referer check**, leaving their existing single-use
  query-token as their protection. Their full Origin hardening (humanToken + CSRF nonce + CSP) is
  then **explicitly deferred to the MFA plan** — which is out of A0 scope by instruction, and which
  replaces that page wholesale anyway.

I will **not** pick between R1/R2 unilaterally — it depends on the verification result and is a
behavioral call. Flag it at review with the evidence attached.

---

## File structure

| File | New/Modify | Responsibility |
|---|---|---|
| `src/transport/middleware.ts` | Modify | Add `createOriginHostGuard(opts)` → returns a Fastify `onRequest` hook. Lives beside `createTokenAuth`. |
| `src/transport/http.ts` | Modify | Register the guard as the **first** `onRequest` hook (before `injectRequestId`), so rejection precedes body parsing and route preHandlers. |
| `tests/unit/transport/origin-host-guard.test.ts` | New | Pure-function matrix over header combinations (no server). |
| `tests/integration/origin-host-hardening.integration.test.ts` | New | Real `startHttpServer` on `127.0.0.1:0`; live `fetch` with crafted `Host`/`Origin`/`Referer`. |
| `docs/api-reference.md` | Modify (small) | One paragraph documenting the guard + the 403 envelope. No endpoint changes. |

No new files outside these. No config knob (the loopback allowlist is fixed); revisit only if a real
need appears.

---

## Implementation shape (for the code PR — not built here)

**Guard signature (illustrative, not a locked contract):**

```ts
// src/transport/middleware.ts
export function createOriginHostGuard(): (req: FastifyRequest, reply: FastifyReply) => Promise<void>
```

- **Host check:** parse `req.headers.host`; accept iff its host portion ∈
  `{ "127.0.0.1", "localhost", "::1" }`. The **port** is validated against the actual bound port via
  `req.socket.localPort` (inherently correct, needs no post-`listen` wiring — avoids the
  port-0-in-tests problem). Hostname allowlist is the load-bearing part; port match is strictness.
- **Origin/Referer check:** read `req.headers.origin` (fallback `req.headers.referer`); if absent →
  pass; if present → parse and accept iff `host` is a loopback name and (if checking) port matches.
- **On reject:** `reply.status(403).send(fail(requestId, code, message))` using the **existing**
  `fail()` envelope shape (`{ ok:false, requestId, error:{ code, message } }`). Codes:
  `FORBIDDEN_HOST` / `FORBIDDEN_ORIGIN`. Add both to `ERROR_STATUS` (→ 403) if routed through the
  shared error path, or send directly from the hook.
- **Registration order (`http.ts`):** the guard is added as an `onRequest` hook **before** the
  existing `injectRequestId` hook. `onRequest` is the earliest Fastify lifecycle phase, so rejection
  happens before body parsing and before any route `preHandler` (`tokenAuth`) — a hostile request is
  refused without touching a handler. Note: `requestId` is injected by the *second* hook, so the
  guard either injects its own id first or tolerates `requestId` being absent in its reject path.

---

## Test matrix

The matrix is the deliverable's teeth — it must include requests that are **rejected**, not just the
happy path (testing-honesty rule).

### Unit (`origin-host-guard.test.ts`) — pure header logic, mocked req/reply

| # | Host | Origin | Referer | Expect |
|---|---|---|---|---|
| 1 | `127.0.0.1:<port>` | *(absent)* | *(absent)* | **pass** (the agent/curl case) |
| 2 | `localhost:<port>` | *(absent)* | *(absent)* | **pass** |
| 3 | `[::1]:<port>` | *(absent)* | *(absent)* | **pass** |
| 4 | `evil.com:<port>` | *(absent)* | *(absent)* | **reject** `FORBIDDEN_HOST` (DNS-rebind) |
| 5 | `127.0.0.1:<port>` | `http://127.0.0.1:<port>` | — | **pass** (same-origin) |
| 6 | `127.0.0.1:<port>` | `https://evil.com` | — | **reject** `FORBIDDEN_ORIGIN` (CSRF drive-by) |
| 7 | `127.0.0.1:<port>` | *(absent)* | `https://evil.com/x` | **reject** `FORBIDDEN_ORIGIN` (Referer fallback) |
| 8 | `127.0.0.1:<port>` | *(absent)* | `http://127.0.0.1:<port>/y` | **pass** (same-origin referer) |
| 9 | *(absent host)* | — | — | **reject** `FORBIDDEN_HOST` (no Host header) |
| 10 | `127.0.0.1:<wrong>` | — | — | **reject** if port-strict (document the choice) |

### Integration (`origin-host-hardening.integration.test.ts`) — real server, live `fetch`

- **Token+Host happy path:** authenticated `GET /v1/sessions` with correct token and default
  (loopback) Host → **200**. Confirms A0 does not regress the existing authed surface.
- **`/health` unaffected:** `GET /health` with loopback Host, no Origin → **200**.
- **Foreign Origin on an authed route:** `POST /v1/sessions` with valid token **but**
  `Origin: https://evil.com` → **403 `FORBIDDEN_ORIGIN`** (proves the guard fires *before* and
  *independent of* token auth).
- **Spoofed Host:** any route with `Host: evil.com` → **403 `FORBIDDEN_HOST`**.
- **Resume route regression guard:** exercise the **exact** live resume flow (per the verification
  result) and assert it still returns 200. This is the test that protects R1/R2 from breaking
  await-human.
- **Existing suites stay green:** `transport.integration.test.ts`, `await-human.integration.test.ts`,
  `sse.integration.test.ts` run unchanged (no header-setting `fetch` in them sends a foreign Origin,
  so they should pass as-is — confirm).

---

## Task breakdown (for the code PR)

- [ ] **Task 0 — Verification (blocker):** settle the cross-origin-resume question; record finding;
      decide R1 vs R2 with the reviewer.
- [ ] **Task 1 — Guard function** in `middleware.ts` (`createOriginHostGuard`) + unit test matrix.
- [ ] **Task 2 — Wire the hook** in `http.ts` as the first `onRequest` hook; per R1/R2, scope the
      Origin check (global, or global-except-resume).
- [ ] **Task 3 — Integration tests** (`origin-host-hardening.integration.test.ts`), including the
      resume-route regression guard.
- [ ] **Task 4 — Docs:** one paragraph in `docs/api-reference.md`; note the 403 codes.
- [ ] **Task 5 — Full suite green** (`npm test` / vitest), graphify auto-refresh on commit.

---

## Out of scope (deferred to later Gate A slices, explicitly NOT here)

- A1: tiers, session-hold primitive, capability-grant registry, dangerous-mode policy, dual audit.
- The resume/MFA page security stack (humanToken + per-page CSRF nonce + strict CSP) — owned by the
  **MFA plan**, which replaces that page wholesale.
- Any change to the token-auth model, the bind address, or route surfaces.

## Open questions for review

1. **R1 vs R2** (resume-route Origin handling) — depends on Task 0's verification. *Primary review
   decision.*
2. **Port strictness** — validate `Host`/`Origin` port against `req.socket.localPort`, or accept any
   port with a loopback host name? (Recommend: enforce, since `localPort` is free and correct.)
3. **`localhost` allowance** — keep `localhost` in the allowlist (some callers use it), or restrict to
   numeric loopback only for the tightest rebind posture? (Recommend: keep `localhost` — it cannot be
   rebound to a non-loopback address by an attacker who doesn't control the user's hosts file.)
