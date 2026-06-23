# Session-Identity Testing — Design Spec

> **Status:** design (brainstormed + approved 2026-06-23). Not yet a plan; not yet implemented.
> **Scope gate:** implementation is **gated behind the finished v2 security spine** (5b MFA → 5c
> attach). This doc locks the *model and schema* now; code waits. See
> [`2026-06-23-v2-spine-completion-plan.md`](2026-06-23-v2-spine-completion-plan.md).
> **Safety authority:** [`docs/testing/anti-bot-testing-policy.md`](../testing/anti-bot-testing-policy.md)
> owns *what may be touched*. This doc owns *how it is measured*.
> **Raw origin (archived after canonicalization):** `journal/raw/archive/2026-06-23-agentic-browser-antibot-testing-{research,bibliography}.md`.

## 1. The core idea — test *session identity*, not a *page*

The unit under test is **not** "does Feather pass CreepJS once." It is:

```
testSessionIdentity(profile, browserMode, viewport, proxy, target, repetitions)
```

A **session identity** is the tuple `(workspaceId, browserMode, viewport, profileKind, proxy)`. It is
a *measurable object with artifacts and a run ID*, evaluated on two axes:

1. **Coherence across layers** — TLS/HTTP ↔ browser-JS ↔ WebGL/Canvas/Audio ↔ worker/iframe ↔
   storage. A value patched only in the main window but absent (or different) in a Worker or iframe
   is the classic automation tell.
2. **Stability across time** — the *same* tuple, run N times against the *same* persistent profile,
   should produce stable, explainable results.

> Feather can look fine in one sandbox test and still look suspicious in real anti-bot environments
> if its layers drift. The framework's job is to catch drift and incoherence, honestly.

This model holds from Tier 0 (local) through Tier 4 (advanced anti-bot): **same object, riskier
target.** One data shape spans all tiers so a Tier-0 baseline and a Tier-4 result are directly
comparable.

## 2. How it maps onto the existing architecture

The framework is **mostly orchestration over primitives that already exist**, plus one new evaluator
and (from Tier 1) one genuinely new capability.

| Testing concept | Existing component (reused) | New work |
|---|---|---|
| Session-identity tuple | `LaunchSessionInput` (`workspaceId`/`browserMode`/`viewport`/`proxy`) + `profileKind` | none — the tuple *is* a launch request |
| Run attribution | `req_<uuid>` per request + `ses_` session IDs + per-session JSONL | a `runId` spanning N sessions |
| Repeated-run diffing | `measurement/runner.ts` already drives launch→…→close and **diffs two runs** | generalize "2 browser modes" → "N identical tuple runs" |
| Artifacts | `DebugCapture`/`DebugBundle` (`commands`/`network-summary`/`console`/`errors`.jsonl + `trace.zip` + `manifest.json`) + screenshots | a reporter modeled on `measurement/reporter.ts` writing `.feather/fingerprint-runs/<runId>/` |
| Browser-mode axis | 3 modes (`chromium-new-headless`, `headless-shell`, `headed-cdp`) | harness *consumes* them as a test axis |
| Surface capture | `page.evaluate` (already used by snapshot/extract) | a realm-agnostic **fingerprint probe** run in main + worker + iframe |
| **TLS/JA4/HTTP fingerprint** | ❌ nothing — Playwright exposes no transport-layer fp | **the one new capability** — appears at Tier 1 via an external reflector (tls.peet.ws) or a local TLS-inspecting server; `null` at Tier 0 |
| Proxy coherence | `ProxyConfig` → redacted `ProxySummary` | harness asserts proxy ASN/timezone/locale consistency |

**Verdict:** Tier 0–1 is ~80% wiring of existing primitives + one evaluator + one probe payload.

## 3. Layer-consistency capture — main ↔ worker ↔ iframe

**One probe, three realms, one comparator.**

- **The probe** is a single realm-agnostic capture function (one source, not three copies) reading a
  fixed signal set: `navigator.webdriver`, `userAgent`, `languages`, `hardwareConcurrency`,
  `deviceMemory`, WebGL vendor/renderer, `canvasHash`, `audioHash`, `timezone`, `locale`.
- **The fixture** (Tier 0) is a small static page served on `127.0.0.1` (zero network) that loads the
  probe and runs it in three realms:
  - **main window** — Feather reads it via the existing `extract`/`snapshot` loop;
  - **dedicated Worker** — the fixture spawns a Worker (Blob URL or served `worker.js`) that runs the
    *same* probe and `postMessage`s its result back;
  - **same-origin iframe** — a **real local-HTTP iframe** running the same probe.
    > ⚠️ `data:`-URL iframes are opaque-origin (known Feather gotcha) — the iframe MUST be a real
    > local fixture URL, not a `data:` URL, or same-origin checks are meaningless.
  - The fixture collects all three onto `window.__fpResult`; Feather `extract`s that object.
- **The comparator** is **three-valued per signal**, and this is the make-or-break correctness point:
  - `equal` → **pass**
  - `differ` → **fail** (signals defined in ≥2 realms that disagree — the real automation leak)
  - `missing-in-realm` → **n/a** (NOT a failure)

  Workers genuinely cannot see some signals (no DOM Canvas without `OffscreenCanvas`, no `screen`).
  If "missing" counted as failure, every run would falsely fail. Realm-portability is encoded in the
  schema (`worker`/`iframe` realms are `Partial`), not assumed.

No new browser internals: this is the observe→extract loop pointed at a local page.

## 4. Data model — `TestRunManifest` (Zod)

The inbox files had a flat per-visit "result schema" but lacked the **parent object** spanning
repetitions. That parent is `TestRunManifest`. Conceptual shape (final field names settled at plan
time):

```
TestRunManifest                 // parent; one per runId
  runId            string       // e.g. fp_2026_06_23_001
  createdAt        ISO-8601
  tier             'tier-0' | 'tier-1' | … | 'tier-4'
  target           { name, category, authorization }   // authorization gates the run (see policy)
  sessionIdentity  {            // ← THE UNIT UNDER TEST — projection of LaunchSessionInput + SessionRecord
    workspaceId, browserMode, viewport, profileKind, proxySummary   // proxySummary = redacted, safe to commit
  }
  repetitions      Repetition[] // N runs of the SAME tuple
  consistency      ConsistencyVerdict
  artifacts        { screenshot, trace, networkSummary, console, rawFingerprint }  // reuse DebugBundle paths
  verdict          { status: 'pass'|'warn'|'fail', score: number, blockers: string[] }

Repetition
  sessionId        string       // ses_…
  requestId        string       // req_…
  capturedAt       ISO-8601
  realms {
    main           FingerprintSurface
    worker         Partial<FingerprintSurface>   // realm-portability (§3)
    iframe         Partial<FingerprintSurface>
  }

FingerprintSurface              // Tier-0 subset; transport/JA4 fields null until Tier 1
  navigatorWebdriver  boolean
  userAgent           string
  languages           string[]
  hardwareConcurrency number
  deviceMemory        number | null
  webglVendor         string | null
  webglRenderer       string | null
  canvasHash          string | null
  audioHash           string | null
  timezone            string
  locale              string
  // Tier 1+: ja3, ja4, http2Fingerprint, alpn, headerOrder  (all null at Tier 0)

ConsistencyVerdict              // each: 'pass' | 'warn' | 'fail'
  mainVsWorker
  mainVsIframe
  runToRunStability
  profilePersistence
```

Design choices locked here:
- **`sessionIdentity` reuses `ProxySummary`** (already redacted) → the manifest is safe to commit/share;
  no credential path, consistent with how `measurement/` already works.
- **`worker`/`iframe` are `Partial`** → realm-portability is structural, not a runtime guess.
- The inbox flat schema becomes the **per-`Repetition`** shape; `TestRunManifest` is the new parent
  owning the aggregate `consistency` verdict.
- **Zod**, matching the codebase convention (Zod request validation throughout `transport/`).

## 5. First milestone — Tier 0 (local, zero-network)

**Smallest safe slice.** Launch a Feather session against the **local static fixture** on `127.0.0.1`,
capture the JS/WebGL/Canvas/Audio surface in **main vs worker vs iframe**, write it under a `runId`,
run it **3× with the same persistent profile**, and emit the four-part `ConsistencyVerdict`. No
external target, no sandbox page, no proxy, no transport fingerprint. Proves the *measurement object +
schema + comparator* with **zero network risk and zero stealth dependency**.

**Tier-0 success criteria:**
- Feather launches, navigates the fixture, extracts `__fpResult`, screenshots, and closes cleanly.
- Results stored under a `runId`; repeated runs are comparable.
- No uncontrolled retry loops.
- `mainVsWorker` / `mainVsIframe` / `runToRunStability` / `profilePersistence` each produce an
  explainable pass/warn/fail.

## 6. Proposed file/code shape (defaults — vetoable at plan time)

```
scripts/fingerprint/         # Tier 0 drives the EXISTING HTTP API — no new endpoint yet
  local-harness.ts           # runner (modeled on measurement/runner.ts)
  probe.ts                   # realm-agnostic capture function
  fixture/                   # the 127.0.0.1 static page + worker.js + iframe page
  compare-runs.ts            # the three-valued comparator + ConsistencyVerdict
  report.ts                  # reporter (modeled on measurement/reporter.ts)
  schema.ts                  # Zod: TestRunManifest, Repetition, FingerprintSurface, …
.feather/fingerprint-runs/   # artifacts, gitignored (like measurements/)
```

Proposed npm scripts: `test:fingerprint:local`, `…:sandbox` (Tier 1, later), `…:compare`, `…:report`.

**Deferred to later tiers / decisions:** a first-class `/v1/fingerprint` API endpoint (Tier 0 stays
external scripts); transport/JA4 capture (Tier 1); proxy-coherence assertions (needs a proxy axis);
P0/P1 passive WAF tooling (separate, owned/authorized only, per policy).

## 7. Open questions deferred to the implementation plan

- Exact `FingerprintSurface` signal list and how each hash is computed deterministically.
- How persistent-profile identity *changes* are detected and recorded across runs.
- Whether a proxy change forces a new baseline (likely yes — different network identity).
- The minimum-useful human/agent review report format.
- Whether `TestRunManifest` eventually becomes a shared Zod schema imported by a real API route
  (Tier 1+ decision).

## 8. Roadmap placement

- **Now (this spec + the policy):** principles and schema locked — the "testing grounds for v2/v3."
- **Behind the spine:** Tier 0 harness is the first implementable milestone once 5b→5c land.
- **v2.5 / Stealth Stack (5d):** Tiers 1–4, transport fingerprinting, proxy coherence. Spine-done =
  *safe but not stealthy* — do not point Tier 3+ at locked-down third parties at spine completion.
