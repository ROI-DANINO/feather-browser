# Roadmap (Index)

> **📍 Start at [`feather.md`](feather.md).** The product is now framed as **v1 → v2 → v3**, with one
> roadmap per version in [`docs/roadmap/`](docs/roadmap/). Those version files own the *product
> narrative* ("what you'll have"). **This file is the execution engine room** behind them: phase
> status, the security-first dependency spine, security gates, and pointers to session bodies/ADRs.
> Version → phase map: **v1 = Phase 4a**, **v2 = Phase 5.0 + 5a/5b/5d**, **v3 = Phase 4b + 5e**.

This file is the **thin index**: phase status, dependency graph, and security gates. The executable
body of each active/near-term session lives in `docs/sessions/<id>.md`; phases with a detailed
implementation plan point to that plan; lasting decisions live in ADRs (`docs/specs/adr-*`).

> **Restructured 2026-06-07 (Session 4a.6b).** Was a single ~1400-line monolith; split into this
> index + `docs/sessions/` per the council review's Q1 finding (the monolith was accreting dead
> completed-session bodies and stale "read before starting" lists). Completed-session history lives
> in `journal/ops/sessions/`, `journal/log.md`, and git history — not here.

## Destination

Build a Hybrid Browser: a hyper-lightweight Chromium-compatible daily driver with a Zen-inspired
visual shell, and a "Cookie Mine" where human browsing builds a shared persistent trust context
(cookies, session state) that local AI agents can piggyback on through a local Fastify
MCP-compatible hub. Agents operate only inside explicit user-authorized session state with human
approval checkpoints.

The human browser and the agent runtime are architecturally coupled: the human session is the trust
foundation agents depend on. Phase 4 is therefore the prerequisite foundation for Phase 5+.

Feather should not depend on Chrome extensions as its product strategy. Critical capabilities should
be native or integrated project features, using mature open-source tools only where they reduce risk
and cost.

## Public surface: Feather Core vs. Feather Shell

- **Feather Core** — the near-term open-source surface: the local browser runtime, sessions/profiles,
  snapshots, extraction, screenshots, debug bundles, and the local API (future MCP tool interface).
  What another developer can pick up and use today. **Lead with Core.**
- **Feather Shell** — the larger, platform-specific vision: the Zen-inspired visual browser shell,
  the long-running human browsing context, later agent-facing workflows. Comes after Core is adoptable.

## Roadmap model

- Phases are destination points; sessions are the executable work units (`docs/sessions/<id>.md`).
- Each active/near-term session is self-contained: a future agent starts by reading only the files it
  lists, then following its tasks.
- Only the current phase gets operational checkboxes in `journal/ops/tasks.md`.
- Every phase starts with a planning/reconciliation pass and ends by reconciling this index,
  `journal/context/active.md`, `journal/ops/tasks.md`, `journal/ops/phase.md`, and `journal/log.md`.

## Standard session closing rule

Unless a session says otherwise:

- `/next` when moving to another work session/chat before a real stopping point; `/stop` when closing
  a workday, major block, or phase.
- Update `journal/context/active.md` to point to the next recommended session.
- Update `journal/ops/tasks.md` if task state changed; `PROGRESS.md` only for milestone-level progress.
- Update `journal/log.md` per the short-line convention.
- Do not archive/delete planning history except through the documented `/stop` lifecycle.

---

## The security-first spine (2026-06-07 council reversal)

A 5-model council review (`research/2026-06-07-council-design-review.md`) found Feather was sequencing
its **highest-privilege surfaces** (CDP attach, unauthenticated MFA routes, warmed credentials on
disk) **before the safety machinery meant to govern them.** Decision: **capability/security model
first, interop *through* that model.** This re-ordered Phase 5 and re-scoped Session 4a.7.

**Build order:** `capability gate → Identity → MFA → warmed CDP attach → Stealth (last)`.

Two dependency-breaking decisions make that order possible (both from ADR-0010 / the council):

1. **The session-hold primitive (built in 5.0.0) replaces MFA's direct `setStealthMode` toggle.** MFA
   creates an `mfa` *hold*; a policy layer observes holds. This removes MFA's dependency on Stealth —
   which is what lets **Stealth move to last**.
2. **Identity stores stealth/MFA policy as opaque/versioned references, not concrete imports** from
   unbuilt modules (council: "don't pre-commit cross-module type contracts"). This makes **Identity
   self-contained and able to go first**.

### Phase-letter renumbering map (old → new)

| Feature | Old | New |
|---|---|---|
| Capability / control-plane gate | *(did not exist)* | **5.0.0** (new) |
| Identity Model | 5c | **5a** |
| MFA Handler | 5b | **5b** (unchanged) |
| Warmed-profile CDP attach | *(half of 4a.7)* | **5c** (new) |
| Stealth Stack | 5a | **5d** (now last) |
| Agent Runtime Surface & Interop | 5d | **5e** |

### Security gates

- **Gate A — ADR-0010 capability gate (Session 5.0.0):** must exist before warmed-profile CDP attach
  (5c), MFA local routes (5b), or `vaultRef` activation (5a). Includes the global `Origin`/`Host`
  hook, the capability-grant primitive, and the session-hold primitive.
- **Gate B — first-agent safety gate (Session 5.0.2):** credential-at-rest posture + leakage harness
  before any agent acts in a warmed profile.

---

## Phase index

### ✅ Phases 0–3 — Complete
Workspace setup; headless-first decision (ADR-0002 superseded ADR-0001); headless core prototype;
Browser Core stabilization + UI readiness (merged to `master` 2026-06-03). Detail archived at
`journal/ops/archive/roadmap-phases-0-3.md`. Do not reopen unless there's a critical correctness issue.

### 🔵 Phase 4a — Feather Core Open-Source Readiness And Public Proof  *(in progress, late stage)*
Make Core understandable, runnable, and useful before over-investing in the shell.

| Session | Status | Body |
|---|---|---|
| 4a.1 — Core-first reorientation + quickstart | ✅ done | README Core positioning + `examples/quickstart.sh` |
| 4a.2 — Core input commands | ✅ done | click/type/press/wait API |
| 4a.3 — Hero demo workflow | ✅ done (recording blocked) | `npm run demo:hero` works live |
| 4a.4 — Agent Browsing Stack specs | ✅ done | Stealth, MFA, Identity specs/plans |
| 4a.5 — Open-source integration research | ✅ done | Browser Use / Crawl4AI / OpenHands / Maxun |
| 4a.6 — Roadmap + task reconciliation | ✅ done | session-map rebase |
| 4a.6b — Security & capability re-sequencing | ✅ done | this reversal + ADR-0010 + roadmap split |
| 4a.7 — CDP cold-profile interop proof | ↩ deferred → 5c | [`docs/sessions/4a.7-cdp-cold-profile-interop.md`](docs/sessions/4a.7-cdp-cold-profile-interop.md) |
| 4a.8 — Markdown snapshot extraction | ✅ done | [`docs/sessions/4a.8-markdown-snapshot.md`](docs/sessions/4a.8-markdown-snapshot.md) |
| 4a.9 — LinkedIn debut recording | blocked (recorder) | [`docs/sessions/4a.9-linkedin-debut.md`](docs/sessions/4a.9-linkedin-debut.md) |
| 4a.10 — Social-research triage | optional | [`docs/sessions/4a.10-social-research-triage.md`](docs/sessions/4a.10-social-research-triage.md) |

**Phase DoD:** Core quickstart runnable + documented; hero demo recorded/published or parked with
blocker; **cold-profile** CDP attach + docs complete (warmed attach deferred to 5c); markdown
snapshot done or deferred; inbox triaged or left open; pointers agree on the next session.

### 🟣 Phase 4b — Visual Desktop Shell And Human Primary Context  *(deferred)*
Wrap the stable Core in a minimalist Zen-inspired shell that owns the long-running primary context.
Bodies live in the ADRs — there is no separate session file set yet.

- **Read:** [[adr-0007-phase-4-shell-sequencing]] (sequencing + display model),
  [[adr-0009-shell-stack]] (Tauri vs GTK4 — CANDIDATE, joint call),
  `research/2026-06-05-phase4-gui-architecture-sketch.md`.
- **Sessions (planned):** 4b.0 planning reconciliation → 4b.1 shell-stack joint call / Casilda spike
  plan → 4b.2 thin shell event projection → 4b.3 browser-surface spike (gated by 4b.1) →
  4b.4 visual shell prototype.
- **Gate:** ADR-0009 stays CANDIDATE until the Casilda + headed-Chromium latency/input spike runs on
  the Fedora/Wayland box.

### 🔴 Phase 5.0 — Agent Interface And Safety Gate  *(deferred; security foundation)*

| Session | Status | Body |
|---|---|---|
| 5.0.0 — Local control-plane & capability gate | first Phase 5 work | [`docs/sessions/5.0.0-capability-gate.md`](docs/sessions/5.0.0-capability-gate.md) — implements [[adr-0010-local-control-plane-capability-model]] |
| 5.0.1 — MCP & tool-surface reconciliation | future | [`docs/sessions/5.0.1-mcp-tool-surface.md`](docs/sessions/5.0.1-mcp-tool-surface.md) — now also owns the **Native Capabilities Router / Connector Registry** placement (2026-06-10; input: `research/2026-06-10-native-capabilities-router.md`) |
| 5.0.2 — First-agent safety gate | future | [`docs/sessions/5.0.2-first-agent-safety-gate.md`](docs/sessions/5.0.2-first-agent-safety-gate.md) |

### 🔴 Phase 5a — Identity Model  *(was 5c; now first feature, self-contained)*
Named, agent-attachable handle for a warmed profile + default stealth/MFA policy + dormant `vaultRef`.
- **Plan:** `docs/specs/2026-06-07-identity-model-plan.md` (the executable body).
- **Spec + security addendum:** `docs/specs/2026-06-07-identity-model-design.md`.
- **Depends on:** Gate A for `vaultRef` activation. Stores stealth/MFA policy as opaque/versioned
  refs (no concrete imports yet). Guardrails: no cloud sync; separable
  `defaultWorkspaceId`/`defaultProfileId` (not strict 1:1:1); enforce 1-session-per-profile in code;
  explicit `markWarm()` (no inferred-from-close); JSON store with per-identity write mutex + version
  field (SQLite deferred).

### 🔴 Phase 5b — MFA Handler  *(unchanged letter; depends on Gate A)*
Pause agent workflows at TOTP/SMS/push challenges; human resolves locally; resume without exposing
raw codes.
- **Plan:** `docs/specs/2026-06-07-mfa-handler-plan.md` (the executable body).
- **Spec + security addendum:** `docs/specs/2026-06-07-mfa-handler-design.md`.
- **Depends on:** Gate A — local routes get `Origin`/`Host` + single-use `humanToken` + CSRF nonce +
  strict CSP; origin-verify-before-typing; uses the **session-hold primitive** (not `setStealthMode`);
  consumes the existing SSE bus (polling is fallback only).

### 🔴 Phase 5c — Warmed-Profile CDP Attach  *(new; the deferred half of old 4a.7)*
Expose CDP/WS attach for **warmed/persistent** profiles, behind Gate A.
- **Read:** [[adr-0010-local-control-plane-capability-model]],
  `research/2026-06-07-open-source-integration-research.md`,
  `docs/specs/2026-06-04-attach-dont-launch-design.md`.
- **Gate:** requires a `cdp-attach` capability grant — one-time/short-TTL token, human approval,
  audit, auto-revoke on MFA/close. Optionally a filtering proxy that strips `Network`/`Storage`
  domains. Never default-on.

### 🔴 Phase 5d — Stealth Stack  *(was 5a; now LAST — most complex/breakable)*
Secure-by-default stealth hygiene + verification for agent-driven sessions.
- **Plan:** `docs/specs/2026-06-07-stealth-stack-plan.md` (the executable body).
- **Spec:** `docs/specs/2026-06-07-stealth-stack-design.md`;
  research `research/2026-06-07-council-audit-stealth-stack.md`,
  `research/2026-06-05-anti-detection-self-test.md`.
- **Constraint:** evaluate `fingerprint-generator` / `fingerprint-injector` / `idcac-playwright`
  before custom injection; never import AGPL Maxun code; kinematic input is spike-first.

### 🔴 Phase 5e — Agent Runtime Surface And Ecosystem Interop  *(was 5d; cold storage)*
Expose Feather as a standard local browser tool for external agents/frameworks.
- **Read:** [[adr-0005-agentic-north-star]], [[adr-0006-agent-interface-neutrality]],
  `research/2026-06-07-open-source-integration-research.md`.
- **Session 5e.0** reconciles the surface (MCP impl vs. `FeatherBrowserTool` vs. interop docs) after
  Phase 5.0; keep Maxun as schema-pattern reference only.

---

## Parked / external blockers

- Screen-recorder install for hero-demo recording (Kooha / `wf-recorder`).
- Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- Vault Spikes A/B frozen until explicitly pulled forward (ADR-0008 candidate).
