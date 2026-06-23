# Anti-Bot / Session-Identity Testing Policy

> **Status:** canonical policy (promoted from raw inbox 2026-06-23).
> **Authority:** this file is the source of truth for *what Feather's fingerprint/anti-bot
> testing is allowed to touch*. The design of *how* it measures lives in
> [`docs/specs/2026-06-23-session-identity-testing-design.md`](../specs/2026-06-23-session-identity-testing-design.md).
> Raw research origin: `journal/raw/_inbox/2026-06-23-agentic-browser-antibot-testing-{research,bibliography}.md`.

## Purpose and framing

Feather Browser is building a **defensive, measurement-only** testing capability that answers one
question: *does a Feather session present a coherent browser identity, consistently, across every
layer and over time?*

This is **not** an evasion or bypass project. The goal is to *learn what is true* about how Feather
appears to fingerprinting surfaces — before Feather is pointed at higher-risk environments — and to
do so honestly (per `AGENTS.md` "Testing Honesty"). A clean, recorded failure is a successful test.

> **Working thesis:** Feather should measure browser identity consistency *before* it operates around
> protected web environments.

## The non-negotiable safety boundary

### Allowed scope

- **Local and sandbox fingerprint verification** (zero-network local fixtures; public fingerprint-
  inspection pages designed for that purpose).
- **Passive OSINT** (DNS, certificate-transparency logs, nameserver patterns) that sends *zero*
  requests to the target.
- **Low-touch passive probes** on **owned or explicitly authorized** targets only.
- **Vendor demo / trial environments.**
- **Public test pages explicitly designed for fingerprint inspection.**
- **Bug-bounty targets only where browser automation is clearly in scope.**

### Out of scope — hard prohibitions

- Bypassing or defeating production anti-bot / WAF / CAPTCHA systems.
- Testing against random live websites without permission.
- IP rotation, proxy cycling, or clean-IP burning to avoid enforcement.
- Challenge solving, reverse engineering, or any circumvention guidance.
- Aggressive probing, fuzzing, exploit templates, credential attacks, brute force, or scraping
  protected services.
- Claiming "bypass success." The framework measures and diagnoses; it never asserts evasion.

### The working rule

> **Treat every non-owned target as off-limits unless explicit permission exists.**

Authorization is recorded *per run* in the `TestRunManifest.target.authorization` field
(`local` | `public-sandbox` | `owned` | `authorized` | `vendor-demo` | `bug-bounty-scope`). A run
with no positive authorization value for a non-local target is a policy violation and must not run.

## Tier ladder (risk-ascending)

Each tier inherits all lower-tier constraints. Tiers gate on **authorization**, not on capability.

| Tier | What | Network risk | Authorization required |
|------|------|--------------|------------------------|
| **0** | Local deterministic harness (local `127.0.0.1` fixture) | none | none (local only) |
| **1** | Public fingerprint sandboxes (CreepJS, BrowserLeaks, tls.peet.ws, JA4DB) | low, public | public-sandbox; bounded repetitions |
| **2** | Owned low-risk web flows (own site, local Juice Shop, Turnstile **test keys**) | controlled | owned |
| **3** | Authorized CDN/WAF staging (own property behind Cloudflare/Akamai/etc.) | real edge | owned **or** explicit authorization |
| **4** | Advanced anti-bot (DataDome, Kasada, HUMAN, Akamai Bot Manager) | high | vendor-demo / own-property / explicit scope **only** |

### Passive WAF fingerprinting sub-levels

- **P0 — pure OSINT:** zero requests to the target. DNS/CNAME, nameservers, CT logs, public tech
  datasets. Output is **confidence-scored** (`low`/`medium`/`high`); never asserted as fact.
- **P1 — low-touch probe:** a small number of ordinary requests; **not** zero-risk. Owned/authorized
  only. Tools (`httpx`, WhatWeb aggression 1, `webanalyze`, narrowly-allowlisted Nuclei `tech`/`cdn`/
  `info` templates) run at **≤1 rps**, `retries 0`, no payload/fuzz/exploit/login/challenge
  interaction, **outside warmed human profiles**, with raw output stored as artifacts.

## Operational guardrails (all tiers)

- **Every run is attributable** to a `runId` and carries its session-identity tuple.
- **Bounded repetitions, bounded volume.** No uncontrolled retry loops — they can create traffic
  bursts that look like an attack. Retries are explicit and capped.
- **No clean-IP burn, no IP/profile cycling** to dodge enforcement.
- **Warmed human profiles are off-limits to probing.** Fingerprint/passive runs use disposable or
  dedicated test identities, never `primary`-class warmed profiles.
- **Artifacts are safe to retain.** Proxy data is stored only as the already-redacted `ProxySummary`
  (no credentials), consistent with the existing logging/redaction boundary.

## Relationship to the v2/v3 roadmap

This policy is authored **now** as the standing principle set for v2/v3 agentic behavior. The
*implementation* of the harness is **gated behind the finished v2 security spine** (5b MFA → 5c
attach), per the 2026-06-23 scope decision (`docs/specs/2026-06-23-v2-spine-completion-plan.md`).
Tier 0 (local, zero-network) is the first implementable milestone once that gate opens; Tiers 1–4 are
sequenced into v2.5 / Stealth Stack (5d) and beyond. Spine-done = *safe but not yet stealthy* — do
not run Tier 3+ against locked-down third parties at spine completion.
