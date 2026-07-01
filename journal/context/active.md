# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`** (the loop) and the loop's own output
`tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan). Phase index → `ROADMAP.md`; operational
checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-07-02 — CHUNK 2b DONE+MERGED+PUSHED; CHUNK 3 DESIGNED; NEXT = ULTRACODE CHUNK 3 build).**
  Roi's standing instruction at this `/stop`: **"ultracode Chunk 3"** — build both levels via workflow
  orchestration. Design of record → `docs/specs/2026-07-02-tower-pr1-chunk3-levels-design.md`.
- **Chunk 2b — `adapter.browser-use` — MERGED to `dev`, PUSHED** (`dev`==`origin/dev`==`94a63c3`). The
  polyglot seam: Tower spawns a Python shim, one-line JSON over stdin/stdout, knows nothing of browser-use
  internals. TS `tower/core/adapters/browser-use.ts` (+16 mocked tests, injectable `spawnImpl`, SIGKILL
  wall-clock timeout, last-parseable-line wins) + Python `tower/adapters/browser-use/{shim.py,
  requirements.txt,README.md}` (pinned `browser-use==0.13.1`, `enable_signal_handler=False`, `is_successful()`
  None=error, every failure path stays protocol-clean) + `tower/smoke/browser-use.ts` +
  `npm run tower:smoke:browser-use`. **572 green.** Commits `9b8c8a0..a1a0e5d` + pyc-cleanup `94a63c3`.
- **D10 ANSWERED (2026-07-01):** Tower **stays in feather-browser** (Python isolated under
  `tower/adapters/browser-use/` w/ own `requirements.txt` — dep seam, not a separate build).
- **RESEARCH persisted verbatim** (Roi's ask — "save the data that came out for the tokens"):
  `tower/research/2026-07-01-session-outputs-index.md` indexes all 3 workflows (browser-use API 46-agent
  + chunk-2b build 6-agent + chunk-3 design 29-agent); raw receipts in `tower/research/raw/2026-07-0*.json`.
- **NEXT = Chunk 3a (detectability + sink registry) then 3b (security + trials).** Both levels self-report
  by nonce but from different sides: L2 = in-page probe → same-origin `127.0.0.1` sink (no-attach,
  single-shot); comment_injection = Tower-owned WASP victim app, 3 server hooks, any-of-k=3. New plumbing:
  `sink-registry.ts`, `trials.ts`, `text/plain` beacon parser. **Load-bearing unknown:** V8's 2025
  getter-guard may false-negative the classic `Error.stack` probe → §5.5 calibration gate decides
  empirically; ship `gated` if dead, merge either way.
- **DEFERRED TO ROI (paid live smokes):** `tower:smoke:browser-use` (needs `ANTHROPIC_API_KEY` + one-time
  `uvx playwright install chromium`) + the still-owed `tower:smoke:feather`. Everything up to the paid
  boundary is proven (venv protocol probes launched a real headless browser, stayed protocol-pure).

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
