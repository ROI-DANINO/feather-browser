# Agentic Browser Anti-Bot / WAF Testing Bibliography

Date: 2026-06-23
Status: raw inbox bibliography
Project: Feather Browser
Related note: `journal/raw/_inbox/2026-06-23-agentic-browser-antibot-testing-research.md`

## Purpose

This bibliography collects sources and tools relevant to a defensive, staged anti-bot / WAF testing framework for Feather Browser.

Use this as raw research input only. It is not yet an approved implementation plan.

## Source Categories

1. Browser fingerprint sandboxes.
2. TLS / JA4 / HTTP fingerprinting references.
3. Passive WAF/CDN/technology detection tools.
4. Controlled challenge / bot-management references.
5. Research on fingerprint inconsistency and bot detection.
6. Project-specific Feather context.

---

## 1. Browser Fingerprint Sandboxes

### CreepJS

URL: `https://github.com/abrahamjuliot/creepjs`

What it is:

- Browser fingerprinting and privacy/lie-detection test suite.
- Covers many browser surfaces including JS runtime, DOMRect, SVG, Audio, Canvas, WebGL, fonts, voices, screen, timezone, device, and resistance patterns.

Why it matters for Feather:

- Good Tier 1 sandbox for detecting browser-level inconsistencies.
- Useful for comparing `chromium-headed-cdp` vs `chromium-new-headless` vs `chromium-headless-shell`.
- Useful for checking if persistent profiles remain stable across repeated runs.

Safe use:

- Public sandbox/fingerprint check only.
- Do not treat a good score as proof of safety against production anti-bot systems.
- Store raw output and screenshot artifacts.

### BrowserLeaks

URL: `https://browserleaks.com/`

What it is:

- Collection of browser privacy and fingerprinting tests.
- Includes tests for Client Hints, WebRTC, Canvas, WebGL, fonts, geolocation, JavaScript, and TLS-related surfaces.

Why it matters for Feather:

- Useful for targeted checks of one surface at a time.
- Helps isolate a problem that CreepJS reports as a combined score.

Safe use:

- Use as Tier 1 sandbox verification.
- Run with bounded repetitions and store artifacts.

### Browserscan / Iphey

URLs:

- `https://www.browserscan.net/`
- `https://iphey.com/`

What they are:

- Browser/IP/fingerprint inspection services.

Why they matter for Feather:

- Useful for a quick human-readable check of whether the environment looks coherent.

Safe use:

- Treat as manual/secondary Tier 1 checks.
- Do not build critical automation around them before reviewing terms, stability, and output format.

---

## 2. TLS / JA4 / HTTP Fingerprinting

### tls.peet.ws / TrackMe

URL: `https://tls.peet.ws/`

What it is:

- API/service that reports TLS and HTTP fingerprints.
- Includes JA3, JA4, Akamai HTTP fingerprint, HTTP/2 frame information, TLS extensions, and supported TLS properties.

Why it matters for Feather:

- Feather can look browser-like in JavaScript while still having a suspicious transport fingerprint.
- This is important when using Playwright-managed Chromium, proxies, or different browser modes.

Safe use:

- Tier 1 sandbox.
- Run low-volume and store raw JSON output.

### JA4DB

URL: `https://ja4db.com/`

What it is:

- Community database for JA4+ fingerprints and associated client classifications.

Why it matters for Feather:

- Helps classify whether Feather's TLS fingerprint resembles an expected browser/client class.

Safe use:

- Use for comparison and interpretation, not as a hard pass/fail source.

### JA4+ Reference Context

URL: `https://github.com/FoxIO-LLC/ja4`

What it is:

- Reference repository for JA4+ network fingerprinting methods.

Why it matters for Feather:

- Useful for understanding what network-layer signals can be compared.
- Helps separate browser JS fingerprinting from TLS/HTTP fingerprinting.

---

## 3. Passive WAF / CDN / Technology Detection Tools

### wafw00f

URL: `https://github.com/EnableSecurity/wafw00f`

What it is:

- Common WAF fingerprinting tool.

Why it matters for Feather:

- Baseline reference, but not enough by itself.
- Can involve active-ish probing depending on configuration and should not be the only approach.

Safe use:

- Use only on owned/authorized targets.
- Do not treat it as zero-risk.

### httpx by ProjectDiscovery

URL: `https://docs.projectdiscovery.io/opensource/httpx/usage`

What it is:

- Fast HTTP toolkit for probing web targets.
- Relevant features include status code, content type, title, server, technology detection, CDN/WAF detection, CNAME, ASN, and JARM.

Why it matters for Feather:

- Good P1 low-touch passive-probe candidate for owned/authorized targets.
- Can produce machine-readable JSON for target metadata.

Safe use:

- Use with strict rate limits.
- Use `-retries 0`, low timeout, and low request rate.
- Do not run against random protected sites.

Example safe-ish owned-target command:

```bash
httpx -u https://owned-target.example \
  -sc -ct -title -server -td -cdn -cname -asn -jarm \
  -json -rl 1 -retries 0 -timeout 10
```

### WhatWeb

URL: `https://github.com/urbanadventurer/WhatWeb`

What it is:

- Web technology fingerprinting tool.
- Supports multiple aggression levels.
- Default/low aggression uses minimal requests and follows redirects.

Why it matters for Feather:

- Useful P1 technology-detection companion.

Safe use:

- Use aggression level 1 only unless explicitly in a pentest scope.
- Owned/authorized targets only.

Example:

```bash
whatweb --aggression 1 --log-json=whatweb.json https://owned-target.example
```

### webanalyze

URL: `https://github.com/rverton/webanalyze`

What it is:

- Go port of Wappalyzer-style technology detection.

Why it matters for Feather:

- Useful for lightweight technology classification.

Safe use:

- Owned/authorized targets only.
- Use as a hint, not source of truth.

### Nuclei Templates

URL: `https://github.com/projectdiscovery/nuclei-templates`

What it is:

- Community template library for the Nuclei scanning engine.

Why it matters for Feather:

- Could be useful for explicitly allowlisted discovery/technology templates.
- Also risky if used broadly because many templates are active vulnerability checks.

Safe use:

- Default deny.
- Allow only narrowly reviewed `info`, `tech`, `detect`, `cdn`, or similar non-invasive templates.
- Block exploit/CVE/fuzzing/bruteforce/login templates.

Suggested policy:

```yaml
nuclei_policy:
  default: deny
  allowed_tags:
    - tech
    - detect
    - cdn
    - waf
    - info
  blocked_tags:
    - cve
    - rce
    - sqli
    - xss
    - bruteforce
    - takeover
```

---

## 4. Controlled Challenge / Bot Management References

### Cloudflare Turnstile

URL: `https://developers.cloudflare.com/turnstile/`

What it is:

- Cloudflare's CAPTCHA alternative.
- Can be integrated into a site without the site being behind Cloudflare's CDN.

Why it matters for Feather:

- Good Tier 2 owned challenge page candidate.
- Useful for testing controlled flow handling and debug bundle quality.

Safe use:

- Use on your own test page with test keys.
- Do not optimize for bypass.
- Optimize for artifact quality and failure diagnosis.

### Cloudflare Bots / Bot Management

URL: `https://developers.cloudflare.com/bots/`

What it is:

- Cloudflare bot products, including Bot Fight Mode, Super Bot Fight Mode, and Enterprise Bot Management.

Why it matters for Feather:

- Good Tier 3/Tier 4 reference if using your own protected property.
- Useful for understanding bot score / challenge / logging concepts.

Safe use:

- Own property only.
- Logging/analytics first, challenge/block later.
- No uncontrolled automation.

### DataDome

URL: `https://datadome.co/`

What it is:

- Bot and online fraud protection platform.

Why it matters for Feather:

- Example Tier 4 anti-bot system.

Safe use:

- Vendor demo/trial, own property, or explicit scope only.
- Do not target production websites using DataDome without permission.

### Kasada

URL: `https://www.kasada.io/`

What it is:

- Anti-bot / bot mitigation platform.

Why it matters for Feather:

- Example Tier 4 system.

Safe use:

- Vendor demo/trial, own property, or explicit scope only.

### HUMAN / PerimeterX

URLs:

- `https://www.humansecurity.com/`
- Historical PerimeterX context: HUMAN acquired PerimeterX; many references still use the PerimeterX name.

What it is:

- Bot mitigation / fraud defense platform.

Why it matters for Feather:

- Example Tier 4 system.

Safe use:

- Vendor demo/trial, own property, or explicit scope only.

### Akamai Bot Manager

URL: `https://www.akamai.com/products/bot-manager`

What it is:

- Akamai bot management product.

Why it matters for Feather:

- Example Tier 4 system, especially relevant where Akamai is the edge provider.

Safe use:

- Vendor demo/trial, own property, or explicit scope only.

---

## 5. Research Themes

### Fingerprint Inconsistency as Detection Surface

Representative source:

- `https://arxiv.org/abs/2406.07647`

Why it matters:

- Modern bot detection is not only about one obvious automation flag.
- Inconsistencies across fingerprint attributes and across time can reveal automation.

Feather implication:

- A persistent profile must be tested across repeated runs.
- Main window, worker, iframe, storage, TLS, viewport, and proxy context need consistency checks.

### Network Fingerprints for Bot Detection

Representative source:

- `https://arxiv.org/abs/2602.09606`

Why it matters:

- JA4-derived features and network-level fingerprints can be highly informative for bot classification.

Feather implication:

- Browser-level sandbox scores are not enough.
- Feather needs TLS/HTTP fingerprint capture alongside CreepJS/BrowserLeaks-style JavaScript fingerprint capture.

---

## 6. Feather-Specific Sources

### README

Path: `README.md`

Relevant points:

- Feather is a local Chromium runtime for AI agents.
- It provides controlled real Chromium sessions over local HTTP API.
- It supports persistent/disposable profiles, page snapshots, structured extraction, screenshots, debug bundles, and per-session proxy config.

### Architecture

Path: `docs/architecture.md`

Relevant points:

- Node/TypeScript service.
- Fastify local HTTP API.
- Playwright `launchPersistentContext`.
- SessionManager and FeatherSession abstractions.
- Profile locks.
- DebugCapture / DebugBundle.
- Measurement subsystem.

### API Reference

Path: `docs/api-reference.md`

Relevant points:

- `/v1/sessions` launches browser sessions.
- supports `profile.kind`, `workspaceId`, `browserMode`, `viewport`, `proxy`, and `debug` options.
- returns `sessionId`, `workspaceId`, `profileKind`, `browserMode`, `profilePath`, `debugDir`, proxy summary, and page records.

---

## 7. Suggested Reading Order for Claude Code

1. `README.md`
2. `docs/architecture.md`
3. `docs/api-reference.md`
4. `journal/docs-map.md`
5. `journal/raw/_inbox/2026-06-23-agentic-browser-antibot-testing-research.md`
6. `journal/raw/_inbox/2026-06-23-agentic-browser-antibot-testing-bibliography.md`

---

## 8. Notes for Future Canonicalization

This bibliography should not stay as-is forever.

Possible next destinations:

- `docs/testing/fingerprint-checklist.md`
- `docs/testing/anti-bot-testing-policy.md`
- `docs/plans/fingerprint-harness-plan.md`
- `docs/specs/fingerprint-run-schema.md`
- ADR if the project chooses a formal session-identity model.

Do not promote this material into canonical docs until a brainstorm session defines scope, safety rules, and first implementation milestone.
