# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = NEW SESSION: brainstorm the PERCEPTION / OBSERVATION LOOP.** The real answer to "the agent
works but it's slow and blind to banners" (Roi's flagged friction). Shape (not committed — that's the
brainstorm): a cheap structured `observe` returning actionable elements + detected overlays/banners as text
(no image); an auto-dismiss-known-interstitials helper; screenshot disk cleanup. Use the brainstorming skill.
Grounds: this session's H1 screenshot 30s font-timeout + banners silently blocking clicks; `dismiss_got_it`
in `examples/showcase.sh` is the crude precursor. Session record:
`journal/ops/sessions/hard-tier-pass-close-tab-shipped-20260609-0849.md`. Blog `0016-ten-errands.md`.

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **4a.1 — Core-first reorientation + quickstart**
- [x] **4a.2 — Core input commands** (click/type/press/wait)
- [x] **4a.3 — Hero demo workflow** (`npm run demo:hero`)
- [x] **4a.4 — Agent Browsing Stack specs** (Stealth, MFA, Identity — these are **v2**)
- [x] **4a.5 — Open-source integration research**
- [x] **4a.6 — Roadmap + task reconciliation**
- [x] **4a.6b — Security & capability re-sequencing** (council review; ADR-0010; Phase 5 spine)
- [x] **4a.8 — Markdown snapshot extraction**
- [x] **4a.9 — LinkedIn debut recording** (`52b63fe`, pushed; in README)
- [x] **4a.10 — Social-research triage** (inbox clear)
- [x] **v1→v2→v3 restructure + open-source doctrine** (2026-06-08)

### Open v1 work

- [x] **THE v1 INSTAGRAM TEST — COMPLETE (2026-06-08):** signup + email verify + social errand. PASS.
      Session `journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md`; blog `0013`.
- [x] **Pause-for-human primitive** (2026-06-08, `dev` 5d7a9b8) — `await-human` + on-page Resume banner.
      - [ ] (c) **Navigation-survivable resume** — re-inject banner on `framenavigated` (v2 MFA core, OPEN).

- [x] **Showcase / eval suite — COMPLETE end-to-end (2026-06-09).** Stress-and-learn instrument; spec
      `docs/specs/2026-06-09-showcase-eval-suite-{design,plan}.md`; recipe log
      `docs/specs/2026-06-09-showcase-pass1-recipes.md`. `examples/showcase.sh` drives all 10 tasks.
      - [x] **Easy tier (E1–E3)** — built by the pi team via the fork-free chain (`f05453d`); all PASS.
      - [x] **Medium tier (M1–M3)** — M1 PARTIAL (DDG CAPTCHA, expected) / M2 PASS / M3 PASS.
      - [x] **Hard tier (H1–H4) — RUN 4/4 PASS (2026-06-09):** H1 Google Calendar write, H2 warmed-Google→
            Wikipedia 20k chars, H3 IG like+comment as `feather_test_roi`, H4 multi-tab 3/3. **Cookie mine
            proven beyond the IG test.** Committed `bfb4dbb`. Blemish: H1 screenshot 30s font-timeout (task
            passed on snapshot check) — folds into the perception/screenshot rework.

- [x] **Close-tab primitive — SHIPPED (2026-06-09, `4920759`..`bb3494e`).** `DELETE /tabs/:pageId`; refuses
      last tab (409 `CANNOT_CLOSE_LAST_TAB`); removePage-before-close; **fixed latent initial-tab-listener
      bug**; lenient empty-body JSON parser. Subagent-driven TDD, 6 tasks, two-stage review + final review =
      READY TO MERGE. 61u + 2i green. Specs `docs/specs/2026-06-09-close-tab-primitive-{design,plan}.md`.
      Pushed to `origin/dev`.

- [ ] **PERCEPTION / OBSERVATION LOOP — NEXT (brainstorm first).** Cheap structured `observe`
      (actionable elements + overlays as text, no image) + auto-dismiss-known-interstitials + screenshot
      disk cleanup. Roi-confirmed next focus. The agent-ergonomics answer to "too slow / blind to banners."

- [ ] **`continuity.test.ts` — own ticket.** Fails consistently; proven PRE-EXISTING (fails at base `09bb3e5`;
      tests `scripts/demo/continuity.ts` poll-login logic; untouched by any current feature). Not a blocker.

- [ ] **act-human typing cadence + bot self-check** — last v1 stealth gaps. **Decided: defer to v2**
      (M1 PARTIAL is the lesson, not a blocker).

- [~] **pi_agency ⇄ Feather thin integration — PARKED.** `.pi/` config + chain proven (Stage 1/2 PASS,
      chain dry-run PASS). Stage 3 = PARTIAL (operator beat the birthday dropdown honestly, hit Google's
      phone wall; Testing Honesty held). Suite is now Claude-driven; resume pi only if Roi pulls it forward.

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A
- [ ] **5.0.1 — MCP & tool-surface reconciliation**
- [ ] **5.0.2 — First-agent safety gate** — Gate B
- [ ] **5a — Identity Model** (plan: `docs/specs/2026-06-07-identity-model-plan.md`)
- [ ] **5b — MFA Handler** (plan: `docs/specs/2026-06-07-mfa-handler-plan.md`)
- [ ] **5d — Stealth Stack** (verify-not-spoof; plan: `docs/specs/2026-06-07-stealth-stack-plan.md`)
- [ ] **Learn-your-behavior** (kinematic mouse/typing; spike-first) + **active anti-bot self-detection**
- [ ] **Teach-a-workflow / action cache** (Anchor-inspired determinism layer)

## Feather v3 — "The polished product"  (`docs/roadmap/v3.md`)

- [ ] Visual Zen-style browser shell (Phase 4b; adr-0007/0009; gated on Casilda spike)
- [ ] **5e — Agent Runtime / ecosystem interop** — absorbs old **4a.7** (CDP attach), correctly last
- [ ] True perception / generalized workflows (north star)

## Parked / External Blockers

- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
