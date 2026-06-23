# Agentic Browser Anti-Bot / WAF Testing Research Intake

Date: 2026-06-23
Status: raw inbox research
Owner: Roi Danino
Project: Feather Browser
Repo: `ROI-DANINO/feather-browser`

## Purpose

This note captures early research for a staged anti-bot / WAF testing architecture for Feather Browser.

The goal is **not** to build an evasion or bypass system. The goal is to design a safe, repeatable testing framework that helps us understand how Feather Browser appears to fingerprinting surfaces before it is used against higher-risk environments.

This belongs in `journal/raw/_inbox/` because it is raw research and brainstorming material, not yet a canonical spec or implementation plan.

## Safety Boundary

Allowed scope:

- Local and sandbox fingerprint verification.
- Passive OSINT and low-touch detection on owned/authorized targets.
- Vendor demo/trial environments.
- Public test pages explicitly designed for fingerprint inspection.
- Bug bounty targets only if browser automation is clearly allowed in scope.

Out of scope:

- Bypassing production anti-bot systems.
- Testing against random live websites without permission.
- IP rotation to avoid enforcement.
- Challenge solving, reverse engineering, or circumvention guidance.
- Aggressive probing, fuzzing, exploit templates, credential attacks, or scraping protected services.

Working rule:

> Treat every non-owned target as off-limits unless explicit permission exists.

## Why This Matters for Feather

Feather is a local Chromium runtime for AI agents. Its current architecture already includes the right primitives for a serious testing harness:

- persistent and disposable profiles;
- browser modes such as `chromium-new-headless`, `chromium-headless-shell`, and `chromium-headed-cdp`;
- per-session proxy configuration;
- structured request IDs;
- debug bundles with commands, network summaries, console logs, errors, screenshots, and optional Playwright traces;
- resource measurement scenarios;
- profile locks to prevent concurrent persistent-profile collisions.

The key architectural risk is not just whether Feather passes one CreepJS page once.

The key risk is whether a Feather session keeps a coherent browser identity across time and layers:

```text
same profile + same browserMode + same viewport + same proxy context
  => stable browser identity
  => stable network identity
  => stable storage/session identity
  => stable worker/iframe identity
```

If those layers drift, Feather can look fine in one sandbox test and still look suspicious in real anti-bot environments.

## Core Design Principle

Do not model fingerprint testing as:

```text
testBrowser(target)
```

Model it as:

```text
testSessionIdentity(profile, browserMode, viewport, proxy, target, repetitions)
```

A session identity should be treated as a measurable object with artifacts, not a one-off page visit.

## Proposed Tier Model

### Tier 0 — Local Deterministic Harness

Purpose:

- No external network risk.
- Validate local artifact schema.
- Capture browser APIs from a controlled local page.
- Compare main window, iframe, worker, and service worker surfaces.

Example targets:

- local static fingerprint page;
- local HTTP echo server;
- local TLS/HTTP header inspection server if needed;
- local mock login/storage app.

Success criteria:

- Feather can launch, navigate, snapshot, extract, screenshot, and close cleanly.
- Results are stored under a run ID.
- Repeated runs are comparable.
- No uncontrolled retry loops.

### Tier 1 — Public Sandbox Fingerprinting

Purpose:

- Understand how Feather appears to public fingerprinting pages.
- Compare headed vs headless modes.
- Compare persistent vs disposable profiles.
- Detect obvious automation leaks before touching anything protected.

Candidate sandbox targets:

- CreepJS official GitHub Pages deployment.
- BrowserLeaks pages.
- tls.peet.ws / TrackMe API.
- JA4DB comparison.
- Browserscan / Iphey if manually reviewed and safe to use.

Success criteria:

- 3-5 repeated runs with the same persistent profile produce stable and explainable results.
- No obvious browser automation leaks.
- WebGL, Canvas, Audio, Fonts, Client Hints, timezone, locale, and screen signals are plausible together.
- Main-window values do not contradict worker/iframe values.

### Tier 2 — Owned Low-Risk Web Flows

Purpose:

- Test Feather against controlled web flows, not third-party protected systems.
- Verify navigation, waiting, extraction, screenshots, storage state, and debug bundles.

Candidate targets:

- own static site;
- local OWASP Juice Shop or WebGoat instance;
- own test page using Cloudflare Turnstile test keys;
- local mock app with login, cookies, IndexedDB, service workers, and route transitions.

Success criteria:

- Feather preserves storage and session continuity.
- Debug bundles are complete enough to diagnose failures.
- No profile reset symptoms.
- No retry behavior that could accidentally create traffic bursts.

### Tier 3 — Authorized CDN/WAF Staging

Purpose:

- Test in environments with real CDN/WAF behavior, but only where we control the property or have explicit permission.

Candidate target types:

- own domain behind Cloudflare logging/analytics first;
- own staging app behind Fastly/Akamai/Imperva/Cloudflare;
- bug bounty scope where browser automation is explicitly allowed;
- vendor-provided sandbox.

Success criteria:

- Every test run is attributable to a run ID.
- Request volume is low and bounded.
- Debug evidence is collected for challenge/block outcomes.
- No IP/profile cycling.
- No bypass goal; only measurement and diagnosis.

### Tier 4 — Advanced Anti-Bot Systems

Purpose:

- Evaluate how Feather behaves around advanced anti-bot products, only in vendor demo/trial, own protected property, or explicit authorized scope.

Systems in this category may include:

- DataDome;
- Kasada;
- HUMAN / PerimeterX;
- Akamai Bot Manager;
- Cloudflare Enterprise Bot Management.

Allowed target types:

- vendor demo/trial environment;
- own app protected by the vendor;
- explicit bug bounty scope that permits the test.

Success criteria:

- Reproducible evidence.
- Clear failure classification.
- No uncontrolled retries.
- No clean IP burn.
- No claim of bypass success.

## Passive WAF Fingerprinting

### P0 — Pure Passive OSINT

This level sends zero requests from Feather to the target.

Useful signals:

- DNS records and CNAMEs;
- nameserver patterns;
- certificate transparency logs;
- public technology datasets;
- public documentation or job posts mentioning edge providers;
- historical DNS if available.

Typical provider hints:

- Cloudflare: `cloudflare.net`, Cloudflare nameservers.
- Akamai: `edgekey`, `edgesuite`, Akamai hostnames.
- Fastly: `fastly.net` patterns.
- Imperva/Incapsula: `incapsula`, Imperva edge hints.
- DataDome/Kasada/HUMAN: harder to confirm passively; treat as low-confidence unless there is explicit evidence.

Output should be confidence-scored:

```json
{
  "level": "P0",
  "target": "example.com",
  "providerHints": [
    {
      "provider": "cloudflare",
      "evidence": "nameserver",
      "confidence": "medium"
    }
  ],
  "notes": []
}
```

### P1 — Low-Touch Passive Probe

This level sends a small number of ordinary requests and is therefore not zero-risk. Use only on owned or authorized targets.

Candidate tools:

- `httpx` by ProjectDiscovery;
- WhatWeb at low aggression;
- `webanalyze`;
- tightly allowlisted Nuclei templates for technology detection only.

Recommended guardrails:

- low request rate;
- no payload/fuzzing/exploit templates;
- no login attempts;
- no challenge interaction;
- store raw output as artifacts;
- run outside warmed human profiles.

Example policy:

```yaml
passive_probe_policy:
  allowed_levels:
    - P0
    - P1_owned_or_authorized_only
  default_rate_limit: "1 rps or lower"
  disallowed:
    - exploit_templates
    - fuzzing
    - brute_force
    - challenge_solving
    - scraping
    - retry_loops
```

## Sandbox Verification Checklist

### Network / Transport

- JA3 / JA4 fingerprint.
- ALPN negotiation.
- HTTP/2 SETTINGS order and values.
- Header order and casing.
- TLS library/class consistency.
- Proxy ASN/geolocation/timezone consistency.
- DNS path consistency.

Minimum requirement:

```text
same browserMode + same profile + same proxy class => stable JA4/HTTP fingerprint class
```

### Browser JS Surface

- `navigator.webdriver`.
- `navigator.userAgent`.
- `navigator.userAgentData` and Client Hints.
- `navigator.platform`.
- `navigator.languages`.
- `hardwareConcurrency`.
- `deviceMemory`.
- `maxTouchPoints`.
- permissions API behavior.
- plugins and MIME types.
- Chrome runtime objects.
- error stack traces.
- function native-code strings.

### Graphics / Rendering

- WebGL vendor and renderer.
- WebGL extensions.
- Canvas hash.
- Audio fingerprint.
- Client Rects / DomRect.
- installed fonts.
- TextMetrics.
- emoji rendering.
- screen size, viewport, DPR.

### Worker / Iframe / Cross-Realm Leaks

- Dedicated Worker values vs main window.
- Shared Worker values vs main window.
- Service Worker behavior.
- Sandboxed iframe values.
- Cross-origin iframe values.
- `contentWindow` behavior.
- OffscreenCanvas.
- WebGL in worker where available.

Minimum requirement:

```text
No main-window-only patching.
Every browser identity claim must survive worker and iframe contexts.
```

### Storage / Session / Profile

- cookie persistence;
- LocalStorage / sessionStorage;
- IndexedDB;
- Cache API;
- Service worker state;
- permission state;
- browser first-run artifacts;
- profile lock behavior;
- login/warmed-session continuity.

## Proposed Result Schema

```json
{
  "runId": "fp_2026_06_23_001",
  "timestamp": "2026-06-23T00:00:00.000Z",
  "tier": "tier-1",
  "target": {
    "name": "CreepJS",
    "category": "sandbox-fingerprinting",
    "authorization": "public-sandbox"
  },
  "feather": {
    "sessionId": "ses_xxx",
    "workspaceId": "fp-baseline-linux-headed",
    "profileKind": "persistent",
    "browserMode": "chromium-headed-cdp",
    "viewport": {
      "width": 1280,
      "height": 800
    },
    "proxy": null
  },
  "network": {
    "ipClass": "residential|datacenter|local|unknown",
    "asn": null,
    "ja3": null,
    "ja4": null,
    "http2Fingerprint": null
  },
  "browser": {
    "userAgent": null,
    "clientHints": null,
    "webglVendor": null,
    "webglRenderer": null,
    "timezone": null,
    "locale": null,
    "fontsHash": null,
    "canvasHash": null,
    "audioHash": null
  },
  "consistency": {
    "mainVsWorker": "pass|warn|fail",
    "mainVsIframe": "pass|warn|fail",
    "runToRunStability": "pass|warn|fail",
    "profilePersistence": "pass|warn|fail"
  },
  "artifacts": {
    "screenshot": "path",
    "trace": "path",
    "networkSummary": "path",
    "console": "path",
    "rawFingerprintJson": "path"
  },
  "verdict": {
    "score": 0,
    "status": "pass|warn|fail",
    "blockers": []
  }
}
```

## Possible File / Code Shape

Potential future structure, not yet decided:

```text
scripts/
  fingerprint/
    local-harness.ts
    sandbox-runner.ts
    compare-runs.ts
    report.ts

docs/
  testing/
    anti-bot-testing-matrix.md
    fingerprint-checklist.md
    target-authorization-policy.md

.fingerprint-runs/
  .gitignore
```

Potential npm scripts:

```json
{
  "scripts": {
    "test:fingerprint:local": "tsx scripts/fingerprint/local-harness.ts",
    "test:fingerprint:sandbox": "tsx scripts/fingerprint/sandbox-runner.ts",
    "test:fingerprint:compare": "tsx scripts/fingerprint/compare-runs.ts",
    "test:fingerprint:report": "tsx scripts/fingerprint/report.ts"
  }
}
```

## Open Brainstorm Questions

1. Should fingerprint testing live under `scripts/fingerprint/`, `tests/fingerprint/`, or a new `tools/fingerprint/` area?
2. Should the first milestone be only Tier 0 local harness, before touching public sandbox pages?
3. Should fingerprint result artifacts live in `.feather/debug/`, `.feather/measurements/`, or a separate `.fingerprint-runs/` directory?
4. Should the result schema become a Zod schema in the codebase?
5. Should Feather expose a first-class API endpoint for fingerprint test runs, or should this stay as external scripts using the existing HTTP API?
6. How should persistent profile identity changes be detected and recorded?
7. Should proxy changes require a new fingerprint baseline?
8. What is the minimum useful report for a human/agent review session?

## Bottom Line

The next step is not implementation yet.

The next step should be a Claude Code brainstorming session that turns this raw research into:

1. a safe testing policy;
2. a minimal Tier 0/Tier 1 implementation plan;
3. a result artifact schema;
4. clear boundaries for what Feather will and will not test.

Working thesis:

> Feather should measure browser identity consistency before it tries to operate around protected web environments.
