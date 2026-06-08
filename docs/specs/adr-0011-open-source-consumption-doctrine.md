# ADR-0011 — Open-Source Consumption Doctrine (Build Native by Default)

- **Date:** 2026-06-08
- **Status:** Accepted
- **Context phase:** Phase 4a — Feather Core; integration-doctrine reconciliation pass
- **Front-door framing:** [`feather.md`](../../feather.md) ("How we build Feather")

## Context

Feather repeatedly evaluates open-source projects (Crawl4AI, Browser Use, OpenHands, Maxun, plus
anti-bot npm packages) for features worth adopting. Without a written rule this was improvised, and
Session 4a.7 drifted toward the wrong default — letting an *outside tool drive Feather as a side
runtime over CDP*, which is the opposite of the owner's native-build philosophy.

The roadmap already seeded the rule in one sentence ("Critical capabilities should be native or
integrated project features, using mature open-source tools only where they reduce risk and cost").
This ADR gives that sentence teeth.

## Decision

**Build native by default.** Features are rebuilt in Feather's own TypeScript. Other projects are
*recipe books* — read the technique, cook our own version — not dependencies. Three tracks:

1. **Build / Port (default).** Self-contained logic, small enough to own, or in the wrong language
   (Python→TS). Read source/API as reference; write clean-room TS. *Example: Crawl4AI markdown (v1).*
2. **Buy a package (rare exception).** Only when something is genuinely **hard / fast-moving /
   security-critical** and a maintained package does it better than we could. *Illustrative example:
   the fingerprint npm packages — though see the footnote; the current Stealth plan chose to verify,
   not spoof, so it may buy nothing.*
3. **Expose Feather to outside tools (deferred to v3 / Phase 5e).** Letting external agents/frameworks
   drive Feather is the opposite of native, so it waits. This track is **already governed by
   [`adr-0006`](adr-0006-agent-interface-neutrality.md)** (standard MCP-compatible seam) — this ADR
   does not re-decide it, only places it last.

**License rule:** never import or copy AGPL or otherwise-incompatible code (Maxun). Port *patterns*
by hand, not source.

## Per-repo disposition

| Project | License | Track | What to take |
|---|---|---|---|
| Crawl4AI | Apache 2.0 | **Port** (v1, Session 4a.8) | clean HTML→markdown logic |
| Browser Use | MIT | **Reference** | DOM-reading ideas; its CDP-attach = v3 interop |
| OpenHands | MIT | **Reference** | architecture; MCP tool shape (v3) |
| Maxun | AGPL-3.0 | **Reference only — never copy** | the `where/what` workflow-DSL *idea*, re-built by hand |
| fingerprint npm | MIT | **Buy *if needed*** (v2 stealth) | `fingerprint-generator` / `-injector` |

> **Footnote (caught in this pass by reading the plans):** the council-audited Stealth plan
> (`docs/specs/2026-06-07-stealth-stack-plan.md`) deliberately **verifies fingerprints rather than
> spoofing them** — a real browser already has a genuine fingerprint, and detectors look for tampering
> first. So the canonical "buy" example may never actually be bought. It still illustrates the *rule*;
> the per-feature buy/build call is made when the feature is built, by reading its plan — not assumed.

## Session re-tags (the reconciliation output)

- **4a.7** (CDP cold-profile attach) → **moved to v3 / Phase 5e** (Track 3, expose-to-external). Not
  deleted; relabelled, because letting outside tools drive Feather is correctly last.
- **4a.8** (markdown) → **Track 1 (Port Crawl4AI)**, stays the next v1 build.
- **5d** (Stealth) → **Build (verify-not-spoof); Track 2 "buy" reserved** for fingerprint deps only if
  hardening ever needs spoofing.
- **5e** (Agent Runtime / interop) → **Track 3**; absorbs old 4a.7.

## Consequences

- The default is unambiguous: read others, build our own. No more accidental "attach as a side
  runtime" drift.
- Per-feature buy/build decisions are deferred to the moment that feature is built (read its plan),
  not pre-committed here.
- Track 3 stays a single source of truth ([`adr-0006`](adr-0006-agent-interface-neutrality.md)); this
  ADR only sequences it last.
