# S3 Design — Dependency Currency & Security Checkpoint

**Date:** 2026-06-03
**Program:** Stabilization & Linux-Readiness (bridges Phase 3 → Phase 4)
**Sub-phase:** S3 — Currency & security
**Parent spec:** `docs/specs/2026-06-03-stabilization-linux-readiness-design.md`
**Status:** Approved (design). Implementation plan to follow.

## Scope

One spec, executed as a research-gated sprint (not split into sub-specs). Three threads, in
order:

1. **Fastify v4 → v5** — get off an unsupported runtime (v4 LTS ended 2025-06-30). Gated on a
   `fastify-sse-v2` v5 compatibility probe.
2. **Playwright → latest stable** — keep the bundled Chromium current (stealth-positive: an
   outdated Chromium is a fingerprinting tell).
3. **Security checkpoint** — `npm audit` triage + a localhost API surface review.

The threads share one verification surface (the existing test suite), which is why they live in
one spec rather than three. The one genuine fork — what to do if `fastify-sse-v2` fails against
v5 — is handled as an explicit documented contingency inside Thread 1 rather than a separate
spec, because the probe resolves it cheaply.

### North-Star framing (why this scope, and what it deliberately omits)

S3 is **currency/security hygiene**, not a stealth or weight sprint. Of S3's three threads, only
the Playwright bump touches the North Star, and only lightly: keeping bundled Chromium current is
the one stealth-relevant action here. The heavy levers are out of scope by design —

- **Weight** lives in `FEATHER_CHROMIUM_PATH` (use one system Chromium instead of a bundled copy).
  Spike-gated (`sudo dnf install chromium`), deferred. Playwright version is orthogonal to weight.
- **Stealth realism** (Cookie Mine trust context, realism controls) is Phase 5+, measured not
  assumed (ROADMAP).

## Constraints

- Existing HTTP API contract unchanged; full suite stays green (**137 unit + 33 integration**
  baseline) at every checkpoint, with new tests added on top.
- No agent runtime / LLM concepts introduced (stabilization boundary holds).
- `master` untouched; work lands on `dev`.
- Research-driven: each dependency bump begins by reading the relevant migration guide / changelog
  and running a compat probe **before** touching code.
- No `sudo` required anywhere in S3. (The only root step in the backlog is the deferred
  `FEATHER_CHROMIUM_PATH` Chromium install.)

---

## Thread 1 — Fastify v4 → v5

### Why

Fastify v4 LTS ended 2025-06-30. We are on `^4.28.0` — an unsupported runtime receiving no
security or bug fixes. This is the urgency behind S3.

### Step 0 — the hard gate (compat probe)

Before any migration code, in a throwaway branch:

1. `npm install fastify@5 fastify-sse-v2@latest` (latest sse-v2 is `4.2.2`; peerDep `>=4` permits
   v5 but it was only CI-tested against v4.10.x — **unproven**, per
   `journal/raw/_inbox/spike-fastify-sse-v2-v5-compat.md`).
2. Run the full suite, with specific attention to the SSE integration tests
   (`sse.integration.test.ts`) — `TAB_UPDATED` now rides SSE, so a silent SSE break is a real
   regression risk.

The probe result selects the path:

- **PASS** → Thread 1 is a clean bump: apply the migration items below, keep `fastify-sse-v2`.
- **FAIL** → escalate to the contingency below.

### Contingency (only if the probe fails) — replace `fastify-sse-v2`

Preferred fallback: **drop the plugin and hand-roll the SSE handler.** `src/transport/sse.ts`
already uses the async-generator queue pattern; the plugin mostly provides the
`reply.sse(asyncIterable)` sugar and the correct SSE headers/framing. Replacing it means owning
~the framing (`text/event-stream`, `Content-Type`, `Cache-Control: no-cache`, `Connection:
keep-alive`, `id:`/`event:`/`data:` lines, flush) and the keep-alive — a bounded, well-understood
amount of code we already half-own.

Rejected alternatives, recorded so we don't relitigate:
- **Pin sse-v2 + stay on Fastify v4** — defeats the entire point of S3 (running unsupported).
- **Fork-and-patch sse-v2** — viable only if the break is trivial (e.g. `done()` removal); decide
  at probe time. A hand-rolled handler removes the dependency-maintenance liability entirely and is
  preferred unless the fork is a one-liner.

The contingency decision (and which way it went) is recorded in the implementation plan and the
session log — not pre-decided here, because the probe hasn't run.

### Migration items (apply on the PASS path; also apply on the contingency path)

Derived from `journal/raw/_inbox/research-fastify-v5.md` and the official v5 migration guide.
Each is verify-then-fix — grep first, change only what exists:

| # | Change | Where to check | Likelihood |
|---|--------|----------------|------------|
| 1 | Full JSON schema required (`type: 'object'` shorthand removed) | `src/transport/routes.ts`, `sse.ts` route schemas | HIGH |
| 2 | Plugin API may not mix callback + promise styles | `src/transport/http.ts` plugin registration, `sse.ts` | MEDIUM |
| 3 | `.listen()` accepts object form only (no variadic) | the `listen()` call (server bootstrap) | LOW |
| 4 | `request.connection` removed → `request.socket` | grep `request.connection` in `src/` | LOW |
| 5 | `req.hostname` no longer includes port (`req.host`/`req.port` split) | grep `hostname` in `src/` | LOW |
| 6 | `DELETE` with `Content-Type: application/json` + empty body rejected | `DELETE /v1/sessions/:sessionId` callers/tests | LOW |
| 7 | `getDefaultRoute`/`setDefaultRoute` removed | grep in `src/` | LOW |

Node requirement: v5 needs Node 20+; we are on Node 20 — fine.

### Verification

Full suite green; SSE integration tests explicitly confirmed (real `GET /v1/events` stream still
delivers lifecycle events including `tab.updated`).

---

## Thread 2 — Playwright → latest stable

### Decision

Bump `playwright` from `^1.50.0` to the **latest stable 1.5x** (confirm exact version at execution
time — research-driven). Rationale: bundled Chromium tracks Chrome stable; staying current keeps
the fingerprint current, which is the one stealth-relevant lever in S3. Pinning conservatively is
quietly anti-stealth as Chromium drifts behind real Chrome.

### Bundled-Chromium version handling

After the bump, check the bundled Chromium major (`npx playwright --version` plus the installed
browser revision).

- The system-Chromium spike (`journal/raw/_inbox/spike-system-chromium-executablepath.md`) found
  **system 148 == bundled 148** (low version-skew risk for the future `FEATHER_CHROMIUM_PATH`
  work).
- If the bump shifts the bundled major, **note it in the spec/plan and flag two docs as stale** —
  `docs/phase-2-completion.md` (RAM/CPU measurement numbers) and the system-Chromium spike's
  "same major" finding.
- **Do not** re-run the measurement scenario now. Refreshing RAM/CPU numbers belongs with the
  `FEATHER_CHROMIUM_PATH` weight sprint, when the shipping Chromium binary is actually chosen.
  S3's energy stays on currency/security.

### Verification

Full suite green, including integration tests against real headless Chromium.

---

## Thread 3 — Security checkpoint

Scoped to two activities (threat-model doc and a separate `/security-review` gate were considered
and **declined** — YAGNI for a localhost-bound core pre-Phase-4).

### 3a. Dependency vulnerability scan

- Run `npm audit` against the full tree (post-bump, so it reflects the new Fastify/Playwright
  versions).
- Triage findings by severity. Resolve what is safely resolvable via the bumps already in S3;
  for anything that can't be cleanly fixed, record the finding + rationale (transitive, dev-only,
  no fix available) rather than forcing a risky change.
- This ties naturally into Threads 1–2 — the bumps are the primary remediation mechanism.

### 3b. API surface review

Confirm the localhost control plane has not regressed and the trust boundary still holds. Review
(read + spot-check tests, no new feature work):

- **Token auth** — `X-Feather-Token` enforced on all `/v1/*` routes including the SSE endpoint;
  `/health` intentionally open.
- **Binding** — server binds `127.0.0.1` only (not `0.0.0.0`); confirm the bootstrap and the v5
  `.listen({ host })` object-form change preserved this.
- **SSE endpoint** — `GET /v1/events` is read-only, token-gated, emits only the lifecycle event
  allowlist (`LIFECYCLE_EVENTS`), and per-command events stay filtered out (no command payloads
  leak over the stream).
- **Credential redaction** — `redactProxy`/`redactUrl` still applied at the log emission layer; no
  secret reaches JSONL logs, API responses, or the SSE stream. Spot-check that the v5 migration
  didn't bypass the logger path.

### Deliverable

A short findings note in the session log / handoff (audit triage outcome + API review result). No
standalone security doc unless the review surfaces something that warrants one.

---

## Testing

- **No new production features** ⇒ the bar is **regression**: the existing 137 unit + 33
  integration suite stays green at every checkpoint (post-Fastify, post-Playwright, post-audit).
- SSE integration tests (`sse.integration.test.ts`) are the canary for both the Fastify migration
  and any sse-v2 replacement — explicitly confirmed green, not just the aggregate count.
- If Thread 1 takes the contingency (hand-rolled SSE), add focused unit coverage for the new
  handler's framing (event/data lines, keep-alive) to replace the plugin's implicit guarantees.
- If a migration item (schema fullness, etc.) requires a behavioral change, the test that exercised
  the old behavior is updated and its intent documented.

## Out of scope

- `FEATHER_CHROMIUM_PATH` / system Chromium (deferred; spike-gated on `sudo dnf install chromium`).
- Re-running the resource measurement scenario (belongs with the weight sprint).
- Threat-model document and a standalone `/security-review` gate (declined — YAGNI for a
  localhost core pre-Phase-4).
- Dev-dependency currency for its own sake (vitest, typescript, zod) — bump only if `npm audit`
  flags a real vulnerability; otherwise leave stable.
- Agent perception layer / Actionable Tree (parked to Phase 5).

## Exit

After S3 lands on `dev` and the suite is green, the Stabilization & Linux-Readiness program is
functionally closed (modulo the explicitly-deferred `FEATHER_CHROMIUM_PATH` and observability/
`DebugCapture` sprints). Next hand-off: **ROADMAP Phase 4 Step 0** (research + plan the Visual
Desktop Shell).
