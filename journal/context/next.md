# Next — Context Bridge

_No pending entries. The prior bundle (brainstorm reframe + Session-1 monorepo orientation + Session-2
research loop) was consumed at the 2026-06-28 00:27 `/stop` and archived to
`journal/archive/next/2026-06-28/0027-stop-bundle-tower-research-loop.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-28 — Tower PR-1: brainstorm → spec → chunk-1 plan (BUILD PREP, no product code yet)

### Session pointer
- Roadmap/session pointer: BUILD PHASE, PR-1 MVP, **Chunk 1** (engine + website skeleton). Plan of
  record `tower/research/2026-06-27-00-SYNTHESIS.md`; PR-1 design `docs/specs/2026-06-28-tower-pr1-mvp-design.md`;
  chunk-1 plan `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md`.

### Summary
- Cleared the inbox flag, then ran the full brainstorm→spec→plan chain for **PR-1 Chunk 1**. No product
  code written — design + plan only, all committed (UNPUSHED).
- **Execution chosen (via `/next` args): subagent-driven-development + dispatching-parallel-agents.**
  Next chat executes the 8-task chunk-1 plan that way, on a new branch.

### Completed
- **Inbox processed:** `2026-06-27-bot-detection-signals-research.md` verified promoted into `tower/research/`
  → moved to `journal/raw/archive/`. Owed GPU/WebGL static-fingerprint follow-up **parked** in tasks.md
  (commit `ecd1d64`, **pushed**; `61d400b..ecd1d64` is on origin/dev, so the prior 3 unpushed commits went up too).
- **PR-1 design spec** written + committed: `docs/specs/2026-06-28-tower-pr1-mvp-design.md` (`5eec9ce` + `104d57d`).
- **Visual companion review** (superpowers brainstorming): 4 screens (big picture / verdict logic / level
  result card / build chunks) — all approved. Server stopped.
- **Chunk-1 implementation plan** written + committed: `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md`
  (`dd06101`) — 8 TDD tasks.

### User decisions / quotes
- **No GitHub PRs** (solo dev); use **branch-per-big-chunk** off `dev`, Claude reviews the diff before merge.
- **Approach A:** both tools in PR-1 (Feather HTTP + browser-use Python subprocess shim).
- **The Tower IS a website** — bring-your-own-agent; a stranger points *their* agent at it and says "start tower 1".
- **PARTIAL rule:** must carry cause + fix, else auto-downgrade to FAIL. Quote: *"a partial... is something
  may have went wrong... just partial with no suggestion means fails... a way to know the tool/agent/browser needs a fix."*
- **AI summary on EVERY level** (incl. WIN), not just failures. Quote: *"i kinda want an ai paragraph for
  each level no matter what the outcome was."* AI **explains, never scores.**
- **No invented %-cutoff:** grader-native ordinal (ok/gated/blocked/error → WIN/PARTIAL/FAIL/UNTESTABLE);
  % appears only as a measured rate + Clopper-Pearson CI across runs; overlapping CIs → `tie`.

### Agent decisions / assumptions / rationale
- Spec saved to `docs/specs/` (not `docs/superpowers/specs/` — gitignored here) per repo convention.
- Chunk-1 plan **defers the four Zod registries** (pulled to chunks 2–3 where they get a first real entry)
  and the SQLite read-index — chunk 1 needs only `Adapter`/`Level`/`Tower` interfaces to be testable. Flagged in plan self-review.
- New code lives under `tower/core/`; **do NOT touch `tower/behavioral.ts` / `classify.ts`** (legacy
  PASS/FAIL/BLOCKED detector stays). Core gets its own `ok/gated/blocked/error` ordinal.

### Files read or touched
- Read: `tower/research/2026-06-27-00-SYNTHESIS.md`, `tower/behavioral.ts`, `tower/classify.ts`,
  `package.json`, `vitest.config.ts`, `tsconfig.json`.
- Touched (committed): `journal/ops/tasks.md` (GPU park), `docs/specs/2026-06-28-tower-pr1-mvp-design.md`,
  `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md`; moved `journal/raw/_inbox/...signals-research.md` → `archive/`.

### Open threads / unresolved questions
- Chunks 2 (adapters), 3 (levels), 4 (scoring + AI report) still unplanned — each gets its own plan after chunk 1.
- `serve.ts` `now`-clock has a documented soft spot (fallback noted in plan Task 8); not on the graded path.

### Next action
- **Set up branch `tower-core-skeleton` off `dev`, then execute the chunk-1 plan via
  subagent-driven-development** (fresh subagent per task, two-stage review between tasks). 8 tasks, all TDD.

### Next session should read
- `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md` (the plan — start here)
- `docs/specs/2026-06-28-tower-pr1-mvp-design.md` (the design behind it)
- `tower/research/2026-06-27-00-SYNTHESIS.md` (deeper rationale, if needed)

### Risks / blockers
- **UNPUSHED on `dev`:** `5eec9ce`, `104d57d`, `dd06101` (design + plan). Push when ready.
- Keep `behavioral.ts`/`classify.ts` untouched; keep "AI explains never scores" + the PARTIAL invariant intact while building.

---
## 2026-06-28 18:28 — Tower Chunk-1 BUILT (engine + website skeleton) — Roi wants to TRY IT OUT

### Session pointer
- BUILD PHASE, PR-1 MVP, **Chunk 1 = DONE on branch `tower-core-skeleton`** (off `dev`, NOT merged, NOT
  pushed). Plan executed: `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md`. Next = **try it out**, then plan Chunk 2.

### Summary
- Executed the 8-task chunk-1 plan via **subagent-driven-development** (sonnet implementers, opus reviewers
  per Roi's mapping; fresh implementer + opus task-review per task; one fix loop; final whole-branch review).
- **10 commits `bde78e2..24798a3` on `tower-core-skeleton`. Full suite 521 passing, typecheck clean. Final review: READY TO MERGE.**
- Roi chose **option 3 (keep branch as-is)** at the finishing step — not merged, not pushed.

### Completed
- Built `tower/core/`: `types.ts` (Zod records + `Adapter`/`Level`/`Tower` interfaces) · `verdict.ts`
  (verdict→outcome map + **PARTIAL invariant**: gated→PARTIAL only with BOTH cause+fix, else FAIL) ·
  `timing.ts` (injectable stopwatch, times-on-throw) · `store.ts` (append-only JSONL; **tolerant reads**) ·
  `stubs.ts` (stub adapter/level/tower) · `runner.ts` (sequential, stop-on-first-non-WIN, **Grade-validated seam**) ·
  `server.ts` (Fastify: `/health`, out-of-band `POST /sink/:nonce`, `GET /levels/placeholder`).
- `tower/serve.ts` entrypoint + **`npm run tower:serve`** + end-to-end smoke test. `tower/results/` gitignored.
- Final-review hardening (commit `24798a3`): tolerant JSONL reads (Roi's call), `Grade.parse` at runner seam,
  sink `TODO(chunk-2)` nonce-registry marker, monotonic `performance.now()` serve clock, dropped dead `reports[]`.
- SDD ledger at `.superpowers/sdd/progress.md` (gitignored) records every task + review verdict.

### User decisions / quotes
- **"i want to try it out"** — next chat should run the skeleton, not start Chunk 2 cold.
- On readRuns fragility: chose **"Tolerate bad lines"** — skip malformed/truncated lines, warn, return valid records (changed the plan's strict-parse design).
- Finishing step: chose **option 3 — keep branch `tower-core-skeleton` as-is** (no merge, no PR, no push yet).

### Agent decisions / assumptions / rationale
- Directed Task 8 to use the plan's clean monotonic-counter `now` fallback, not the awkward inline expression.
- Closed Task 6's reviewer "Important" test-gap by pinning failure-path `parts=["drive"]` (commit `a126c11`).
- `Grade.parse` added at the runner boundary so a future bad Chunk-2 grader fails loud+contained (→ error/UNTESTABLE), not silent.

### Files read or touched
- Read: `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md`, all `/start` state files.
- Touched (committed on branch): all `tower/core/*.ts` + tests, `tower/serve.ts`, `package.json` (+`tower:serve`), `.gitignore` (+`tower/results/`).
- Touched (uncommitted, light tracker): `journal/context/next.md`, `journal/log.md`, `journal/ops/tasks.md`, `journal/context/active.md`.

### Open threads / unresolved questions
- Chunks 2 (adapters: `adapter.feather` HTTP + `adapter.browser-use` Python subprocess shim), 3 (real levels: L2 `runtime_enable` detectability + `comment_injection` security), 4 (scoring CIs + AI report) — each still needs its own plan.
- Branch not merged/pushed; the 3 design/plan commits also still unpushed on `dev`.

### Next action — UI SLICE (Roi's call 2026-06-28: deviate from plan order, do this BEFORE Chunk 2)
- **Build a "render the run" UI slice** (½–1 day): serve a real page at `/` that reads the latest `RunRecord`
  (the existing WIN→FAIL stub run from `tower/serve.ts`) and draws **result cards** — one per level showing
  outcome (WIN/PARTIAL/FAIL/UNTESTABLE), the `cause`/`suggestedFix`, per-part timing, and a **placeholder
  slot for the AI paragraph** (AI explains-never-scores — wired for real in Chunk 4). Data is stub/fake; the
  UI is real. Low-risk frontend over data that already exists; de-risks the Chunk-4 website design early and
  gives Roi the visual payoff he asked for ("i want to see the actual website").
- Rationale (Roi): he kept saying he wants to *see* the website; a pure-backend Chunk 2 (Python adapter shim)
  would show nothing. UI slice keeps motivation/joy in the loop on a learning/portfolio project. The slice
  becomes the shell Chunk 4 fills in. **After the slice, resume plan order: Chunk 2 (adapters) → 3 (levels) → 4 (full website).**
- Suggested approach: brainstorm the page (superpowers:brainstorming) → tiny plan → build. Keep it server-rendered
  HTML from the Fastify app (no SPA framework — no new deps; matches Chunk-1 style). Add a `GET /` route + a
  reader that loads `tower/results/runs.jsonl` (use the tolerant `readRuns`). Consider `frontend-design` skill for the look.
- Earlier "try it out" is DONE — verified live this session (health/placeholder/sink all worked; persisted
  RunRecord showed WIN→FAIL stop-at-security with cause+fix + per-part timing; screenshot of the bare placeholder sent to Roi).

### Next session should read
- `.superpowers/sdd/progress.md` (the build ledger — what shipped, every review verdict)
- `docs/plans/2026-06-28-tower-pr1-chunk1-skeleton.md` (what was built) + `tower/serve.ts` (the entrypoint to run)
- `tower/research/2026-06-27-00-SYNTHESIS.md` (Chunk 2+ rationale, when planning next)

### Risks / blockers
- Branch `tower-core-skeleton` UNMERGED + UNPUSHED; design/plan commits `5eec9ce`,`104d57d`,`dd06101` UNPUSHED on `dev`.
- Keep `behavioral.ts`/`classify.ts` untouched; keep "AI explains never scores" + PARTIAL invariant intact in Chunks 2–4.
- `npm run tower:serve` needs the branch checked out (`git checkout tower-core-skeleton`) — the code isn't on `dev` yet.

---
## 2026-06-28 20:01 — UI slice SHIPPED+MERGED; Chunk 2 designed; 2a plan ready to execute

### Session pointer
- BUILD PHASE, PR-1 MVP. UI slice DONE+merged to `dev`. Chunk 2 (adapters) spec written.
  **NEXT = execute the Chunk-2a plan via subagent-driven-development on a fresh branch.**
- Plan of record: `tower/research/2026-06-27-00-SYNTHESIS.md`. PR-1 design `docs/specs/2026-06-28-tower-pr1-mvp-design.md`.

### Summary
- Shipped the "render the run" UI slice (brainstorm→spec→plan→subagent-driven, 4 commits) and **merged it +
  Chunk 1 to `dev`** (fast-forward; branch `tower-core-skeleton` deleted). 531 green. All **LOCAL/UNPUSHED**.
- Designed **Chunk 2 (the two adapters)** + wrote the **Chunk-2a plan**. No 2a code yet.

### Completed
- **UI slice (Roi's deviate-from-order call):** `tower/core/render.ts` (pure `renderRun`, escaping, 4 outcome
  chips, AI-placeholder slot every card, empty state) + `GET /` route + `resultsFile` dep on `buildServer` +
  `serve.ts` wiring. Commits `a00d84f`,`8e49f30`,`8049004`,`275c0f6`. Final opus review = READY TO MERGE.
  Live-verified (screenshot sent: WIN/FAIL cards over the stub run). Spec `docs/specs/2026-06-28-tower-render-run-ui-slice-design.md`, plan `docs/plans/2026-06-28-tower-render-run-ui-slice.md`.
- **MERGED to `dev`** (Roi: "Merge it to dev, keep it local for now"). `dev` now at `275c0f6`, 19 commits ahead of origin, branch deleted. **Nothing pushed.**
- **Chunk 2 brainstorm + spec** `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md` (`138de8a`).
- **Chunk-2a plan** `docs/plans/2026-06-28-tower-chunk2a-feather-adapter.md` (`d81e349`) — 6 TDD tasks.

### User decisions / quotes
- Feather brain: **"Give Feather a minimal brain"** — a small LLM (Claude) observe→act loop drives Feather so
  "Feather + brain" can attempt BOTH detectability AND security levels (security needs a brain to be hijacked).
- browser-use: **"Real browser-use"** — actually run the framework as a Python subprocess (Chunk 2b).
- **"keep it in the monorepo for now"** — browser-use is the documented split-trigger but DON'T split during PR-1;
  Anthropic SDK → root package.json, Python isolated under `tower/adapters/browser-use/`. Revisit split after PR-1.
- Execution: **"1. Subagent-Driven in the /next session"** — run the 2a plan via subagent-driven-development in a FRESH chat.
- Provider = Claude/Anthropic, default model `claude-opus-4-8` (env `FEATHER_BRAIN_MODEL`).

### Agent decisions / assumptions / rationale
- 2a split (Feather adapter) before 2b (browser-use) — own-tool/no-Python first, lower risk; one spec, two plans.
- Brain = throwaway-small Tower-owned LLM loop, NOT fable/iroh ("integrate by driving, never merge").
- DI seams (`BrowserSessionClient` + `Decide`) so brain+adapter unit-test with mocked LLM + mocked browser (no key/net);
  real composition only in the opt-in live smoke. Action vocab = 4 verbs (click/type/done/give_up) via forced tool-use.
- Consulted the `claude-api` skill for exact SDK shape (cost: ~heavy context; that's why Roi wants a fresh chat).

### Files read or touched
- Touched (committed on `dev`): the 4 UI-slice source commits + 2 specs + 2 plans (paths above).
- Read: `tower/core/{server,types,store,stubs,serve}.ts`, `docs/api-reference.md` (Feather observe/click/type endpoints), `package.json`.

### Open threads / unresolved questions
- 2a not built. 2b (browser-use subprocess) still needs its own plan after 2a.
- Chunks 3 (real levels) + 4 (scoring/CI/AI report) still unplanned.
- `decide-claude` omits `output_config.effort` (defaults high) — possible cheap-mode follow-up (effort:"low").

### Next action
- **Fresh chat:** branch off `dev` (e.g. `tower-feather-adapter`), then execute
  `docs/plans/2026-06-28-tower-chunk2a-feather-adapter.md` via **subagent-driven-development** (sonnet impl /
  opus review per task, fresh subagent per task, two-stage review, final whole-branch review). Tasks 1–5 are
  self-contained (mocked); Task 6 live smoke needs a running Feather (`npm run dev`) + `ANTHROPIC_API_KEY`.

### Next session should read
- `docs/plans/2026-06-28-tower-chunk2a-feather-adapter.md` (the plan — start here)
- `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md` (the design behind it)
- `.superpowers/sdd/progress.md` (the SDD ledger — has a UI-slice section; start a new Chunk-2a section)

### Risks / blockers
- Everything since the loop is **LOCAL/UNPUSHED on `dev`** (now ~19 commits ahead of origin). Push when Roi wants it public.
- Keep `behavioral.ts`/`classify.ts` + the `Adapter` interface + no-attach rule + "verdicts external, never adapter-reported" intact.
- Live smoke is real-LLM/nondeterministic + costs money + needs Feather running — opt-in, not CI; honest wander/give_up is a first-class outcome.
