# Current Tasks — The Tower (PR-1 MVP build, ~halfway; next = CHUNK 2b browser-use)

Checklist only. **Plan of record → `tower/research/2026-06-27-00-SYNTHESIS.md`** (buildable plan) + PR-1
design `docs/specs/2026-06-28-tower-pr1-mvp-design.md`. Chunk-2 design
`docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md`. Decisions D1–D6 → `tower/decisions.md`.
Front door → `feather.md`; live pointer → `journal/context/active.md`; machine pointer → `journal/ops/phase.md`.
Pre-2a task history archived → `journal/ops/archive/tasks-20260629-0154.md`; pre-2b (interview-done) snapshot
→ `journal/ops/archive/tasks-20260630-0153.md`. Tower vision sharpened in the 2026-06-30 orientation interview
→ decisions **D7–D10** in `tower/decisions.md`.

**Scope (D2, locked):** an open, self-hostable, **tool-agnostic** TS/Node bench scoring ANY agentic web
tool on ALL angles (capability=gate / detectability=warmed-vs-cold signature / security) → cap/det/sec
profile → boss tower. Broad framework, NOT a niche. Build = Design B (thin TS/Node core extending `tower/`).

## NEXT SESSION (do this first)
- [x] **ORIENTATION INTERVIEW** — DONE 2026-06-30. Roi declared himself oriented; re-derived the 3 angles +
      boss tower; sharpened the design → **D7–D10** in `tower/decisions.md` + memory
      `tower-arena-imitates-sites-real-guards`. No product code (planning pass).
- [x] **REPO-SPLIT DECISION** → **D10: KEEP in feather-browser for now; re-ask Roi at the Chunk-2b boundary**
      (documented split-trigger). Code coupling already zero (HTTP-only, no `src/`).
- [x] **D10 SPLIT RE-ASK — answered 2026-07-01:** Roi chose **stay in feather-browser**; Python isolated
      under `tower/adapters/browser-use/` with its own `requirements.txt` (dep seam, not a separate build).
      Also chose scope: **2b, then roll into Chunk 3 if green** (autonomous run).
- [ ] **CHUNK 2b — `adapter.browser-use`** — IN PROGRESS 2026-07-01, branch `tower-browser-use-adapter`.
      Gapped tasks (autonomous run; spec §6/§9 of chunk-2 design):
      - [x] 2b.0 Research DONE: local venv probe (browser-use **0.13.1 installs+imports on Python
            3.14.5**) + 46-agent web workflow (40/41 claims survived refutation). Verbatim →
            `tower/research/2026-07-01-browser-use-api-{groundtruth,web-synthesis}.md` + `raw/` receipts.
      - [x] 2b.1 Plan doc `docs/plans/2026-07-01-tower-pr1-chunk2b-browser-use.md` (committed `9b8c8a0`).
      - [x] 2b.2 `tower/core/adapters/browser-use.ts` + 16 mocked tests (fake child process, fake timers;
            reviews READY). Injectable `spawnImpl`; last-parseable-result-line; SIGKILL wall-clock timeout.
      - [x] 2b.3 `shim.py` + `requirements.txt` (pin 0.13.1) + README (venv + uvx-playwright provisioning).
            Review WITH-FIXES applied + post-hoc synthesis corrections (`enable_signal_handler=False`,
            maxSteps default aligned 25, telemetry setdefault).
      - [x] 2b.4 `tower/smoke/browser-use.ts` + `npm run tower:smoke:browser-use` (opt-in live, NOT CI).
      - [x] 2b.5 Venv protocol probes vs the REAL package PASSED (no API key spent): malformed stdin /
            missing key / full-stack run to the auth boundary — **real headless browser launched**, stdout
            stayed protocol-pure, exit 1 with honest reason. Build committed `689d18b`; **571 green**.
      - [ ] 2b.6 Final whole-branch review (rd-verify, running) + fix loop → merge FF to `dev` → push.
      **Blocks (honest, deferred to Roi):** live `tower:smoke:browser-use` run; live `tower:smoke:feather`
      run (still owed from 2a).

## DONE — Tower PR-1 build so far
- [x] **Chunk 1 — engine + website skeleton** (merged): `tower/core/` types/verdict(PARTIAL invariant)/
      timing/store(tolerant JSONL)/stubs/runner(stop-on-first-non-WIN, Grade-validated)/server(health/sink/
      placeholder) + `tower/serve.ts` + `npm run tower:serve`.
- [x] **UI slice — render-the-run** (merged): `tower/core/render.ts` (`renderRun`, 4 outcome chips,
      AI-placeholder slot every card, escaping, empty state) + `GET /` + `resultsFile` dep.
- [x] **Chunk 2a — `adapter.feather`** (merged 2026-06-29, commits `fccde32..94ce173`, LOCAL, 555 green):
      Feather + Tower-owned minimal Claude brain. `agent/action.ts` (4-verb vocab) + `agent/brain.ts`
      (`driveToGoal`, step + wall-clock budget) + `agent/decide-claude.ts` (Claude forced tool-use;
      `@anthropic-ai/sdk@^0.106.0` root; default `claude-opus-4-8`) + `adapters/feather-client.ts` (HTTP-only)
      + `adapters/feather.ts` (drive-never-grade, `finally`-close) + `smoke/feather.ts` +
      `npm run tower:smoke:feather` (opt-in live, not CI). Honesty props intact (no `src/`, no-attach,
      `Adapter` unchanged, brain Tower-owned). Final review WITH-FIXES → all 3 fixed (createSession profile
      body + its test + the wall-clock timeout). Live smoke run deferred to Roi (needs Feather up + API key).

## THEN — remaining PR-1 chunks (each its own plan when reached)
- [ ] **Chunk 2b — `adapter.browser-use`:** real browser-use framework as a Python subprocess
      (`tower/adapters/browser-use/shim.py` + `requirements.txt` + `tower/core/adapters/browser-use.ts`,
      stdin/stdout JSON protocol, mocked unit tests + `tower:smoke:browser-use`). Spec §6/§9. Own plan TBD.
      **Tie to the repo-split decision** (this is the split-trigger boundary).
- [x] **Chunk 3 — real levels: DONE 2026-07-02** (merged to `dev` @ `32ca437`, pushed; **190 tower tests green**).
      Design → `docs/specs/2026-07-02-tower-pr1-chunk3-levels-design.md` (29-agent research).
      - [x] **3a — detectability + sink registry** (merged `c270a21`): `sink-registry.ts` (arm/record/
            awaitReport state machine) + `server.ts` wiring (text/plain beacon parser, page plugin) +
            `detector.js` (vendored rebrowser probe, dual transport) + `page.ts` (nonce HTML-escaped) +
            `level.ts` (arm-before-drive, grade() awaits report → ok/gated/blocked/error). 119 tests.
      - [x] **3b — security + trial runner** (merged `32ca437`): `trials.ts` (runTrials + collapseAnyOfK
            any-of-k) + `victim-app.ts` (WASP template, per-nonce 256-bit canary never in /thread) +
            `hooks.ts` (**two-tier honesty fix**: canary/execution-marker=blocked; content-agnostic
            state-diff/attempt=gated, so an honest double-poster is never falsely "owned") + `level.ts`
            factory + `asr-ci.ts` (exact Clopper-Pearson, validated vs reference intervals) +
            `SECURITY-TESTING-POLICY.md` + results.md inverted-`blocked` legend. Workflow crashed at step 4;
            steps 4–5 + review hand-completed; rd-verify WITH-FIXES → all applied.
      **REMAINING (deferred to Roi — need a real environment, do NOT block the build):**
      - [ ] **Calibration gate (3a §5.5):** live probe vs browser-use 0.13.1's Chromium — does the classic
            `Error.stack` trick still fire, or did V8's 2025 getter-guard kill it? Fill `VENDORED.md`'s
            placeholder; `count===0 → 'ok'` is provisional until proven (ship `gated` if dead).
      - [ ] **Paid live smokes:** `tower:smoke:browser-use` (+ still-owed `tower:smoke:feather`).
      **Deferred to the level-design session AFTER Chunk 3:** D7 shared-task-pool unification, D8 difficulty ladder.
- [ ] **Chunk 4 — scoring + AI report + real site:** LPR→ASS(cap stubbed)→BTS → `RunRecord` with
      Clopper-Pearson CI (overlapping → `tie`); cap/det/sec profile as **small-multiples/parallel-coords
      with CI bands (NOT a radar polygon)** + the polished website; AI paragraph per level (explains, never scores).
- [ ] **Build sequence after PR-1:** PR-2 (passive JA3 tap + real capability gate + nodriver differential
      guard) → PR-3 (warmed-vs-cold signature harness) → PR-4+ breadth.

## Housekeeping
- [x] **Push-state: IN SYNC** (pushed 2026-06-29). `dev`==`origin/dev`==`5317da2`; Chunk 2a + all prior
      Tower work is public. Roi: **"make Tower public until we split it"** → default is push-as-you-go.

## Parked (not deleted)
- [ ] **GPU/WebGL static-fingerprint detectability angle (owed follow-up)** — belongs in the breadth phase
      (PR-4+) as an absolute static level that varies per tool. Source: `journal/raw/archive/2026-06-27-bot-detection-signals-research.md` (Q3).
- [ ] **Prior gym thread:** retry a real motion score when `abs.incolumitas` recovers; fable-evals scoreboard wire.
- [ ] **Real-account 2FA take** — prove the Resume banner survives a real 2FA challenge page (needs Roi driving).
- [ ] **(Roi, outside repo)** rotate/abandon the leaked `roionly9` throwaway account.
- [ ] **`decide-claude` cheap-mode follow-up** — add `output_config: { effort: "low" }` if live-smoke cost/latency is high.
