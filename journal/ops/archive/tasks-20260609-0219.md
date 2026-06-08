# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = Showcase/eval suite + v1 wrap.** Build a multi-task agent demo suite (measure + "show off");
remaining v1 gaps = act-human typing cadence + bot self-check. (4a.8 done this session.)

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **4a.1 — Core-first reorientation + quickstart**
- [x] **4a.2 — Core input commands** (click/type/press/wait)
- [x] **4a.3 — Hero demo workflow** (`npm run demo:hero`, first-try cold run)
- [x] **4a.4 — Agent Browsing Stack specs** (Stealth, MFA, Identity — these are **v2**)
- [x] **4a.5 — Open-source integration research**
- [x] **4a.6 — Roadmap + task reconciliation**
- [x] **4a.6b — Security & capability re-sequencing** (council review; ADR-0010; Phase 5 spine)
- [x] **4a.9 — LinkedIn debut recording** (`52b63fe`, pushed; in README)
- [x] **4a.10 — Social-research triage** (inbox clear)
- [x] **v1→v2→v3 restructure + open-source doctrine** (2026-06-08) — `feather.md`,
      `docs/roadmap/{v1,v2,v3}.md`, `adr-0011`; ROADMAP banner; stale build-order line fixed.

### Open v1 work

- [x] **Pause-for-human primitive** (2026-06-08, `dev` 5d7a9b8) — `await-human` blocks until human
      clicks an on-page Resume banner / optional signal / timeout. Thin precursor to v2 MFA Handler.
      Specs `docs/specs/2026-06-08-pause-for-human-*`. Folded into ROADMAP/tasks at this `/stop`.
      - [x] **Live click test WITH Roi DONE** — headed, resumedBy human, no new tab, banner removed.
            *Finding:* banner dies on page navigation (breaks login/MFA resume → core v2 MFA Handler input).
      - [~] **Deferred fixes:**
            (a) [x] Resume-confirmation linger ~1s — `6329ae9`;
            (b) [x] Disposable headed-CDP `ENOTEMPTY` cleanup race (await child exit before rmdir) — `0e4bd33`;
            (c) [ ] Navigation-survivable resume — re-inject banner on `framenavigated` while pause active (v2 core, OPEN).

- [x] **THE v1 INSTAGRAM TEST — COMPLETE (2026-06-08):**
      Session: `journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md`
      Blog: `blog/0013-the-test-that-passed.md`
      - [x] Account created: `feather_test_roi` on scratch profile, confirmed via Gmail (code was in spam)
      - [x] Agent drove Feather end-to-end: form fill, birthday comboboxes, username, Submit
      - [x] Email verification: opened Gmail tab, found code in spam (814065), entered via Shift+Tab + keypress trick
      - [x] Social errand: navigated to @shaked_golan1, liked latest post, read comments, posted comment
      - **Verdict: PASS** — stealthy enough for signup. Friction = element-discovery + small gaps below.

- [~] **Small gaps found in the IG test:**
      - [x] `select-option` command added (native `<select>`) — `23fabd2`
      - [x] `extract` multi-match — confirmed `.first()` already handles it; behavior test added — `54fcc67`
      - [ ] IG confirmation input ignores `fill`/`type` — Shift+Tab + individual `press` workaround (not fixed)

- [x] **4a.8 — Markdown snapshot extraction** (DONE this session) — self-contained DOM walker in
      `page.evaluate()`, zero deps, 20k cap, img alt + ordered-list numbering. `snapshot` now returns
      `markdown`. Commits `43f46bd`/`817f3cb`. (ROADMAP.md ✅.)

- [x] **Agent can drive Feather end-to-end** smoothly enough to run an errand ← **PROVEN by IG test**
- [ ] **Basic "act human"** (human typing cadence) + **"do I look like a bot?" self-check** — cheap v1 stealth.
      *(Last real v1 feature gaps. Decide next session: ship in v1 or defer to v2 stealth work.)*

- [~] **Showcase / eval suite** — spec DONE (`docs/specs/2026-06-09-showcase-eval-suite-design.md`,
      `f76a59a`). User reviews spec next session → writing-plans → implementation plan → Pass 1 (interactive)
      → `examples/showcase.sh` (filmable). 10 tasks: 3 easy + 3 medium + 4 hard (warmed sessions).
- [x] **Agent operator skills + playbook** (DONE this session) — `docs/agent-playbook.md` +
      `skills/{using-feather-browser,feather-form-filling,feather-human-handoff,feather-data-extraction}`
      + AGENTS.md pointer. Commit `0c0e7ee`, pushed to origin/dev.

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
