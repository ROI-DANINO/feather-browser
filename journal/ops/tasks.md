# Current Tasks — The Tower (PR-1 MVP build, ~halfway; next = ORIENTATION INTERVIEW)

Checklist only. **Plan of record → `tower/research/2026-06-27-00-SYNTHESIS.md`** (buildable plan) + PR-1
design `docs/specs/2026-06-28-tower-pr1-mvp-design.md`. Chunk-2 design
`docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md`. Decisions D1–D6 → `tower/decisions.md`.
Front door → `feather.md`; live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-2a task history archived → `journal/ops/archive/tasks-20260629-0154.md`.

**Scope (D2, locked):** an open, self-hostable, **tool-agnostic** TS/Node bench scoring ANY agentic web
tool on ALL angles (capability=gate / detectability=warmed-vs-cold signature / security) → cap/det/sec
profile → boss tower. Broad framework, NOT a niche. Build = Design B (thin TS/Node core extending `tower/`).

## NEXT SESSION (do this first)
- [ ] **ORIENTATION INTERVIEW** — interview Roi to build his mental model BEFORE more building (he asked to
      get oriented; learns by seeing/using). Memories auto-load it: `tower-next-orientation-interview` +
      `tower-two-web-interfaces-idea`. Cover: how a detectability level works, how browser-use gets tested,
      the two-interfaces idea. Get him in front of something runnable (`npm run tower:serve`, or the smoke).
- [ ] **REPO-SPLIT DECISION** (output of the interview): Tower out of feather-browser — decide deliberately
      ("is the Tower its own product?"). If yes, **execute at the Chunk-2b boundary** (documented
      `AGENTS.md` split-trigger = first non-Feather tool). Code coupling already zero (HTTP-only, no `src/`).

## DONE — Tower PR-1 build so far
- [x] **Chunk 1 — engine + website skeleton** (merged): `tower/core/` types/verdict(PARTIAL invariant)/
      timing/store(tolerant JSONL)/stubs/runner(stop-on-first-non-WIN, Grade-validated)/server(health/sink/
      placeholder) + `tower/serve.ts` + `npm run tower:serve`.
- [x] **UI slice — render-the-run** (merged): `tower/core/render.ts` (`renderRun`, 4 outcome chips,
      AI-placeholder slot every card, escaping, empty state) + `GET /` + `resultsFile` dep.
- [x] **Chunk 2a — `adapter.feather`** (merged 2026-06-29, commits `fccde32..94ce173`, LOCAL, 555 green):
      Feather + Tower-owned minimal Claude brain. `agent/action.ts` (4-verb vocab) + `agent/brain.ts`
      (`driveToGoal`, step + wall-clock budget) + `agent/decide-claude.ts` (Claude forced tool-use;
      `@anthropic-ai/sdk@^0.106.0` root; default `claude-opus-4-8`) + `adapters/feather-client.ts` (HTTP-only)
      + `adapters/feather.ts` (drive-never-grade, `finally`-close) + `smoke/feather.ts` +
      `npm run tower:smoke:feather` (opt-in live, not CI). Honesty props intact (no `src/`, no-attach,
      `Adapter` unchanged, brain Tower-owned). Final review WITH-FIXES → all 3 fixed (createSession profile
      body + its test + the wall-clock timeout). Live smoke run deferred to Roi (needs Feather up + API key).

## THEN — remaining PR-1 chunks (each its own plan when reached)
- [ ] **Chunk 2b — `adapter.browser-use`:** real browser-use framework as a Python subprocess
      (`tower/adapters/browser-use/shim.py` + `requirements.txt` + `tower/core/adapters/browser-use.ts`,
      stdin/stdout JSON protocol, mocked unit tests + `tower:smoke:browser-use`). Spec §6/§9. Own plan TBD.
      **Tie to the repo-split decision** (this is the split-trigger boundary).
- [ ] **Chunk 3 — real levels:** 1 detectability (**L2 `runtime_enable`**, rebrowser-bot-detector, page
      self-posts ordinal by nonce to the out-of-band sink, NO Playwright/CDP attach) + 1 security
      (**`comment_injection`**, WASP-style IPI in a purpose-owned victim app, ASR any-of-3 k=3).
- [ ] **Chunk 4 — scoring + AI report + real site:** LPR→ASS(cap stubbed)→BTS → `RunRecord` with
      Clopper-Pearson CI (overlapping → `tie`); cap/det/sec profile as **small-multiples/parallel-coords
      with CI bands (NOT a radar polygon)** + the polished website; AI paragraph per level (explains, never scores).
- [ ] **Build sequence after PR-1:** PR-2 (passive JA3 tap + real capability gate + nodriver differential
      guard) → PR-3 (warmed-vs-cold signature harness) → PR-4+ breadth.

## Housekeeping
- [x] **Push-state: RESOLVED** (verified via `git fetch` 2026-06-29). `origin/dev`=`7ce69b2`; Chunk 1 + UI
      slice + Chunk-2 design **already public** on origin. The "~19 unpushed" breadcrumb was wrong.
- [ ] **Push Chunk 2a** (`fccde32..170bb00`, 8 commits) **— DEFERRED, keep local per Roi 2026-06-29.** Push
      when he wants today's adapter work public.

## Parked (not deleted)
- [ ] **GPU/WebGL static-fingerprint detectability angle (owed follow-up)** — belongs in the breadth phase
      (PR-4+) as an absolute static level that varies per tool. Source: `journal/raw/archive/2026-06-27-bot-detection-signals-research.md` (Q3).
- [ ] **Prior gym thread:** retry a real motion score when `abs.incolumitas` recovers; fable-evals scoreboard wire.
- [ ] **Real-account 2FA take** — prove the Resume banner survives a real 2FA challenge page (needs Roi driving).
- [ ] **(Roi, outside repo)** rotate/abandon the leaked `roionly9` throwaway account.
- [ ] **`decide-claude` cheap-mode follow-up** — add `output_config: { effort: "low" }` if live-smoke cost/latency is high.
