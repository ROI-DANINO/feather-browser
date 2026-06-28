# The Brain I Gave the Body — Tower Chunk 2a + orientation

**Stop:** 2026-06-29 01:54 · **Branch:** `dev` @ `94ce173` (Chunk 2a merged, LOCAL)
**Phase:** v1-ship-and-adopt → BUILD PHASE, Tower PR-1 MVP · Chunk **2a DONE**, next = interview → 2b

> Consumes the accumulated `next.md` bridge (Chunk-1 prep · Chunk-1 build · UI-slice + Chunk-2 design)
> plus this session (Chunk-2a build + orientation + split decision).

## Done this session
- **Chunk 2a — `adapter.feather` BUILT & MERGED** via subagent-driven-development (6 TDD tasks; sonnet
  implementers / opus reviewers; fresh subagent + opus task-review per task; final whole-branch review;
  one fix loop + re-review). Gave Feather a small **Tower-owned Claude brain** (observe→decide→act over
  Feather's HTTP API, **never imports `src/`**). 7 commits `fccde32..94ce173`, **555 green**, typecheck clean.
  Fast-forward merged to `dev`; branch `tower-feather-adapter` deleted. **Kept local — nothing pushed.**
  - `tower/core/agent/action.ts` — four-verb vocabulary (`click`/`type`/`done`/`give_up`), Zod union.
  - `tower/core/agent/brain.ts` — `driveToGoal` loop, bounded by **step budget + wall-clock timeout**
    (injectable `now` clock; `timed_out` outcome). Seam types `BrowserDriver`/`Decide`/`Observation`.
  - `tower/core/agent/decide-claude.ts` — `makeClaudeDecide`: Claude **forced tool-use** → Zod-validated
    `Action`. New dep `@anthropic-ai/sdk@^0.106.0` in **root** `package.json`. Default model `claude-opus-4-8`.
  - `tower/core/adapters/feather-client.ts` — HTTP-only `FeatherClient` (session/navigate/observe/click/
    type/close) + `readFeatherEndpoint` (endpoint.json + token file). Injectable `fetchImpl` for mocked tests.
  - `tower/core/adapters/feather.ts` — `featherAdapter`: create → navigate → drive → **`finally`-close**;
    **drives, never grades** (returns void on done/give_up/budget/timeout; throws only on a drive error).
  - `tower/smoke/feather.ts` + `npm run tower:smoke:feather` — opt-in live drive (real Feather + real Claude),
    NOT in CI. Live-run deferred to Roi (needs a running Feather + `ANTHROPIC_API_KEY`).
- **Final review = WITH FIXES; all 3 fixed before merge** (commit `94ce173`): (1) **Critical** —
  `createSession` POSTed `{}` but `POST /v1/sessions` *requires* `profile{kind}` → would 400 the live
  smoke; fixed to `{ profile: { kind: "disposable" } }` (verified vs `docs/api-reference.md`). (2) the unit
  test now asserts the createSession body (the gap that hid #1). (3) **the spec's wall-clock timeout**
  (§5/§11) that the plan had silently narrowed away from `driveToGoal` — added back, deterministically tested.
  *(Reviewer confirmed: no other live-path shape is wrong — header/endpoints/observe-fields/envelope/target
  all correct vs the API docs.)*
- **Honesty properties all hold:** no `src/` import, no-attach (HTTP control channel only), `Adapter`
  interface unchanged, four-verb brain is throwaway-small & Tower-owned (NOT fable/iroh), Chunk-1 files untouched.
- **Oriented Roi** (he asked to: "I feel kinda lost... I just want to get oriented"). Mapped PR-1: Chunk 1 ✓,
  UI slice ✓, **2a ✓**, then 2b (browser-use) → 3 (real levels) → 4 (scoring + AI report + real site). He's
  ~halfway; the *visible* "watch a tool get caught/hijacked" payoff lives in Chunks 3–4.

## Decisions
- **Repo split (Tower out of feather-browser): DEFERRED — decide deliberately in next session's interview**
  (it's the "is the Tower its own product?" identity question). If yes, **execute at the Chunk-2b boundary**
  (the documented `AGENTS.md` split-trigger = first non-Feather tool = browser-use). Code coupling is already
  zero (Tower drives over HTTP, never imports `src/`); the hard part is what journal/design-history travels.
- **Next session STARTS as an interview** — build Roi's mental model before more building. He learns by
  **seeing and using**; get him in front of something runnable while we talk.
- All-3-fixes-then-merge; merge to `dev` keep local (Roi's calls this session).

## Ideas (Roi, raw — captured to memory, do NOT pre-build)
- **Two web interfaces:** the public Tower site (anyone tests their agent) + a private **admin dashboard**
  where Roi picks which agentic/scraper/bot program to test. Maps onto the adapter registry. Undesigned.

## Roi quotes
- *"i understand better when i see and use the stuff"*
- *"i just dont want us to work for nothing and not get to where i actualy want"*
- *"i want two web interfaces - the tower website where everybody can test their agents, and an admin dashboard where i can choose different agentic/scrapers/bots programs to test"*
- *"they dont need to share a home"* (on splitting Tower out)
- *"i kinda dont know how we mix the detection tech, how to test the brwseruse"*

## Next action
- **Next session: the orientation interview** (one question at a time, plain language; runnable thing in
  front of him). Outputs: clearer mental model + the **repo-split decision**. Then **Chunk 2b** (browser-use
  subprocess adapter — own plan TBD), executed at/after the split decision.

## Next session should read
- Memories (auto-load): `tower-next-orientation-interview`, `tower-two-web-interfaces-idea`.
- `.superpowers/sdd/progress.md` (the Chunk-2a build ledger + final-review findings).
- `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md` (§6/§9 = browser-use / 2b).
- `tower/research/2026-06-27-00-SYNTHESIS.md` (Chunk 3+ rationale, when planning levels).

## Risks / flags
- **Push-state discrepancy:** local `origin/dev` ref = `7ce69b2`, implying Chunk-1/UI work was pushed at
  some point — **contradicts the journal's "~19 unpushed" breadcrumb.** I pushed nothing this session (the 7
  Chunk-2a commits are local). Reconciled in `active.md` to say "verify against origin before trusting the count."
- Live smoke is real-LLM / nondeterministic / costs money / needs Feather running — opt-in, honest wander/
  give_up is first-class. Keep `behavioral.ts`/`classify.ts` + the no-attach rule + drive-never-grade intact.
