# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = the v1 Instagram test (a TEST, not planning).** See `docs/roadmap/v1.md`.

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

- [ ] **THE v1 INSTAGRAM TEST (next):**
  - [ ] Roi hand-starts a throwaway Instagram on the **scratch profile** (warm Google; no phone).
        Collaborative: agent navigates, Roi solves CAPTCHA + Gmail verify, agent resumes.
  - [ ] Agent (Claude first) drives Feather's local API: smoke test ("open IG, scroll, describe 3 posts").
  - [ ] Level up: Social Research errand (public profile → read visible comments → summarize).
  - [ ] Verdict: pass = stealthy enough; flag = v2 stealth hardening is next (fallback: v2 LinkedIn).
- [ ] **4a.8 — Markdown snapshot extraction** — port Crawl4AI to TS (first v1 "Port"). `docs/sessions/4a.8-markdown-snapshot.md`
- [ ] **Agent can drive Feather end-to-end** smoothly enough to run an errand (proven via the IG test).
- [ ] **Basic "act human"** (human typing cadence) + **"do I look like a bot?" self-check** — cheap v1 stealth.

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
