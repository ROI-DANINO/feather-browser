# Design — Secret-Leakage Harness (ADR-0008 Spike C)

- **Date:** 2026-06-04
- **Status:** Design spec (proposed) — implements Spike C of [ADR-0008](adr-0008-credentials-vault.md)
- **Evidence basis:** [`research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md`](../../research/2026-06-04-credentials-vault-spike-c-leakage-probe-findings.md)
- **Context phase:** Phase 5 foundation (built during Phase 4). Gates ADR-0008 acceptance.

## Goal

Deliver the **standing pre-merge gate** ADR-0008 requires: an automated check that a secret
seeded into a Feather session never lands in an output surface that is meant to be clean. The
gate must be enforceable (green and kept green), reusable by every future credential feature,
and add no runtime dependencies.

## Non-goals (explicitly out of scope)

- **OCR / visual leak detection.** Screenshots leak secrets as pixels (proven: a visible canary
  is in the PNG but invisible to a text scan). The fix is policy ("don't screenshot sensitive
  sessions"), not detection. The harness documents this blind spot; it does not chase it.
- **Deep trace-archive scanning.** A `trace.zip` provably captures secrets that were never on
  screen (the `fill()` action arg, the POST body). It cannot be made safe by redaction, so the
  harness does not unzip and scrub it; it treats the *presence* of a trace on a secret-handling
  session as a finding. Deep scanning would also require a new zip dependency — avoided.
- **The `sensitive`-session flag + no-trace policy** — the eventual mitigation for traces/
  screenshots. That is a Phase 5 build, not Spike C.
- **SQLCipher / KeePassXC** — Spikes A and B.

## Evidence basis (from the probe)

Per the findings doc, with a secret entering via three vectors:

| Surface | password (POST) | URL query | visible text | Tier |
|---|---|---|---|---|
| Feather JSONL session log | clean | **LEAK** | clean | clean (hard-fail) |
| `network-summary.jsonl` | clean | **LEAK** | clean | clean (hard-fail) |
| `console`/`errors`/`commands.jsonl`, `manifest.json` | clean | clean | clean | clean (hard-fail) |
| `trace.zip` | LEAK ×3 | LEAK | LEAK | capture (report) |
| screenshots / trace JPEGs | masked/—\* | — | visual-only\* | capture (report) |

\* Visual leak exists but is undetectable by a text scan.

The one **clean-tier leak in shipping code** is URL-borne: `TAB_UPDATED` logs `data.url` raw
(`src/sessions/manager.ts:159`), and `network-summary.jsonl` records `request.url()`
(`src/debug/capture.ts`). `redactUrl()` does not help — it strips only `user:pass@` userinfo,
never query strings.

## Surface tiers

A file's tier is decided by an explicit **capture-tier allowlist**; everything else is
clean-tier. This is **fail-safe**: a new, unclassified artifact defaults to clean-tier, so an
unforeseen leak surface trips the gate rather than being silently ignored.

- **capture-tier (report, never fail):** `trace.zip`, anything under `screenshots/`, `*.jpeg`/
  `*.jpg`/`*.png`.
- **clean-tier (hard-fail):** everything else under the session's log + debug dirs — the JSONL
  logs, `network-summary.jsonl`, `console.jsonl`, `errors.jsonl`, `commands.jsonl`,
  `manifest.json`.

## Components

### 1. `assertNoSecretLeak(secret, roots, opts?)` — the reusable assertion

Location: `tests/helpers/leak-scan.ts` — a neutral, browser-free helper (pure filesystem logic),
so both the unit detector test and the integration test can import it without crossing the
unit/integration boundary. A single function (not a framework — there is one caller today; YAGNI).

- Walks each root directory recursively.
- For each file, classify tier by path/extension.
- **clean-tier:** read as UTF-8 (best-effort; unreadable/binary files are recorded as
  `unscannable`, not silently skipped) and check for `secret` as a substring. Any hit →
  `cleanTierHits`.
- **capture-tier:** do **not** scan contents. If the file exists at all and a secret was handled
  in this session, record it in `captureFindings` (presence = finding). Images are never text-
  scanned.
- Returns `{ cleanTierHits: FileHit[], captureFindings: string[], unscannable: string[] }`.
- **Throws** (failing the test) iff `cleanTierHits` is non-empty, with a message naming each
  leaking file and the surrounding match context. `captureFindings` and `unscannable` are
  surfaced via `console.warn` for visibility, never fatal.

The secret is a unique canary (`FEATHER-LEAK-CANARY-<uuid>`) so matches are unambiguous.

### 2. Hermetic fixture server — `tests/helpers/leak-fixture.ts`

A tiny loopback `http.Server` (no network) serving: a password login form (POST), a text-echo
form (POST, reflects input visibly), and a `/track?token=` endpoint (URL-query vector). Returns
`{ baseUrl, close() }`. Reusable by future credential tests.

### 3. Integration test — `tests/integration/secret-leakage.integration.test.ts`

Drives a real `chromium-headless-shell` session (mirrors `tab-updated.integration.test.ts`
bootstrap):

1. Launch a persistent session; `openTab()`.
2. Wire `DebugCapture` explicitly (it is dead code today, never instantiated by `launch()`), so
   the bundle + trace surfaces the future vault will enable are actually exercised now.
3. Seed the canary via the **autofill path** (type into a password field, submit) — the
   realistic case — and assert clean-tier surfaces stay clean.
4. Finalize the bundle, take a screenshot, `close()`.
5. `assertNoSecretLeak(canary, [debugDir, sessionLogDir])` → asserts no clean-tier leak; logs the
   trace/screenshot as reported capture findings.

### 4. The one code fix Spike C carries — URL query-string redaction

The URL-query vector is a genuine clean-tier leak in shipping code, so a gate that includes it
is red on day one. Spike C makes it green by **redacting query strings** at the two emission
points before they reach a clean-tier surface:

- `redactUrl()` (`src/logs/redact.ts`) gains query-string stripping (keep origin + path, drop
  `?…`), or a sibling `redactUrlForLog()` if we want the existing userinfo-only behavior kept
  elsewhere.
- Apply it to `TAB_UPDATED`'s `data.url` (`manager.ts:159`) and to `network-summary`'s recorded
  URL (`capture.ts`).

Existing redaction tests (`tests/unit/logs/redact.test.ts`) are extended for the new behavior.

> **Decided (2026-06-04):** the fix lands *inside* Spike C ("find → prove → fix → lock" in one
> self-contained gate). A gate that cannot be turned green is not a gate, and the fix is small
> and directly on-point.

## Data flow

```
canary ──► (password fill / URL / echo) ──► live session
   │                                            │
   ▼                                            ▼
clean-tier surfaces (logs, summaries)     capture-tier (trace, screenshots)
   │                                            │
   ▼                                            ▼
assertNoSecretLeak: scan text ─ hit? ─► THROW   presence ─► report (warn), never fail
```

## Error handling

- All artifact reads are best-effort; an unreadable file becomes an `unscannable` entry, never a
  silent skip and never a crash.
- Directory walk tolerates missing dirs (a surface not produced this run is simply absent).
- The browser session uses the established `force: true` close + tmp-dir cleanup pattern.

## Testing

The detector itself is proven red/green **without a browser**, in
`tests/unit/leak-scan.test.ts`:

- planted secret in a synthetic clean-tier file → `assertNoSecretLeak` **throws** (proves it
  catches leaks);
- clean tree → passes;
- secret only in a capture-tier file (e.g. a fake `trace.zip`) → does **not** throw, but the
  finding is reported (proves the tiering).

The integration test then proves the end-to-end behavior on a real engine. Whole suite
(`npm test` + `npm run test:integration`) must stay green.

## What lands

- `tests/helpers/leak-scan.ts`, `tests/helpers/leak-fixture.ts`
- `tests/integration/secret-leakage.integration.test.ts`
- `tests/unit/leak-scan.test.ts` (detector red/green)
- URL query-string redaction in `redact.ts` + applied in `manager.ts`/`capture.ts`, with
  extended `redact.test.ts`
- This is the reusable gate; every future credential surface re-runs `assertNoSecretLeak`.
