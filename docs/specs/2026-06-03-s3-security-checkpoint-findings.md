# S3 Security Checkpoint — Findings

**Date:** 2026-06-03
**Plan:** `docs/plans/2026-06-03-s3-currency-security.md` (Task 4)
**Context:** Run after the Fastify v5 + Playwright bumps, on branch `s3-currency-security`.

## 4a. Dependency vulnerability scan (`npm audit`)

**Result:** 5 vulnerabilities (4 moderate, 1 critical) — **all in the devDependency test
toolchain**, none in the runtime/production tree.

Advisory chain (all transitive under Vitest):

```
esbuild  <=0.24.2   (moderate) — dev-server SSRF: a website can make the esbuild
                                 dev server issue requests and read responses
  └ vite        — depends on vulnerable esbuild
     └ @vitest/mocker — depends on vulnerable vite
        └ vitest       — depends on the above
     └ vite-node     — depends on vulnerable vite
```

**Triage decision (approved by Roi):** do **not** force the fix.

- The only remediation is `npm audit fix --force`, which installs **`vitest@4`** — a breaking
  major bump of the test runner.
- The root advisory (esbuild GHSA-67mh-4wv8-2f99) is a **dev-server** issue. Feather ships and
  runs no Vite/esbuild dev server; the toolchain is used only to execute the test suite locally.
  Real-world exposure is effectively nil.
- These findings are **pre-existing** — identical on `dev` before the S3 bumps. The Fastify v5 /
  Playwright migration introduced no new vulnerabilities.
- `npm audit fix` (non-breaking) was run and changed nothing.

**Accepted risk.** Revisit if/when we touch the test toolchain (a `vitest@4` bump belongs in its
own dev-tooling sprint with its own verification), or if a runtime-tree advisory appears.

## 4b. API surface review

Confirmed the localhost control plane did not regress under the Fastify v5 migration. Trust
boundary intact.

| Target | Check | Result |
|--------|-------|--------|
| **Token auth** | All 11 `/v1/*` routes carry `preHandler: [tokenAuth]` (10 in `routes.ts` + `GET /v1/events` in `sse.ts`); `/health` intentionally open | ✓ PASS |
| **Binding** | `config.host` defaults to `127.0.0.1` (`config.ts:10`, env override `FEATHER_HOST`), passed to `app.listen({ host, port })` (`http.ts:34`). v5's object-form `.listen()` did not widen the bind | ✓ PASS (loopback by default) |
| **SSE allowlist** | `LIFECYCLE_EVENTS` (10 lifecycle events only) enforced by `LIFECYCLE_EVENTS.has(evt.event)` in the generator; per-command operation events never reach the stream | ✓ PASS |
| **Credential redaction** | `redactProxy` applied at the emission path (`manager.ts:72`); `redactUrl` in `redact.ts`; `proxy-redaction.integration.test.ts` (4 tests) asserts the proxy password never appears in logs/responses | ✓ PASS |

**No regressions found.** No production code change required by the security checkpoint.

## Note for future operators

`FEATHER_HOST` can override the bind address. The default (`127.0.0.1`) is safe; setting it to
`0.0.0.0` would expose the token-protected API on all interfaces — an explicit operator choice,
not a default. Worth a guardrail/warning if Feather ever ships a packaged distribution.
