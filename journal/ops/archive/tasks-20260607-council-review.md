# Current Tasks - Phase 4a

Checklist only. Full session details -> `ROADMAP.md`. Current live pointer ->
`journal/context/active.md`.

Active session: **Session 4a.6b - Security & Capability Re-Sequencing (from council review)**.
(Supersedes 4a.7-as-is; see `research/2026-06-07-council-design-review.md`.)

---

## Phase 4a - Core Open-Source Readiness And Public Proof

- [x] **Session 4a.1 - Core-first reorientation and quickstart demo**
  Output: README Core positioning + `examples/quickstart.sh`.

- [x] **Session 4a.2 - Core input commands for hero demo**
  Output: click/type/press/wait API surface.

- [x] **Session 4a.3 - Hero demo workflow and recording prep**
  Output: `npm run demo:hero` works live; recording blocked on screen recorder install.

- [x] **Session 4a.4 - Agent Browsing Stack specs**
  Output: Stealth, MFA, and Identity specs/plans complete.

- [x] **Session 4a.5 - Open-source integration research**
  Output: Browser Use, Crawl4AI, OpenHands, Maxun recommendations recorded.

- [x] **Session 4a.6 - Roadmap and task reconciliation**
  Output: `ROADMAP.md` rebased as session execution map; `active.md`, `tasks.md`, and `phase.md`
  aligned.

- [ ] **Session 4a.6b - Security & Capability Re-Sequencing (from council review)** <- NEXT
  - [ ] Read `research/2026-06-07-council-design-review.md` and the spec security addenda.
  - [ ] Decide the 4a.7 split: cold/throwaway-profile demo now vs. defer warmed attach behind gate.
  - [ ] Write the local control-plane / capability-model ADR.
  - [ ] Re-order the Phase 5 spine: safety gate -> Identity -> MFA -> warmed CDP -> Stealth.
  - [ ] Fold MFA + Identity security addenda into their plan task lists.
  - [ ] Reconcile `active.md`, `tasks.md`, `phase.md` to the new sequence (planning only, no code).

- [ ] **Session 4a.7 - CDP/WS Endpoint Exposure** (ON HOLD - re-scope in 4a.6b first)
  - [ ] Apply the 4a.6b scope decision (cold-profile demo, or deferred behind safety gate).
  - [ ] Verify current Playwright/Fastify docs before code changes.
  - [ ] Add CDP/WS endpoint exposure per the agreed scope, token-gated + loopback-bound.
  - [ ] Add tests and update `docs/api-reference.md`.
  - [ ] Document attach without importing Browser Use.

- [ ] **Session 4a.8 - Markdown Snapshot Extraction**
  - [ ] Design native TypeScript markdown output for snapshot.
  - [ ] Preserve existing snapshot fields.
  - [ ] Add focused unit/integration tests.
  - [ ] Update API docs.

- [ ] **Session 4a.9 - LinkedIn Debut Recording And Post**
  - [ ] Install a Niri/Wayland recorder: Kooha or `wf-recorder`.
  - [ ] Record `npm run demo:hero`.
  - [ ] Draft/post LinkedIn debut from `blog/0010-the-three-locks.md` or a debut-specific cut.

- [ ] **Session 4a.10 - Social Research Use-Case Triage**
  - [ ] Route `journal/raw/_inbox/2026-06-07-social-research-{agent,mode}-usecase.md`.
  - [ ] Preserve "personal research assistant, not bot/scraping farm" framing.
  - [ ] Archive only after promotion or supersession.

## Phase 4b - Visual Desktop Shell (deferred)

- [ ] **Session 4b.0 - Phase 4b planning reconciliation**
- [ ] **Session 4b.1 - Shell stack joint call and Casilda spike plan**
- [ ] **Session 4b.2 - Thin shell event projection prototype**
- [ ] **Session 4b.3 - Browser surface spike**
- [ ] **Session 4b.4 - Visual shell prototype**

## Phase 5+ - Future Agent Layer (do not start before gates)

- [ ] **Phase 5.0 - Agent Interface And Safety Gate**
  - [ ] MCP/tool surface reconciliation after the spec gate.
  - [ ] First-agent safety gate: DBSC read-only measurement, password-manager policy, leakage checks.

- [ ] **Phase 5a - Stealth Stack**
  Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`.
  Constraint: evaluate `fingerprint-generator`, `fingerprint-injector`, and `idcac-playwright`
  before custom fingerprint injection; never import AGPL Maxun code.

- [ ] **Phase 5b - MFA Handler**
  Plan: `docs/specs/2026-06-07-mfa-handler-plan.md`.
  Dependency: Stealth mutable-mode seam.

- [ ] **Phase 5c - Identity Model**
  Plan: `docs/specs/2026-06-07-identity-model-plan.md`.
  Guardrails: no cloud sync, strict 1:1:1 identity/profile/session mapping, no RBAC, dormant
  `vaultRef`.

- [ ] **Phase 5d - Agent Runtime Surface And Ecosystem Interop**
  Constraint: standard MCP-compatible seam, token/context efficiency, Claude Code/Codex drivability.

## Parked / External Blockers

- [ ] Screen recorder install for hero demo recording.
- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
