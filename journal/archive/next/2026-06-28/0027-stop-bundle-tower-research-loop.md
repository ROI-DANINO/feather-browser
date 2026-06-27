# Next — Context Bridge

_1 pending entry (2026-06-27 20:02 — bench reframe + research-loop spec + monorepo orientation plan).
The prior bundle was consumed at the 2026-06-23 20:23 `/stop` and archived to
`journal/archive/next/2026-06-23/2023-v2-spine-live-tested.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-27 20:02 — Bench reframe + research-loop spec + monorepo orientation plan

### Session pointer
- Roadmap/session pointer: BOT-GYMNASIUM thread → now reframed to the **outward bench / "bot tower"**.
  Plan-of-record for next work: `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`.

### Summary
- Brainstorm session (no product code). Started on "agent mouse + pause button"; pivoted hard after
  Roi (rightly) distrusted my from-training assertions about bot detection.
- Reframed Feather: agentic browser → an **outward comparative bench** measuring how *detectable* AND
  *exploitable* ANY agentic browser tool is (detectability + security/injection axes).
- Produced a spec for a next-session **research-and-design loop**, and an agreed **monorepo
  orientation** plan that gates the loop.

### Completed
- Ran a deep-research Workflow on bot-detection signals (91 agents, 3-vote verified). **Synthesis stage
  returned broken placeholder stubs — recovered the 22 confirmed + 3 killed claims from the journal.**
  Report: `journal/raw/_inbox/2026-06-27-bot-detection-signals-research.md`.
  - KEY: NO detector reads cursor RENDER/compositor — all read the JS event stream. **In-page drawn
    cursor is itself a Brotector tell** → any "watch the agent" cursor must render out-of-page.
  - CORRECTION to my earlier claim: Feather's CDP mouse IS detectable (Brotector via crbug#1477537),
    independent of isTrusted. "156 trusted events ⇒ undetectable" was too rosy.
- Internal repo audit (3 parallel Explore agents) → "what we know vs what's missing" map.
- Wrote `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md` (the loop spec) incl. §0
  monorepo precursor + two-stage-reorg ordering.
- Updated memory `feather-gymnasium-direction` with the outward-bench reframe; added memory
  `verify-dont-assert-on-detection`.

### User decisions / quotes
- Decision: Tower player = **OUTWARD — bench ANY agentic tool** (browser-use/Stagehand/Patchright/…),
  not just Feather's own driver.
- Decision: Loop deliverable = **all three in sequence** (landscape+gap → scoring methodology → tower
  designs), since expanded to 5 strands (+ data/knowledge architecture, + security/injection axis).
- Decision: **Security/injection axis IS in the tower** (prompt-injection, SQLi, any-injection through
  the agent). Same loop, distinct strand.
- Decision: **One clean monorepo, NOT a repo split** (portfolio story). Reorg in two stages straddling
  the loop. "2 sessions thats fine."
- Quote: "i feel its getting as three projects in one repo - the actual feather-browser code, the
  start,next,stop and journal documentation spine and now the fether-tower."
- Quote: "i dont want to fully relay on a LLMs conext window and decision making" (→ data/knowledge
  store as a researched strand, not my gut).
- Quote: "do be scaird of work please" + "i like order correctness and scaleability" + "im not token
  cheap and i actually support a long going agentic loop if its outcome will be good results."

### Agent decisions / assumptions / rationale
- The agent mouse is currently INVISIBLE (page.mouse.move paints no cursor); the visible-cursor idea is
  observability-only, NOT a detection feature (proven, not asserted).
- Mechanism for next session = HYBRID: self-paced `/loop` holds goal+DoD, fires dynamic Workflows per
  pass (Workflows are deterministic scripts; the loop adapts). No meta-regress "spec writes spec."
- grep→richer-store trigger made concrete + an AUDIT (terminology-drift + unstructured-volume) folded
  into strand 4. Data store survey broadened to ALL methods (relational/columnar/document/graph/
  time-series/vector), not just vectors.
- Monorepo reorg scoped as: Stage 1 shell BEFORE loop (cheap, loop-independent), Stage 2 guts AFTER
  loop (shape-dependent). Don't extract the tower before the loop = guessing.

### Files read or touched
- Touched: `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md` (created),
  `journal/raw/_inbox/2026-06-27-bot-detection-signals-research.md` (created),
  memory `feather-gymnasium-direction.md` (updated), memory `verify-dont-assert-on-detection.md` (new).
- Read: `src/commands/move.ts`, `src/browser/pause-banner.ts`, `src/commands/await-human.ts`,
  `src/browser/mouse-path.ts`, `gym/*`, `.gitignore`, repo layout.

### Open threads / unresolved questions
- Spec `2026-06-27-bench-reframe-and-research-loop-design.md` is **awaiting Roi's review**.
- Commits `fbea1d7..0576723` (prior session's mouse-motion + gym BLOCKED state) **still UNPUSHED** on `dev`.
- GPU/WebGL/canvas/TLS-JA3 fingerprinting = under-covered evidence gap (owed research angle).
- Stage-2 tower internals + data-store choice + split-trigger = deferred to post-loop (by design).

### Next action
- **Session 1 = monorepo Stage-1 orientation pass** (its own brainstorm→plan→execute→verify; public
  repo, careful): fix stray tracked root `inbox/`, force-committed `demo-hero-mfa.mp4`, loose root
  videos; gitignore the tower's coming artifacts; seams = product vs spine (demoted) vs `tower/`
  (promote `gym/`→`tower/`); decide the split-trigger; do NOT extract. THEN Session 2 runs the loop.

### Next session should read
- `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md` (§0 = the monorepo precursor)
- `journal/raw/_inbox/2026-06-27-bot-detection-signals-research.md`
- memory `feather-gymnasium-direction` (the reframe)

### Risks / blockers
- Public repo surgery — keep the monorepo reorg reversible, verify before/after (don't break the
  start/next/stop pointers, which assume `journal/` co-location).
- deep-research Workflow's synthesis stage is flaky (returned stubs) — if re-run, plan to recover
  from the journal again.
- Unpushed `fbea1d7..0576723` remain local-only until Roi pushes.

---
## 2026-06-27 20:31 — Session 1 DONE: monorepo Stage-1 orientation pass (the clean shell)

### Session pointer
- Plan of record: `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md` §0 (the monorepo
  precursor). Stage 1 = the shell BEFORE the loop. **Stage 1 is now complete.** Next = Session 2 (run
  the research loop). Stage 2 (tower guts/data-store/extraction) stays deferred to post-loop by design.

### Summary
- Executed §0 Stage-1: cleaned clutter + set the three seams + promoted `gym/` → `tower/`, all verified
  green. ONE clean monorepo, NOT extracted. No product-code logic touched.

### Completed
- **Hygiene:** untracked `demo-hero-mfa.mp4` (`git rm --cached`; README repointed to the inline GIF, mp4
  link dropped). Moved 6 loose root videos (incl. the mp4) into gitignored **`local/`**. Removed the
  stray tracked root **`inbox/`** stub (912-byte stale seed, superseded by
  `research/2026-06-07-open-source-integration-research.md`) + dropped its dead line from `.graphifyignore`.
- **Seam: `gym/` → `tower/`** as a git-tracked rename (history preserved). Updated functional wiring:
  `package.json` (`gym:behavioral`→`tower:behavioral`), `vitest.config.ts` glob (`gym/**`→`tower/**`),
  `.gitignore` (`gym/runs/`→`tower/runs/` + new `local/`), `[gym]`→`[tower]` runtime log labels +
  one comment in `tower/behavioral.ts`. `behavioral.ts` uses `__dirname` → no path edits needed.
- **AGENTS.md:** new "Repository Layout (Seams)" section — product / spine (co-located on purpose) /
  tower, the rename note, the `local/` convention, and the split-trigger.
- **Verified:** `typecheck` clean · **491/491** unit (tower test discovered via the new glob) ·
  `tower/runs/` gitignored · start/next/stop pointers intact (journal untouched).

### User decisions / quotes
- Decision: `demo-hero-mfa.mp4` → **Untrack, GIF only** (README shows inline GIF; mp4 lives in `local/`).
- Decision: loose root videos → **move to gitignored `local/`**.
- Decision: split-trigger → "**Help me out**" → agent chose & wrote: *tower leaves for its own repo when
  it needs its own deps/build (separate `package.json`), likely forced by adapting a 2nd non-Feather tool.*
  (Roi can re-word toward the tool-agnostic angle if preferred.)
- Quote: "kick off Session 1." / "update AGENTS.md when and if needed."

### Agent decisions / assumptions / rationale
- The 5 loose root `*.mp4` were already gitignored (global `*.mp4`) → untracked clutter only, no git
  surgery; just physically moved to `local/`.
- Root `inbox/` stub deemed superseded (real 23KB research already in `research/`) → safe to remove.
- Renamed the npm script + log labels for consistency (Roi values order/correctness); left HISTORICAL
  refs (blog/journal/docs, incl. the real `docs/testing/gym-step1/` path) untouched — only functional
  wiring changed.
- Did NOT commit (left for `/stop`), did NOT extract tower (Stage 2 / post-loop by design).

### Files read or touched
- Touched: `package.json`, `vitest.config.ts`, `.gitignore`, `.graphifyignore`, `README.md`, `AGENTS.md`,
  `tower/behavioral.ts`; renamed `gym/{behavioral,classify,classify.test}.ts` + `gym/results.md` →
  `tower/`; removed `inbox/open-source-integration-research.md`; created `local/` (gitignored).
- Read: `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md`, repo layout / git-ls-tree,
  `tsconfig.json`, `vitest.config.ts`.

### Open threads / unresolved questions
- Nothing committed yet — `/stop` should checkpoint Stage 1 (+ tick the `tasks.md` Session-1 box) and
  carries the still-unpushed `fbea1d7..0576723`.
- Split-trigger wording is the agent's pick; Roi may adjust.

### Next action
- **Session 2 — run the research-and-design `/loop`** (5 strands) into `tower/`, per the loop spec.
  (Or `/stop` first to checkpoint Stage 1.)

### Model policy for the loop (Roi, 2026-06-27)
- **Do NOT use haiku for anything that needs even minimal thinking.** Prefer **sonnet** and **opus**.
  Applies to the loop's Workflow subagents: route reasoning/research/synthesis/verify work to
  sonnet/opus; haiku only for genuinely mechanical, no-thought steps (if at all). Consistent with the
  prior "haiku→sonnet, sonnet→opus" mapping. Roi is not token-cheap and supports a long loop for good
  outcomes.

### Next session should read
- `docs/specs/2026-06-27-bench-reframe-and-research-loop-design.md` (§3–§7 = the loop mechanism + DoD)
- `journal/raw/_inbox/2026-06-27-bot-detection-signals-research.md`
- `AGENTS.md` "Repository Layout (Seams)" (the new structure)

### Risks / blockers
- Stage-1 changes uncommitted — a stray `git checkout`/reset could lose them until `/stop` commits.
- Unpushed `fbea1d7..0576723` still local-only.
