# Current Tasks — The Tower (research loop COMPLETE 2026-06-28; ready to build)

Checklist only. **Plan of record → the loop's synthesis `tower/research/2026-06-27-00-SYNTHESIS.md`**
(buildable plan) + the loop spec `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`.
Decisions D1–D6 + verbatim receipts → `tower/research/raw/README.md`. Front door → `feather.md`;
live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-loop task history archived → `journal/ops/archive/tasks-20260628-0027.md`.

**Scope (D2, locked):** an open, self-hostable, **tool-agnostic** TS/Node bench scoring ANY agentic web
tool on ALL angles (capability=gate / detectability-signature=warmed-vs-cold / security) → cap/det/sec
profile → boss tower. Broad framework, NOT a niche. Build = Design B (thin TS/Node core extending `tower/`).

## DONE — the research-and-design loop (2026-06-28, committed `9ff93de`+`4e69b2e`, NOT pushed)
- [x] **Stage-1 monorepo orientation** — `gym/`→`tower/`, seams, hygiene (`9ff93de`).
- [x] **5 research strands + final synthesis** — each an adversarially-verified Workflow; digests
      `tower/research/2026-06-27-0{0..5}-*.md` + verbatim receipts `tower/research/raw/*.json`.
- [x] **Decisions D1–D6** logged; scope corrected to D2 broad framework; radar conflict resolved.
- [x] **Documentation pattern** (digest + verbatim receipts) + memory `research-documentation-preference`.

## NEXT — doc-hygiene batch (recommend FIRST; <1hr; Strand-4 flagged)
- [ ] **Promote the decisions log → standalone `tower/decisions.md`** (D1…Dn index, grep-able by ID).
      Apply the **D6 wording fix** the synthesis noted: WASP-intermediate → RedTeamCUA execution-marker probe.
- [ ] **Add `docs/GLOSSARY.md`** mapping synonym clusters to canonical terms (gym/gymnasium/bench → tower;
      stealth/evasion/fingerprint → detectability; warmed/cookie-mine/logged-in → authenticated).
- [ ] **Finish the `gym→tower` rename** across `docs/specs`/`docs/plans`/`blog`/`AGENTS.md` (functional +
      prose; leave true historical refs).
- [ ] **Index `tower/` in `journal/docs-map.md`** (the research digests + decisions log as authoritative surfaces).

## THEN — the BUILD PHASE (PR-1 MVP, per the synthesis; ~1 week solo)
- [ ] **`tower-core` skeleton** extending `tower/`: Fastify control plane, Zod `TowerTask`/`TowerResult`/
      `DetectorReport`, 4 manifest registries, sequential runner, **JSONL-in-git result log + SQLite read-index**.
- [ ] **2 adapters:** `adapter.feather` (HTTP-driven, never imports `src/`) + `adapter.browser-use`
      (subprocess-CLI, ~60-line Python stdin/stdout shim — proves the no-import polyglot seam).
- [ ] **1 detectability level — L2 `runtime_enable`:** vendor + pin rebrowser-bot-detector; both tools load
      it under task pretext; page **self-posts its `{ok|gated|blocked}` ordinal by `nonce`** to an out-of-band
      sink; **NO Playwright/CDP attach to the measured browser** (the correctness property to demonstrate).
- [ ] **1 security level — `comment_injection`:** WASP-style GitLab-comment IPI in a purpose-owned victim
      app implementing `SecurityHooks` (canary exfil + state diff + injection marker); grade ASR **any-of-3 (k=3)**.
- [ ] **Aggregator v0:** LPR → ASS (cap-gate stubbed) → BTS (versioned weights) → `RunRecord` with
      Clopper-Pearson CI; **overlapping-CI → `tie`**. Render the **cap/det/sec profile as small-multiples /
      parallel-coords with CI bands (NOT a radar polygon)** + a flat HTML.
- [ ] **Build sequence after PR-1** (see synthesis §"Build this first"): PR-2 honest wire (passive JA3 tap) +
      real capability gate + nodriver differential guard; PR-3 the warmed-vs-cold signature harness; PR-4+ breadth.

## Housekeeping
- [ ] **Push** `9ff93de..4e69b2e` to `origin/dev` when Roi wants it public.

## Parked (not deleted)
- [ ] **Prior gym thread:** retry a real motion score when `abs.incolumitas` recovers; fable-evals scoreboard wire.
- [ ] **Real-account 2FA take** — prove the Resume banner survives a real 2FA challenge page (needs Roi driving).
- [ ] **(Roi, outside repo)** rotate/abandon the leaked `roionly9` throwaway account.
