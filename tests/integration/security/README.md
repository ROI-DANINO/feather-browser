# Security / abuse test surface

This directory is the canonical home for **abuse and hostile-input tests** of the local control plane.

## The rule

> **New agent-facing route ⇒ add an abuse case here.**

When you add or change a route that takes a request body, add it to the route list in
[`schema-abuse.integration.test.ts`](./schema-abuse.integration.test.ts). The invariant is absolute: a
malformed/hostile body must always come back as a clean `{ ok:false, error }` 4xx envelope — never a
5xx, a crash, or prototype pollution.

## What lives here

- `schema-abuse.integration.test.ts` — input-fuzz of the agent-facing routes (wrong types, empty/null,
  arrays, deep nesting, prototype-pollution attempt) asserting clean rejection + server survival.

## Related abuse coverage (elsewhere, by design)

These existing suites are strong and stay where they are to avoid churny relative-import moves; this
README indexes them so the security surface is discoverable from one place:

- `tests/integration/origin-host-hardening.integration.test.ts` — DNS-rebinding (foreign `Host`) +
  cross-origin CSRF (foreign `Origin`/`Referer`) rejection.
- `tests/integration/capability-gate.integration.test.ts` — dangerous-capability grant/approval gating.
- `tests/integration/secret-leakage.integration.test.ts` — no secrets in responses/logs.
- `tests/integration/proxy-redaction.integration.test.ts` — proxy credentials redacted.
- `tests/unit/transport/origin-host-guard.test.ts`, `tests/unit/transport/middleware.test.ts` — the
  Origin/Host guard and constant-time token auth at the unit level.
