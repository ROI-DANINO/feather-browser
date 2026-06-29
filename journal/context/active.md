# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`** (the loop) and the loop's own output
`tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan). Phase index → `ROADMAP.md`; operational
checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-30 — ORIENTATION INTERVIEW DONE; VISION RECONCILED; NEXT = CHUNK 2b).**
  Ran the orientation interview (Roi declared himself oriented). He re-derived the three angles
  (capability/detectability/security) + boss tower unprompted, and **sharpened the design with four
  decisions logged D7–D10 in `tower/decisions.md`**: (D7) one **shared task pool, three lenses** — the
  capability tower authors errands once, the other towers reuse them per-angle; (D8) **difficulty = page
  structural messiness** (DOM depth/popups/layered markup; mine past Feather sessions); (D9) **real
  commercial guards (Cloudflare/DataDome) hosted over the Tower's OWN arena** — own-arena ethics extended
  to detectability, levels IMITATE hard sites and never drive them; (D10) **repo split → KEEP IN
  feather-browser for now, re-ask at the Chunk-2b boundary**. New memory `tower-arena-imitates-sites-real-guards`.
  No product code this session — planning/reconciliation pass only.
- **RECOMMEND NEXT: Chunk 2b — `adapter.browser-use`** (real browser-use as a Python subprocess; spec §6/§9;
  own plan TBD). It is also the **documented repo-split re-ask point** (D10) — surface the split question to
  Roi when reaching it. Roi's vision (D7–D8) feeds the **level-design session** the synthesis deferred; it
  does NOT resequence PR-1 (capability stays gate-stubbed there).
- **Chunk 2a build facts (still current):** `adapter.feather` built, reviewed (final WITH-FIXES, all 3
  fixed), merged to `dev` (FF, branch deleted; **555 green**), and **pushed/public**. Tower-owned Claude
  brain (observe→decide→act over HTTP, never imports `src/`). Commits `fccde32..94ce173`.
- **Chunk 2a build facts:** `tower/core/agent/{action,brain,decide-claude}.ts` + `tower/core/adapters/
  {feather-client,feather}.ts` + `tower/smoke/feather.ts` + `npm run tower:smoke:feather`. New dep
  `@anthropic-ai/sdk@^0.106.0` (root `package.json`), default model `claude-opus-4-8`. Brain loop bounded by
  **step budget + wall-clock timeout**. `featherAdapter` drives-never-grades (`finally`-close; throws only on
  drive error). Honesty props intact: no `src/`, no-attach, `Adapter` unchanged, brain Tower-owned (not fable/iroh).
  Final-review fix `94ce173`: createSession profile body (verified vs `docs/api-reference.md`) + its test + the timeout.
- **TO RUN THE LIVE SMOKE (Roi, manual — the one deferred step):** terminal 1 `npm run dev` (writes
  endpoint.json); terminal 2 `export ANTHROPIC_API_KEY=…` then `npm run tower:smoke:feather`. Costs ~cents;
  a small model may wander/give_up on the trivial page — that's a first-class honest outcome, not a failure.
  Free zero-key alternative to *see the website*: `npm run tower:serve` → open the URL (result cards).

## Key facts for next session
- **The locked identity (D2):** an open, self-hostable, **tool-agnostic** TS/Node bench driving ANY agentic
  web tool, scoring **all angles** — capability (gate) / detectability (warmed-vs-cold signature) / security
  — into a per-tool cap/det/sec **profile** → "boss tower." Broad framework, NOT a niche. Decisions `tower/decisions.md`.
- **The build arc (PR-1):** Chunk 1 ✓ (engine + website skeleton) · UI slice ✓ (render-the-run) · **2a ✓**
  (Feather+brain adapter) · 2b (browser-use subprocess — next) · 3 (real levels: L2 `runtime_enable`
  detectability + `comment_injection` security) · 4 (scoring CIs + AI report + real site). Roi's named gaps
  ("how detection tech is mixed", "how to test browser-use") = Chunks 3 + 2b — genuinely not built yet.
- **Documentation pattern (standing rule):** sources+findings+decisions **copied verbatim**, never rewritten
  (memory `research-documentation-preference`). Tower research home = `tower/research/` (+ `raw/` receipts).
- **Profiles / server / operating Feather:** unchanged — `docs/agent-playbook.md` + agent skills; `scratch`
  is the only profile on disk.

## Push-state — IN SYNC (pushed 2026-06-30)
- **`dev` == `origin/dev`** after this `/stop` push (tracking/docs only, no product code: `tower/decisions.md`
  D7–D10 + blog 0029 + journal pointers). Roi's standing call: **"make Tower public until we split it"** →
  push-as-you-go, repo public, Tower lives here until the split (D10: re-ask at the Chunk-2b boundary).
  Never push `master`.

## Workspace lanes (git worktrees) — added 2026-06-30
- **Two intermergeable lanes share one git repo.** `~/Desktop/Projects/feather-browser` (this folder,
  branch `dev`) = **Roi's own work**. `~/Desktop/Projects/feather-browser-lead` (branch `lead-tasks`,
  off `dev` @ `2b461e9`) = **lead-assigned tasks** for the new project that leans on Feather+Tower.
  Drive the lead lane from a *separate* Claude session in that folder.
- **Intermerge either direction:** `git merge lead-tasks` (whole branch) or `git cherry-pick <commit>`
  (one change). Setup-only, no product code. Lead's final destination (own remote vs Roi's) deferred —
  "not sure yet". TODO offered/not-done: add `feather-browser-lead/` to the spine ignore list.
  Handoff `journal/ops/sessions/the-second-self-20260630-0227.md`.

## Recent completed context
- **2026-06-30 Orientation interview + planning pass (this session):** Roi re-derived the locked design,
  sharpened it → D7–D10 + memory `tower-arena-imitates-sites-real-guards` + blog 0029. No product code.
  Handoff `journal/ops/sessions/the-plan-i-already-had-20260630-0153.md`.
- **2026-06-29 Chunk 2a:** the Feather minimal-brain adapter, merged. See handoff
  `journal/ops/sessions/the-brain-i-gave-the-body-20260629-0154.md`.
- **2026-06-28 UI slice + Chunk-1 build + Chunk-2 design:** render-the-run page merged; engine skeleton;
  the two-adapter spec + 2a plan. (Folded from the consumed `next.md` bridge.)
- **2026-06-28 Tower research loop:** 5 strands + synthesis, adversarial-verified (~140 agents). Locked the
  broad framework (D2), scoring (D3), Design B (D4), store (D5), security axis (D6). Blog 0027.
- **2026-06-26/27 Gym Step 1 + mouse-motion:** `tower/behavioral.ts`+`classify.ts` HTTP-drive of
  bot.incolumitas; mouse-motion built, premise debunked (detector backend down), gym BLOCKED state. Blogs 0026.
