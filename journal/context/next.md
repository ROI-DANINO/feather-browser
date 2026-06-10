# Next — Context Bridge

_Empty buffer. The last entry (daily-driver background launch + `primary` re-warm) was consumed at the
2026-06-10 ~01:42 `/stop` and archived to
`journal/archive/next/2026-06-10/0142-daily-driver-background-launch.md`. Current state lives in
`journal/context/active.md`._

<!-- Append `/next` bridge entries below this line when moving between work sessions mid-thread. -->

---
## 2026-06-10 03:17 — Pass-2 observe-loop measurement (full suite) + Google-first doctrine + H1 semantic rewrite

### Session pointer
- Phase 4a / Feather v1. Prior NEXT was open; Roi chose **(a) measure the observe win — full suite on scratch, subagents everywhere**.

### Summary
- Full 10-task showcase re-run agent-driven via the NEW `observe → act-by-ref → diff` loop: **9 PASS + M1 PARTIAL (CAPTCHA, expected). 104 Feather API calls, ZERO `ELEMENT_NOT_FOUND`** — selector guess-and-fail is gone. H2 beat the scripted baseline (65.7s vs 83.4s). Full report: `examples/showcase-output/pass2-observe/results.md`.
- Roi's semantic audit caught what PASS labels hid: H1 wrote the **wrong-date** event (Jan-1 holiday placed "now"), H3's comment was generic AND pre-baked by the dispatcher (content-aware commenting never tested), 5 junk calendar events had accumulated (all deleted by subagents).
- **Google-first research doctrine** decided + written into `docs/agent-playbook.md`; **H1 rewritten semantically** in `examples/showcase.sh` and verified live: PASS 12.3s, "Rosh Hashana, Sat Sep 12 2026" as an all-day event on the correct date, corroborated on-screen by the built-in Israeli-holidays calendar.

### Completed
- Dev server restarted on current code (old PID predated `/observe` — 404'd; **`npm run dev` = plain ts-node, NO autoreload: always restart after src changes**). Now at `:34285` (started from this session's background shell — **verify alive / restart at next /start**).
- Wave 1: E1–E3, M1–M3 as 6 parallel disposable-headless subagents; Wave 2: H1–H4 sequential on warmed scratch (profile lock). `primary` never touched.
- **3 product bugs found (field evidence in results.md):** (1) `/dismiss` under-reports — real modal cleared but response said `dismissed:[]`; overlay entries carry `ref:null` (overlay→ref linkage broken) + calendar grid false-positive as blocking banner. (2) **Accname gap** — IG Like/Comment buttons nameless in observe (descendant `svg[aria-label]` doesn't bubble up); forced geometry targeting; like invisible in diff. Fix: accname traversal. (3) **INTERNAL_ERROR on successful nav-triggering clicks** — fired on EVERY Google Calendar click; "re-observe before concluding failure" recovery proven deterministic. Smaller: diff is structural-only (typed values invisible) + cap-bounded (H1 menu needed `cap:200`); observe 2.5s/4899 elements on Wikipedia; `role:null` on bare-HTML pages; screenshot 8s timeout tight (wait stable first).
- H4 isolation probe proved per-page observeIds, per-page diff baselines surviving interleaved tabs, loud `REF_EXPIRED` on stale refs, `CANNOT_CLOSE_LAST_TAB` per docs — the `3b82839` safety fix holds in the field.
- `docs/agent-playbook.md`: new "Research doctrine: Google-first on a warmed profile" section; ref-format example fixed to observe-scoped `obs_x.eN`; error table now documents the INTERNAL_ERROR→re-observe recovery.
- `examples/showcase.sh`: run_h1 rewritten (Google SERP → source link → parse NEXT national holiday after today → all-day event on its real date via eventedit deep link → semantic verify on the day view). Also fixed latent `__run` debug-hook errexit bug (killed single-task runs + leaked sessions). My own first iteration ALSO "PASSed" with garbage (DST news blurb, Nov 1) — caught by semantic check, junk event deleted; parser now anchors on `/holidays/israel/` hrefs, lazy type-capture with month lookahead, verified offline against saved markdown then live.
- 4 Feather operator skills registered for the Skill tool via symlinks `.claude/skills/<name>` → `skills/<name>` (Roi asked). Content NOT rewritten — still teaches old snapshot-first loop; rewrite owed, now evidence-backed.
- timeanddate Cloudflare-challenges headless disposables ("Just a moment…") — more proof research = warmed-profile capability.

### User decisions / quotes
- **Google-first:** "we need to search google for information, not directly search a specific website (like the holyday one)... google, which is a very high quality search engain with built in ai".
- **Answer source:** source page is the truth; AI Overview = hint only.
- **Search identity:** headed scratch for now. Quote: "cant we find a way to make the headless also warm but not detectable as a bot? maybe it is already safe enugh and undetectable cause its warm? but can we use it headless? anyways for now headed Scratch." → headless-warm detectability spike = v2 (already roadmapped, `de54f69`).
- **Locale:** keep Hebrew/natural — operate as the human would.
- **Scope:** "Doctrine + fix H1" — DONE this session.
- **Playbook as dir?** Roi raised it, said "dont do it yet". My recommendation: don't split — the skills suite IS the token-efficiency layer (index + on-demand pages); rewrite the skills instead; if playbook grows, split Part 2 (human how-&-why) out first.
- "i think we can do the follow ups in the /next session" → this bridge.

### Agent decisions / assumptions / rationale
- E/M tiers stayed on disposable profiles (parallelism; warmth not needed) — read Roi's "run on scratch" as "use the test identity, never primary"; H tier ran on scratch per suite design.
- H3 comment text was pre-baked in the dispatch prompt — flagged as a test-design flaw, not hidden.
- `examples/showcase-output/results.md` got regenerated by the `__run` hook (generated artifact; pass-1 numbers preserved in the recipe log + journal).
- Skill registration done as symlinks (single source of truth, no content edit) per writing-skills discipline: no skill rewrite without test evidence — which this run now provides.

### Files read or touched
- Touched: `docs/agent-playbook.md`, `examples/showcase.sh` (both uncommitted), `.claude/skills/{using-feather-browser,feather-form-filling,feather-data-extraction,feather-human-handoff}` (symlinks, local/untracked), `examples/showcase-output/pass2-observe/*` (results.md + 12 artifacts), `examples/showcase-output/H1-20260610T000349Z.png`.
- Read: journal state files, `journal/work/browser/context.md`, `docs/specs/2026-06-09-showcase-pass1-recipes.md`, `docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`.

### Open threads / unresolved questions
1. **Rewrite the 4 operator skills** to the observe loop (evidence: pass2-observe/results.md).
2. **Observe bug fixes:** `/dismiss` under-report + `ref:null` overlays; accname traversal into descendant svg aria-labels; INTERNAL_ERROR on nav-clicks (return success + `navigated` flag).
3. **Semantic-assertion layer for the suite** (PASS must mean the errand was done right; date asserts; content-aware H3 comment chosen by the agent from the post).
4. **Commit** `docs/agent-playbook.md` + `examples/showcase.sh` (+ this journal bridge).
5. Parked: headless-warm spike (v2), C4C transcript analysis (optional), **v2 Gate A** (the big next).

### Next action
- Commit this session's two files + journal, then take the follow-ups (suggested order: skills rewrite → observe bug fixes → semantic assertions), then v2 Gate A.

### Next session should read
- `examples/showcase-output/pass2-observe/results.md` (the measurement + bug list)
- `journal/context/active.md`, this bridge

### Risks / blockers
- **Feather server (`:34285`) runs from this session's background shell — may die when the session closes.** Check `/run/user/1000/feather/run/endpoint.json` + `/health` at next /start; restart `npm run dev` from a display-env shell if dead.
- Scratch test calendar now intentionally holds ONE event: "Rosh Hashana (Israeli Holiday)" Sep 12 2026 (correct; future semantic-verify baseline).
- `continuity.test.ts` known pre-existing flake (own ticket).

---
## 2026-06-10 03:41 — Graphify analysis → spin up isolated worktree for MCP integration spike

### Session pointer
- Side-thread off the main Feather roadmap. Evaluating `safishamsi/graphify` as a deterministic code-wiring layer to complement the Markdown intent system. Verdict delivered; now scaffolding an isolated sandbox to try it without polluting `dev`.

### Summary
- Deep-dived the real Graphify source (commit `137bc2d`): tree-sitter AST extraction (28 langs) → NetworkX graph → `graph.json`; MCP server (`serve.py`) returns graph metadata only (never raw source), token-bounded via `_subgraph_to_text`; blast-radius is genuine reverse-edge BFS in `affected.py`; PR impact/triage in `prs.py`.
- **Recommendation given:** adopt MCP-query-layer ONLY — do NOT run `graphify install --platform claude` (it installs its own skill + a PreToolUse hook that intercepts grep/read, colliding with Roi's custom skill pipeline). Keep MD as intent layer; Graphify as wiring layer; do not merge.
- Created isolated worktree **`graphify-test`** at `/home/roking/Desktop/Projects/feather-browser-graphify-test` (branch `graphify-test`, off `dev` @ c0a3c0a) to sandbox the integration spike.

### ⚠️ TASK: Implement Graphify MCP server integration — WORKTREE-SCOPED, DO NOT RUN ELSEWHERE
- **Where:** ONLY valid/executable inside the **`graphify-test`** worktree (`/home/roking/Desktop/Projects/feather-browser-graphify-test`, branch `graphify-test`).
- **Hard guard:** If you are reading this task while on the **`dev`** branch, the main worktree (`/home/roking/Desktop/Projects/feather-browser`), or ANY worktree other than `graphify-test` — **STRICTLY IGNORE this task. Do not scaffold, install, or configure Graphify here.** It must not leak Python deps, `.mcp.json` entries, `graph.json`, `graphify-out/`, or installer artifacts into the main project context. Verify with `git branch --show-current` (must equal `graphify-test`) before touching anything.
- **Scope when in the right worktree (MCP-only, installer-free):**
  1. Install graphify into an isolated venv/uv env inside the worktree (do NOT pollute repo deps unless we decide to commit them).
  2. Build the graph: `graphify extract .` (add `.graphifyignore` fencing off `journal/`, `docs/`, and all `.md` intent files — keep hand-authored MD OUT of the LLM extractor).
  3. Wire MCP-only: register `python -m graphify.serve graph.json` as an MCP server (stdio). **Skip `graphify install` entirely** — no skill files, no PreToolUse hook.
  4. Smoke-test the value path: `query_graph`, `get_node`, and the `affected`/blast-radius reverse-BFS on a real Feather symbol (e.g. an `observe` or session handler) — confirm it returns metadata + file:line, not source dumps.
  5. Filter blast-radius to `EXTRACTED` edges + explicit relations to avoid `INFERRED`/`AMBIGUOUS` phantom deps.
- **Decision gate:** if the MCP query layer proves useful in the sandbox, THEN decide whether/how to bring config into `dev`. Nothing crosses back to `dev` without an explicit call.

### User decisions / quotes
- Decision: sandbox the Graphify trial in a dedicated isolated worktree; keep it strictly fenced from main project context.
- Quote: "this specific implementation is ONLY valid and executable within the 'graphify-test' worktree" / "if this task is read while on the main branch or any other worktree, it should be strictly ignored so it doesn't pollute the main project context."

### Agent decisions / assumptions / rationale
- Worktree branched off `dev` @ c0a3c0a (current tip) — isolation via separate branch + dir so deps/artifacts never touch `dev`.
- MCP-only posture is the core recommendation: it delivers the one genuinely complementary capability (reverse-edge blast radius) while avoiding the skill/hook collision with Roi's custom MD+skill system.

### Files read or touched
- Read (external): `safishamsi/graphify` README, ARCHITECTURE.md, `serve.py`, `affected.py`, `prs.py`, package layout @ commit `137bc2d`.
- Touched: this bridge; created worktree `../feather-browser-graphify-test` (branch `graphify-test`).

### Open threads / unresolved questions
1. Does the MCP blast-radius layer add enough value over grep+MD to justify carrying graphify? (answer in the sandbox)
2. If yes — what's the minimal config to bring to `dev` (`.mcp.json` entry + `.graphifyignore` + rebuild hook), and do we commit graphify as a dev dependency?

### Next action
- `cd /home/roking/Desktop/Projects/feather-browser-graphify-test`, confirm `git branch --show-current` == `graphify-test`, then run the MCP-only integration scope above.

### Next session should read
- This bridge entry (the worktree-scoped task + guard)
- Graphify verdict from this chat (MCP-only posture, why no installer)

### Risks / blockers
- **Context-pollution risk** — the whole reason for the guard. Any graphify install/extract MUST happen inside `graphify-test`. Re-check the branch before acting.
- Graphify is a non-trivial Python/uv dependency (tree-sitter grammars, NetworkX, Leiden) — keep it a dev-time companion, never a Feather runtime dep (aligns with lightweight-engine direction).
- The two main-thread Feather files (`docs/agent-playbook.md`, `examples/showcase.sh`) remain UNCOMMITTED on `dev` from the prior bridge — unrelated to this spike; don't lose them.

---
## 2026-06-10 — Observe bug fixes brainstorm (INCOMPLETE — mid-session pause)

### Session pointer
- Phase 4a / Feather v1. Prior pointer: commit uncommitted files → observe bug fixes → skills rewrite → v2 Gate A.

### Summary
- Roi chose to design the 3 observe bug fixes before Gate A (strategic call: clean test harness before security work).
- Brainstorming skill invoked; context explored; tentative approach decisions reached for all 3 bugs.
- **Brainstorm is INCOMPLETE** — design not finalized, no spec written yet. Roi paused mid-session ("okay for now but i want to get back to it").

### Completed
- Explored all 3 bug root causes in code (`observe.ts`, `dismiss.ts`, `walk.ts`, `click.ts`, `input-errors.ts`).
- Reached tentative approach decisions (see below) — not yet approved/finalized by Roi.

### User decisions / quotes
- Decision: Design observe bug fixes before Gate A ("faster, easier, lower risk").
- Bug 3 design: `navigated: true` flag is correct but agent must still re-observe to verify ("the agent still has to verify whats on the screen and not just trust the navigated: true").
- Quote: "okay for now but i want to get back to it" — designs are tentative, not locked.

### Agent decisions / assumptions / rationale
- **Bug 1 (dismiss under-reports):** Tentative → Option B: re-observe after click, verify popup gone, then report dismissed. More trustworthy than recording intent before click (A). Roi preferred B; agent agreed on reflection.
- **Bug 2 (accname gap — SVG labels):** Tentative → Option A: one descendant query (`el.querySelector('[aria-label]')`) before innerText fallback. Full W3C accname algorithm (B) is overkill — covers edge cases not seen in the field. Agent recommended A over Roi's initial preference for B; Roi deferred to agent's call.
- **Bug 3 (INTERNAL_ERROR on nav-clicks):** Tentative → Option A: catch navigation-flavored Playwright errors in click handler, return `{ clicked: true, navigated: true }`. Agent re-observes to confirm state. No API gymnastics.
- Brainstorming tasks #3–#8 remain open (propose approaches done; present design / write spec / user review / write-plans all pending).

### Files read or touched
- Read: `src/commands/observe.ts`, `src/commands/dismiss.ts`, `src/commands/perception/walk.ts`, `src/commands/click.ts`, `src/commands/input-errors.ts`, `src/sessions/types.ts`, `examples/showcase-output/pass2-observe/results.md`
- Touched: none (brainstorming only)

### Open threads / unresolved questions
1. Roi said "okay for now but i want to get back to it" — approach choices are tentative, not locked.
2. Brainstorm still needs: finalize approaches → present full design sections → write spec → Roi review → invoke writing-plans.
3. `docs/agent-playbook.md` + `examples/showcase.sh` still uncommitted on `dev`.

### Next action
- Resume brainstorm: confirm Bug 1/2/3 approach choices, present full design, write spec to `docs/superpowers/specs/`, then invoke writing-plans.

### Next session should read
- This bridge entry
- `examples/showcase-output/pass2-observe/results.md` (bug field evidence)
- `src/commands/dismiss.ts`, `src/commands/perception/walk.ts`, `src/commands/click.ts` (root causes)

### Risks / blockers
- Brainstorm skill checklist tasks #3–#8 are open — next session must resume from "propose approaches" onward, not restart.
- `docs/agent-playbook.md` + `examples/showcase.sh` still uncommitted — don't lose them.
