# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = operator-skills rewrite to the observe loop, then suite semantic assertions, then v2 Gate A.**
Latest (2026-06-10 ~12:03 STOP): **OBSERVE BUG FIXES SHIPPED** — all 3 pass-2 bugs fixed end-to-end
(brainstorm→spec→plan→subagent build, 12 commits `09a6b6c..579b445` pushed; gates 280u/72i/typecheck
clean; final review = ready to merge). Earlier same day: Native Capabilities Router placed at 5.0.1;
command layer (`/blog`+`/notebook`+blog gate); Graphify graduated; NotebookLM pack v2; daily-driver +
`primary` re-warm. Prior-day history → `journal/ops/archive/tasks-20260610-1203.md`.

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **4a.1–4a.10, restructure, NotebookLM v2, Graphify graduation, Native-Capabilities placement,
      command layer** — all done; detail in `journal/ops/archive/tasks-20260610-1203.md`.
- [x] **v1 Instagram test (2026-06-08)** + **Showcase eval suite all 3 tiers (2026-06-09)** +
      **pass-2 observe measurement (2026-06-10)** — cookie mine + observe loop proven.
- [x] **Perception/observation loop SHIPPED (2026-06-09)** — `POST /observe`, act-by-ref, `/dismiss`.
- [x] **Close-tab primitive (2026-06-09)**; **daily-driver background launch + `primary` re-warm (2026-06-10)**.
- [x] **OBSERVE BUG FIXES — SHIPPED (2026-06-10, `09a6b6c..579b445`, pushed).**
      (1) `/dismiss` verify-by-re-observe — `{dismissed (verified), overlaysRemaining, observation}`,
      containment-gated picking (`overlayIndex`, composed-tree shadow-piercing), z-index/dialog overlay
      refinement (calendar false positive dead), `Overlay.ref` dropped; (2) accname descendant
      aria-label peek (IG Like named); (3) `navigated: true` on click/press/select-option nav-teardown
      (pattern list test-pinned) instead of 500. Docs updated + code-verified. Spec/plan
      `docs/{specs,plans}/2026-06-10-observe-bug-fixes*`; session
      `journal/ops/sessions/observe-bug-fixes-shipped-20260610-1203.md`.

### Open v1 work

- [ ] **Operator-skills rewrite to the observe loop** ← NEXT. The 4 `skills/` files still teach
      snapshot-first; rewrite to `observe → act by ref → re-observe`, fold in the new dismiss shape
      (`overlaysRemaining` ground truth, act from `observation` refs) + `navigated: true` recovery.
      Evidence: `examples/showcase-output/pass2-observe/results.md`.
- [ ] **Suite semantic-assertion layer** — PASS must mean the errand was done right (date asserts;
      content-aware H3 comment).
- [ ] **Dismiss follow-up (from review): same-origin-iframe overlay gap.** `/dismiss` can't reach
      buttons inside iframe overlays; fix idea = implicit `overlayIndex` for actions whose frame is a
      detected overlay iframe. Workaround documented (direct click / await-human). Not urgent.
- [ ] **(kind,name) overlay-identity mutation watch-item** — multi-pane popups may misjudge
      `dismissed`; docs already say trust `overlaysRemaining`. Code change only on real-world failure.
- [ ] **Navigation-survivable resume banner** — re-inject on `framenavigated` (v2 MFA core, OPEN).
- [ ] **Analyze Claude-for-Chrome transcripts (optional research).**
      `journal/raw/_inbox/claude_for_chrome_output/` — keep, don't delete.
- [ ] **act-human typing cadence + bot self-check** — deferred to v2 (decided).
- [~] **pi_agency ⇄ Feather thin integration — PARKED.** Resume only if Roi pulls it forward.

~~`continuity.test.ts` own ticket~~ — **CLOSED 2026-06-10: it passes (3/3).** The "fails
consistently, pre-existing" note was stale; verified twice (Task 9 + final review).

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A — **the big next after the
      two v1 follow-ups above**
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
