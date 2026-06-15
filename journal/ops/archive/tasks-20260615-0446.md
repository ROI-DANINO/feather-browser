# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = Gate A / A1 capability system** (the planning/brainstorm pass is DONE —
ADR-0010 accepted, A0 shipped; A1 slice 1 in flight on `claude/session-branch-work-leu1oj`).
The `/blog` v1 finale is DONE (0019 + 0020, all 4 owed lines cleared) — v1 wrap is fully closed.

Latest (2026-06-11 ~14:30 STOP): **EXPANDED FABLE WORKFLOW SHIPPED** — meta-analysis
(`docs/v1_wrap/META-ANALYSIS.md`) overturned the v1-wrap failure story (H3 socket death =
harness-side; H3 never liked/commented; real blocker = headed-CDP viewport bug; M2 =
env-rerunnable cause-undetermined) and the ★ gap fixes landed, pushed `60ef4fd..235ebbb`
(viewport, GET /tabs, newPageId, extract value/ergonomics, ENOTEMPTY, action-log + GET /health,
docs truth pass; review caught + fixed an unauth-log-write hole). Gates 301u/79i/tsc clean.
Prior history → `journal/ops/archive/tasks-20260611-1430.md`.

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **v1 BUILT AND PROVEN** — 4a.1–4a.10 + perception loop + showcase suites + daily-driver +
      Graphify + command layer. Detail: `journal/ops/archive/tasks-20260610-{1203,1243}.md`.
- [x] **v1-wrap evidence + comparison** — agent-driven run (`docs/v1_wrap/test_1/`) vs
      Claude-for-Chrome; meta-analysis + corrections register (`docs/v1_wrap/META-ANALYSIS.md`).
- [x] **v1-wrap gap fixes SHIPPED (2026-06-11)** — headed-CDP viewport honored; GET /tabs +
      best-effort newPageId; extract flat-shape/type-default/`value`; teardown ENOTEMPTY retry;
      per-action session log + GET /health; docs/skills truth pass (stale browserMode enum fixed).
      Plan: `docs/specs/2026-06-11-v1-wrap-gap-fixes-plan.md`.
- [x] **`/blog` v1 finale (2026-06-11)** — 4 owed lines folded into 2 entries: `0019` the 06-10
      testing-honesty trio + `0020` "Feather on Trial" finale. `_pending.md` Owed cleared.
      (Committed `af83a65` on task branch, reconciled to `dev` 2026-06-11; the branch's temporary
      superpowers-vendor commit was dropped — Roi's call.)

### Open v1 leftovers (small / optional)

- [ ] Prune duplicate "Rosh Hashana" Sep-12 events on scratch Google (Feather H1 + C4C H1).
- [ ] H3 viewport acceptance check — does a 1280×800 headed window render IG-class desktop?
      (The "fix would have saved H3" counterfactual was never tested.) Fold into the next
      warmed-IG errand.
- [ ] Remove the retired scripted `run_h3` from `examples/showcase.sh` next time the suite is touched
      (agent-driven is the H3 benchmark now — Roi's call 2026-06-11).
- [ ] **(kind,name) overlay-identity mutation watch-item** — code change only on real-world failure.
- [ ] **Navigation-survivable resume banner** — re-inject on `framenavigated` (v2 MFA core, OPEN).
      ← **NEXT SESSION (Roi, 2026-06-15):** "agent should *feel* the page switch and reshoot the banner
      so the user can confirm." Motivated by the Hebrew-`resumeOn` miss this session. Plan-first →
      approve → implement. Read `await-human.ts` / `pause-registry.ts` / `browser/pause-banner.ts`.
- [~] **pi_agency ⇄ Feather thin integration — PARKED.** Resume only if Roi pulls it forward.

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A — **IN PROGRESS.**
      Phase boundary done (planning-first). ADR-0010 **ACCEPTED** (#3) + Gate A design
      (`docs/specs/2026-06-11-gate-a-capability-system-design.md`); split into A0 + A1.
      - [x] **A0 — transport hardening** — global `Origin`/`Referer`/`Host` guard SHIPPED
            (plan #4, code #5, CI green, merged to `dev`). `FORBIDDEN_HOST`/`FORBIDDEN_ORIGIN`;
            `/resume` verified same-origin → R1. `src/transport/middleware.ts` `createOriginHostGuard`.
      - [~] **A1 — capability system** ← **IN PROGRESS** (simplified workflow: no PR-per-slice).
            Tiers + session-hold primitive + capability-grant registry + dangerous-mode policy + dual audit.
            - [x] **Slice 1 — session-hold primitive** (`src/capability/holds.ts`): `SessionHoldRegistry`,
                  refcounted holds w/ reason + teardown-on-release (revoke-teeth seam), observe/has/count,
                  `releaseAllForSession` revoke hammer. 11u, tsc clean. PURE INFRA, no live paths wired.
                  Reviewed clean + merged to dev 2026-06-11 (local takeover; remote branch deleted).
            - [x] **Slice 2 — capability-grant registry + state machine** (`src/capability/grants.ts`,
                  2026-06-11 local): opaque single-use nonce minted at approval → record
                  `{sessionId, capability, ttlMs, status}`; lazy TTL expiry (injectable clock);
                  `revokeAllForSession` hammer; redacted `onEvent` seam for the audit surfaces.
                  13u TDD red→green, suite 339/339, tsc clean. PURE INFRA, no live paths wired.
            - [x] **Slice 3 — approval page + policy + dual audit + cookie-export door** (2026-06-11
                  local; plan `docs/specs/2026-06-11-a1-slice3-plan.md`): `DangerousModePolicy`
                  (off-by-default, `FEATHER_DANGEROUS_CAPABILITIES`), append-only audit JSONL +
                  SSE bus, single-use humanToken/CSRF approval page (strict CSP), `consumeGranted`,
                  `CapabilityService` facade. Routes: `POST …/grants` (returns `{grant}` only),
                  `GET/POST /v1/approvals/:humanToken`, `POST …/cookies/export` (the gated demo door),
                  session-close→revoke. TDD +21u + 7i. **Gate A live + proven end-to-end.** Remaining
                  dangerous doors (CDP attach, vault) gated when built in 5c / ADR-0008.
            - [x] **Live-test Gate A — REAL use-case PROVEN (2026-06-15).** Re-warmed `scratch` Gmail via
                  human-in-the-loop login, mined 77 cookies THROUGH the gate (refuse→approve→export→
                  single-use; audit `requested→granted→used`), then a fresh empty browser opened
                  roionly9's inbox using ONLY those cookies = **mined AND used**, on Google (hard target).
                  Honest nuance: Google emailed a security alert but didn't invalidate the session
                  (detection≠blocking → 5d stealth input). Detail: `journal/context/next.md` 2026-06-15
                  03:30 entry. (Earlier disposable-github demo proved only the lock; this fills the box.)
      Body: `docs/sessions/5.0.0-capability-gate.md`. NB: the deferred `/evaluate` endpoint and
      batch endpoint land behind/after this gate (META-ANALYSIS ◇ items).
- [ ] **5.0.1 — MCP & tool-surface reconciliation** — owns the **Connector Registry** decision +
      the batch-endpoint call (input `research/2026-06-10-native-capabilities-router.md`)
- [ ] **5.0.2 — First-agent safety gate** — Gate B (input: C4C's per-origin allowlist + hard
      credential line, recorded in META-ANALYSIS §4.11)
- [ ] **5a — Identity Model** (plan: `docs/specs/2026-06-07-identity-model-plan.md`)
- [ ] **5b — MFA Handler** (plan: `docs/specs/2026-06-07-mfa-handler-plan.md`)
- [ ] **5d — Stealth Stack** (verify-not-spoof; plan: `docs/specs/2026-06-07-stealth-stack-plan.md`)
      NB: M2 is NOT usable as 5d evidence or regression test (cause undetermined — META-ANALYSIS §1);
      M1 cold-profile search walls remain the evidence.
- [ ] **Learn-your-behavior** + **active anti-bot self-detection**
- [ ] **Teach-a-workflow / action cache** (Anchor-inspired determinism layer)
- [ ] **Perception-output efficiency** (idea logged 2026-06-15 — NOT felt yet, do not build) —
      spend agent context efficiently (ADR-0005) by shrinking big perception payloads
      (snapshot / observe / extract). **Native kernel = return-less + expand-on-demand (progressive
      disclosure), NOT an ML compressor** — Feather's loop lets the agent re-query, so beat token
      bloat by *selection*, not squeezing. Trigger: a real errand choking on a giant snapshot.
      Neighbors: action cache / learn-your-behavior. Full intake (source: Headroom):
      `research/2026-06-15-headroom-integration-intake.md`.

## Feather v3 — "The polished product"  (`docs/roadmap/v3.md`)

- [ ] Visual Zen-style browser shell (Phase 4b; adr-0007/0009; gated on Casilda spike)
- [ ] **5e — Agent Runtime / ecosystem interop** — absorbs old **4a.7** (CDP attach), correctly last
- [ ] True perception / generalized workflows (north star)

## Parked / External Blockers

- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
