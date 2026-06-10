# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = v2 Gate A planning/reconciliation pass (Session 5.0.0, ADR-0010) in a fresh session.**
Latest (2026-06-10 ~12:43 STOP): **ALL V1 FOLLOW-UPS CLOSED** — operator-skills rewrite to the
observe loop (`91fcd2b`), suite semantic-assertion layer verified live (`553216a`), same-origin
iframe-overlay dismiss gap fixed TDD red→green (`6263bd6`); gates 280u/73i/typecheck clean, pushed.
Same-day history → `journal/ops/archive/tasks-20260610-1243.md` + `tasks-20260610-1203.md`.

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **v1 BUILT AND PROVEN** — 4a.1–4a.10 + restructure + perception loop + observe bug fixes +
      Instagram test + showcase suite (3 tiers) + pass-2 observe measurement + daily-driver +
      `primary` re-warm + Graphify + command layer + NotebookLM v2 + Native-Capabilities placement.
      Detail: `journal/ops/archive/tasks-20260610-{1203,1243}.md`.
- [x] **V1 FOLLOW-UPS CLOSED (2026-06-10 ~12:43):** operator skills teach the observe loop; showcase
      PASS = errand done right (H3 Unlike-state + content-aware comment, M3 target fact, H4 per-fact,
      E1 title+points; live-verified, H3's honest PARTIAL → probe → PASS); dismiss reaches
      same-origin iframe overlays (inherited `overlayIndex`; cross-origin = await-human by design).

### Open v1 leftovers (small / optional)

- [ ] **(kind,name) overlay-identity mutation watch-item** — multi-pane popups may misjudge
      `dismissed`; docs say trust `overlaysRemaining`. Code change only on real-world failure.
- [ ] **Navigation-survivable resume banner** — re-inject on `framenavigated` (v2 MFA core, OPEN).
- [ ] **Analyze Claude-for-Chrome transcripts (optional research).**
      `journal/raw/_inbox/claude_for_chrome_output/` — keep, don't delete.
- [ ] **act-human typing cadence + bot self-check** — deferred to v2 (decided).
- [~] **pi_agency ⇄ Feather thin integration — PARKED.** Resume only if Roi pulls it forward.

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A — **THE NEXT WORK.**
      Phase boundary: planning/reconciliation pass first (fresh session), then build.
      Body: `docs/sessions/5.0.0-capability-gate.md`.
- [ ] **5.0.1 — MCP & tool-surface reconciliation** — owns the **Connector Registry** decision
      (input `research/2026-06-10-native-capabilities-router.md`; say "Connector Registry" not
      "Capability Registry"; docs-import builder = v3/5e)
- [ ] **5.0.2 — First-agent safety gate** — Gate B
- [ ] **5a — Identity Model** (plan: `docs/specs/2026-06-07-identity-model-plan.md`)
- [ ] **5b — MFA Handler** (plan: `docs/specs/2026-06-07-mfa-handler-plan.md`)
- [ ] **5d — Stealth Stack** (verify-not-spoof; plan: `docs/specs/2026-06-07-stealth-stack-plan.md`)
- [ ] **Learn-your-behavior** + **active anti-bot self-detection**
- [ ] **Teach-a-workflow / action cache** (Anchor-inspired determinism layer)

## Feather v3 — "The polished product"  (`docs/roadmap/v3.md`)

- [ ] Visual Zen-style browser shell (Phase 4b; adr-0007/0009; gated on Casilda spike)
- [ ] **5e — Agent Runtime / ecosystem interop** — absorbs old **4a.7** (CDP attach), correctly last
- [ ] True perception / generalized workflows (north star)

## Parked / External Blockers

- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
