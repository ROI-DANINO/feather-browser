# Active - startup pointer

This file is the short live pointer for `/start`. **Plan of record →
`docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`** (the loop) and the loop's own output
`tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan). Phase index → `ROADMAP.md`; operational
checklist → `journal/ops/tasks.md`; machine pointer → `journal/ops/phase.md`.

## Current pointer

- **NOW (2026-06-29 01:54 — CHUNK 2a SHIPPED+MERGED; NEXT SESSION = ORIENTATION INTERVIEW).**
  Tower **Chunk 2a (`adapter.feather`)** is built, reviewed (final = WITH-FIXES, all 3 fixed), and **merged
  to `dev`** (fast-forward, branch `tower-feather-adapter` deleted; **555 green**; **LOCAL/UNPUSHED**).
  Gave Feather a small **Tower-owned Claude brain** (observe→decide→act over HTTP, never imports `src/`).
  7 commits `fccde32..94ce173`.
- **RECOMMEND NEXT (Roi's call): the next session STARTS as an interview** — build Roi's mental model of
  what the Tower is *before* more building (he asked: "I just want to get oriented"; he learns by seeing/
  using). Two memories auto-load it: **`tower-next-orientation-interview`** + **`tower-two-web-interfaces-idea`**.
  Interview outputs → (a) clearer picture, (b) the **repo-split decision**. THEN **Chunk 2b** (browser-use).
- **REPO SPLIT — DEFERRED, decide in the interview (2026-06-29).** Roi wants Tower out of feather-browser
  ("they dont need to share a home") — instinct confirmed sound. NOT now: it's invisible structural work at
  the moment he wants to orient, and it forces a "what journal/design-history travels" sub-decision. If yes,
  **execute at the Chunk-2b boundary** (documented `AGENTS.md` split-trigger = first non-Feather tool).
  Code coupling is already zero (HTTP-only, no `src/` import).
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

## Push-state — RESOLVED (verified via `git fetch` 2026-06-29)
- **`origin/dev` = `7ce69b2`.** Chunk 1 + the UI slice + the Chunk-2 design/plan commits **are ALREADY
  PUBLIC** on origin (the repo is public). The old **"~19 unpushed" breadcrumb was WRONG** — that work was
  pushed at some point despite the "keep local" notes.
- **Only this session's 8 commits `fccde32..170bb00` (Chunk 2a + the `/stop`) are genuinely local/unpushed.**
  Roi's call 2026-06-29: **keep 2a local for now**; push later when he wants it public. (origin/dev sits 8
  behind local — expected, not a problem.)

## Recent completed context
- **2026-06-29 Chunk 2a (this session):** the Feather minimal-brain adapter, merged. See handoff
  `journal/ops/sessions/the-brain-i-gave-the-body-20260629-0154.md`.
- **2026-06-28 UI slice + Chunk-1 build + Chunk-2 design:** render-the-run page merged; engine skeleton;
  the two-adapter spec + 2a plan. (Folded from the consumed `next.md` bridge.)
- **2026-06-28 Tower research loop:** 5 strands + synthesis, adversarial-verified (~140 agents). Locked the
  broad framework (D2), scoring (D3), Design B (D4), store (D5), security axis (D6). Blog 0027.
- **2026-06-26/27 Gym Step 1 + mouse-motion:** `tower/behavioral.ts`+`classify.ts` HTTP-drive of
  bot.incolumitas; mouse-motion built, premise debunked (detector backend down), gym BLOCKED state. Blogs 0026.
