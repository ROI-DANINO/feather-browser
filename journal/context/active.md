# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`** (the loop) and the loop's own output
`tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan). Phase index → `ROADMAP.md`; operational
checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-28 20:01 — UI SLICE SHIPPED+MERGED; CHUNK 2 DESIGNED; 2a PLAN READY TO EXECUTE).**
  The "render the run" UI slice is built, reviewed (READY-TO-MERGE), and **merged to `dev` with Chunk 1**
  (fast-forward, branch `tower-core-skeleton` deleted; 531 green; **LOCAL/UNPUSHED**, `dev` ~19 ahead of origin).
  Chunk 2 (the two adapters) is designed; the **Chunk-2a plan is written**.
  **RECOMMEND NEXT (Roi's call):** fresh chat → branch off `dev` → execute
  `docs/plans/2026-06-28-tower-chunk2a-feather-adapter.md` via **subagent-driven-development** (6 TDD tasks).
- **Chunk 2 decisions (2026-06-28):** Feather gets a **minimal Tower-owned Claude brain** (observe→act loop over
  its HTTP API, never imports `src/`) so "Feather+brain" can attempt both detectability AND security levels;
  **browser-use runs for real** as a Python subprocess (2b); **stay in the monorepo** (Anthropic SDK→root
  `package.json`, Python isolated under `tower/adapters/browser-use/`; split deferred past PR-1). Spec:
  `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md`. Split: 2a (Feather adapter) → 2b (browser-use).
- **The locked identity (D2):** an open, self-hostable, **tool-agnostic** TS/Node bench that drives ANY
  agentic web tool and scores it on **ALL angles** — capability (gate) / detectability (signature =
  warmed-vs-cold session delta) / security — into a per-tool cap/det/sec **profile**, toward a "boss tower."
  Broad framework, NOT a niche (Roi: "too niche"). Multi-tower = design intention, not built now.
- **The chosen build (Design B):** a thin TS/Node core that **extends `tower/`** (not a re-platform);
  capability measured *through* a normalizing adapter, detectability measured *around* it (tool drives its
  own browser, Tower observes off the data path, no-attach rule, passive JA3 tap). Full plan:
  `tower/research/2026-06-27-00-SYNTHESIS.md`; decisions D1–D6: `tower/research/raw/README.md`.
- **Doc-hygiene batch — DONE 2026-06-28 (`93e6686`):** `tower/decisions.md` (D1–D6, grep-able; D6
  WASP→RedTeamCUA wording fix applied), `docs/GLOSSARY.md`, `tower/` indexed in `journal/docs-map.md`;
  `gym→tower` rename confirmed done for live front-doors. Corpus is now searchable.
- **CHUNK-1 BUILT (2026-06-28 — engine + website skeleton).** Executed the 8-task plan
  `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md` via **subagent-driven-development** (sonnet
  implementers, opus reviewers; fresh impl + opus task-review per task, one fix loop, final whole-branch
  review). **10 commits `bde78e2..24798a3` on branch `tower-core-skeleton`** (off `dev`, **NOT merged, NOT
  pushed**). Full suite **521 passing, typecheck clean, final review READY TO MERGE.** Shipped `tower/core/`:
  types (Zod records + `Adapter`/`Level`/`Tower`) · verdict (PARTIAL invariant) · timing · store (tolerant
  JSONL reads) · stubs · runner (stop-on-first-non-WIN, Grade-validated seam) · server (`/health`, out-of-band
  `POST /sink/:nonce`, `GET /levels/placeholder`) · `tower/serve.ts` + **`npm run tower:serve`** + e2e smoke.
  `behavioral.ts`/`classify.ts` untouched. Build ledger: `.superpowers/sdd/progress.md`.
- **TRY-IT-OUT done (2026-06-28):** ran `npm run tower:serve` live — health/placeholder/sink all worked;
  persisted RunRecord showed WIN→FAIL stop-at-security with cause+fix + per-part timing. Roi saw the bare
  placeholder page (screenshot sent) and wants the *real* website.
- **UI SLICE — DONE+MERGED (2026-06-28).** `tower/core/render.ts` (pure `renderRun`: result cards, all 4 outcome
  chips styled, escaping, AI-placeholder slot every card, empty state) + `GET /` route + `resultsFile` dep on
  `buildServer` + `serve.ts` wiring. Commits `a00d84f`,`8e49f30`,`8049004`,`275c0f6` (test hardening). Built via
  subagent-driven-development; final opus review READY-TO-MERGE; live-verified (screenshot of WIN/FAIL cards sent).
  Spec `docs/specs/2026-06-28-tower-render-run-ui-slice-design.md`, plan `docs/plans/2026-06-28-tower-render-run-ui-slice.md`.
- **EVERYTHING SINCE THE LOOP IS LOCAL/UNPUSHED on `dev`** (~19 commits ahead of origin: Chunk 1 + UI slice +
  the design/plan commits). Roi: "keep it local for now." Push when he wants it public.

## Key facts for next session
- **Documentation pattern (Roi's standing rule):** keep sources + findings + decisions, **copied verbatim**
  into a docs dir, never rewritten — each strand = readable digest + verbatim JSON receipts. Memory
  `research-documentation-preference`. The Tower's research home is `tower/research/` (+ `raw/` receipts).
- **Scope is locked broad (D2):** don't re-narrow the Tower to a single niche. Memory
  `feather-gymnasium-direction` (broadened). Warmed-session detectability is the *signature level*, not the
  whole identity.
- **Profiles / server / operating Feather:** unchanged — see `docs/agent-playbook.md` + the agent skills;
  `scratch` is the only profile on disk.

## Recent completed context
- **2026-06-28 Tower research loop (this session):** 5 strands + synthesis, adversarial-verified, ~140
  agents. Locked the broad all-angles framework (D2), the scoring (capability=gate, driver-transparent
  detectability, warmed-vs-cold signature, D3), Design B (thin TS/Node core, D4), JSONL-truth store + stay-
  on-grep + radar-conflict-resolved (D5), the security axis (D6). Output `tower/research/2026-06-27-0{0..5}`.
  Commits `9ff93de`+`4e69b2e` on dev, NOT pushed. Handoff `journal/ops/sessions/the-loop-that-killed-its-darlings-20260628-0027.md`.
- **2026-06-27 Stage-1 monorepo orientation:** `gym/`→`tower/` git-rename + seams (AGENTS.md) + hygiene;
  typecheck + 491/491 green. (Now committed `9ff93de`.)
- **2026-06-27 Mouse-motion + gym BLOCKED state:** mouse-path.ts + MoveHandler + `/move`; premise debunked
  (bot.incolumitas backend was down 502, not "no cursor path"); gym BLOCKED state. Commits `fbea1d7..0d19cbd` (pushed).
- **2026-06-26 Gym Step 1:** the bot gymnasium's first station (`tower/behavioral.ts` + `classify.ts`,
  HTTP-only drive of bot.incolumitas). Blog 0026.
- **2026-06-24 "My Own Gym" pivot** (Blog 0025) + **Phase 3 SHOW IT OFF** (Blog 0024) — Phases 0–3 complete.
