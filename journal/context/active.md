# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`** (the loop) and the loop's own output
`tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan). Phase index → `ROADMAP.md`; operational
checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-28 — THE TOWER RESEARCH-AND-DESIGN LOOP IS COMPLETE; READY TO BUILD).** Session 2 ran a
  self-paced `/loop` firing one adversarially-verified Workflow per strand (sweep → 3-vote refutation →
  synthesis), + a final synthesis (draft → critic → reconciled). **~140 agents, ~5M subagent tokens. No
  product code.** The whole **Tower** bench is now designed on paper, each claim adversarially stress-tested
  (the honesty pass killed ~half the scoring decisions — that's the point). Committed `9ff93de` (Stage-1
  reorg) + `4e69b2e` (loop output). **Both UNPUSHED on `dev`.**
- **The locked identity (D2):** an open, self-hostable, **tool-agnostic** TS/Node bench that drives ANY
  agentic web tool and scores it on **ALL angles** — capability (gate) / detectability (signature =
  warmed-vs-cold session delta) / security — into a per-tool cap/det/sec **profile**, toward a "boss tower."
  Broad framework, NOT a niche (Roi: "too niche"). Multi-tower = design intention, not built now.
- **The chosen build (Design B):** a thin TS/Node core that **extends `tower/`** (not a re-platform);
  capability measured *through* a normalizing adapter, detectability measured *around* it (tool drives its
  own browser, Tower observes off the data path, no-attach rule, passive JA3 tap). Full plan:
  `tower/research/2026-06-27-00-SYNTHESIS.md`; decisions D1–D6: `tower/research/raw/README.md`.
- **RECOMMEND NEXT (Roi's call):**
  1. **Doc-hygiene batch first** (<1hr, makes the corpus searchable for the build): promote the decisions
     log → standalone `tower/decisions.md` (apply the D6 WASP→RedTeamCUA wording fix the synthesis flagged);
     add `docs/GLOSSARY.md`; finish the `gym→tower` rename across `docs/specs`/`docs/plans`/`blog`/`AGENTS.md`;
     index `tower/` in `journal/docs-map.md`. THEN
  2. **The BUILD PHASE — PR-1 MVP:** extend `tower/`; 2 adapters (Feather HTTP + browser-use subprocess);
     1 detectability level (rebrowser `runtime_enable`, self-post by nonce, no-attach); 1 security level
     (WASP-style comment injection, ASR k=3); aggregator v0 with Clopper-Pearson CIs + the **small-multiples**
     profile render (NOT a radar). Honest failure = success.
  - **Push** `9ff93de..4e69b2e` whenever Roi wants it public.

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
