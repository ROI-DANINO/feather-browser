# Current Tasks - Phase 4a

Checklist only. Full session bodies -> `docs/sessions/<id>.md`; thin map -> `ROADMAP.md`; live
pointer -> `journal/context/active.md`.

Active session: **Session 4a.7 - CDP cold-profile interop proof**
(`docs/sessions/4a.7-cdp-cold-profile-interop.md`). 4a.6b (security re-sequencing) is done.

---

## Phase 4a - Core Open-Source Readiness And Public Proof

- [x] **4a.1 - Core-first reorientation + quickstart** — README Core positioning + `examples/quickstart.sh`.
- [x] **4a.2 - Core input commands** — click/type/press/wait API.
- [x] **4a.3 - Hero demo workflow** — `npm run demo:hero` works live; recording blocked on recorder.
- [x] **4a.4 - Agent Browsing Stack specs** — Stealth, MFA, Identity specs/plans complete.
- [x] **4a.5 - Open-source integration research** — Browser Use / Crawl4AI / OpenHands / Maxun.
- [x] **4a.6 - Roadmap + task reconciliation** — session-map rebase.
- [x] **4a.6b - Security & capability re-sequencing (council review)**
  - [x] Read the council review + spec security addenda.
  - [x] Decide the 4a.7 split: **cold/throwaway-profile proof now; warmed attach deferred to 5c.**
  - [x] Write the control-plane/capability ADR: `docs/specs/adr-0010-...`.
  - [x] Re-order the Phase 5 spine: gate -> Identity -> MFA -> warmed CDP -> Stealth last.
  - [x] Fold MFA + Identity security addenda into their plan task lists.
  - [x] Split `ROADMAP.md` into thin index + `docs/sessions/` (council Q1).
  - [x] Reconcile `active.md`, `tasks.md`, `phase.md`.

- [ ] **4a.7 - CDP cold-profile interop proof** <- NEXT (`docs/sessions/4a.7-cdp-cold-profile-interop.md`)
  - [ ] Verify Playwright 1.60 CDP/WS endpoint shape from docs.
  - [ ] Expose a sanitized endpoint field on `SessionRecord`/launch output **for cold/disposable
        profiles only**; absent for persistent/warmed.
  - [ ] Keep token-gated + loopback-bound; no widened remote exposure.
  - [ ] Tests incl. "no endpoint on warmed profile"; update `docs/api-reference.md`.
  - [ ] Document attach (Browser Use / Crawl4AI) without importing them.

- [ ] **4a.8 - Markdown snapshot extraction** (`docs/sessions/4a.8-markdown-snapshot.md`)
- [ ] **4a.9 - LinkedIn debut recording** (`docs/sessions/4a.9-linkedin-debut.md`) — blocked on recorder.
- [x] **4a.10 - Social-research triage** — consolidated 2 inbox stubs into a `Proposed` use-case
      seed in product desk context; both archived to `journal/raw/archive/`. Inbox clear.

## Phase 4b - Visual Desktop Shell (deferred)

Bodies live in `adr-0007`, `adr-0009`, `research/2026-06-05-phase4-gui-architecture-sketch.md`.
- [ ] 4b.0 planning reconciliation -> 4b.1 shell-stack joint call / Casilda spike plan ->
      4b.2 thin shell event projection -> 4b.3 browser-surface spike -> 4b.4 visual shell prototype.

## Phase 5+ - Security-first spine (do not start before gates)

Build order: `capability gate -> Identity -> MFA -> warmed CDP -> Stealth last`. Renumbering map +
dependency graph in `ROADMAP.md`.

- [ ] **5.0.0 - Local control-plane & capability gate** (`docs/sessions/5.0.0-capability-gate.md`)
      — implements ADR-0010; **first Phase 5 work**; gates 5a `vaultRef`, 5b routes, 5c warmed CDP.
- [ ] **5.0.1 - MCP & tool-surface reconciliation** (`docs/sessions/5.0.1-mcp-tool-surface.md`).
- [ ] **5.0.2 - First-agent safety gate** (`docs/sessions/5.0.2-first-agent-safety-gate.md`).
- [ ] **5a - Identity Model** (was 5c; first feature). Plan: `docs/specs/2026-06-07-identity-model-plan.md`
      (+ folded Security Tasks). Self-contained; opaque policy refs; explicit `markWarm()`; separable ids.
- [ ] **5b - MFA Handler.** Plan: `docs/specs/2026-06-07-mfa-handler-plan.md` (+ folded Security Tasks).
      Depends on Gate A's session-hold primitive (not Stealth).
- [ ] **5c - Warmed-profile CDP attach** (new; the deferred half of old 4a.7). Behind Gate A:
      `cdp-attach` capability grant, one-time token, TTL, audit, revoke-on-MFA/close.
- [ ] **5d - Stealth Stack** (was 5a; now last). Plan: `docs/specs/2026-06-07-stealth-stack-plan.md`.
      Constraint: evaluate fingerprint npm deps before custom injection; never import AGPL Maxun.
- [ ] **5e - Agent Runtime Surface & Ecosystem Interop** (was 5d). MCP-compatible seam; token/context
      efficiency; Claude Code / Codex drivability.

## Parked / External Blockers

- [ ] Screen recorder install for hero demo recording (Kooha / `wf-recorder`).
- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
