# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **SIDE-TASK (2026-06-09 07:49, not pi): fb-stop blog backlog.** A skipped `/stop` blog is no longer
  lost — step 4 of `skills/fb-stop/SKILL.md` now reads/writes `blog/_pending.md`, folds owed sessions into
  the next blog write, then clears it. Commit `70bd825` (SKILL.md + `blog/_pending.md` only). Untested live.
  Does **not** change the pi thread below — Stage 3 is still the real next action.
- **NOW (2026-06-09 ~08:17): Stage 3 ATTEMPTED, STALLED at Google birthday dropdowns.** Scratch profile
  wiped clean → fresh headed scratch launched (`ses_fc3cb48427`) → Google signup name step PASS
  ("Feather Dev" typed, Next clicked) → birthday/gender step FAIL. Root cause: Google's Material
  Design custom `role=listbox` web components resist all Playwright approaches (select-option,
  click, press Enter/Space). Subagent `feather.operator` dispatch also returned `Failed`. **No commits.**
  **NEXT:** read `docs/agent-playbook.md` for full API (especially JS evaluate endpoint?) → try
  keyboard-driven dropdown (Tab+Space → type letter → arrow → Enter) → complete Google signup → IG.
  Roi stopped me before the correct approach (I tried existing warmed profile first — reverted).
  Session record: `journal/ops/sessions/stage3-warming-sacrificial-accounts-20260609-0817.md`.
- **PRIOR (2026-06-09): pi_agency ⇄ Feather integration — Stage 2 PASS.** OpenRouter model lineup set per
  role (committed `f873667`; orchestrator→`qwen3.7-max` tweak still uncommitted): parent `qwen3.7-max`,
  planner `minimax-m3`, coder `glm-5.1`, operator `glm-5-turbo`→`glm-5.1`, validator `kimi-k2.6`,
  reviewer `opus-4.8`. Trust accepted; project-scope team lists clean. **Operator golden loop PROVEN**
  end-to-end (health→session→navigate→snapshot(markdown)→wait→screenshot→close), real 17.5KB screenshot.
  Feather runtime solid. `.pi/` model edits + thin-skill polish uncommitted.
- **RESOLVED (was the headline): skills "wall".** Subagents ARE walled by `inheritSkills:false` + `skills:`
  allowlist (Pi injects only those). The "all global skills appear" = the PARENT session's catalog, which is
  global by design and unfixable per-project (no subtract) — cosmetic, never reaches the walled subagents.
- **Subagent vs skill clarified:** dispatching a subagent is a parent CHOICE (a tool call it can shortcut).
  Solo "drive Feather" tasks → the `feather-operator` SKILL is enough (parent drives inline; proven). The
  showcase suite → the `showcase-run` CHAIN forces per-model coder/reviewer/validator dispatch (no shortcut).
- **Chain dry-run PASSED** (`/run-chain feather.showcase-run`): 4-step multi-model dispatch proven (planner
  minimax-m3 confirmed via UI → coder → reviewer → validator, 6m20s, no commits). Coder left a clean
  116-line `examples/showcase.sh` seed (kept). 4 caveats to fix → see closeout.
- **STOPPED 2026-06-09 ~08:17 (no /stop done). NEXT = retry Stage 3 with the right approach.** Same
  goal — rebuild fresh `scratch` + warm sacrificial Google+IG — but now with a specific blocker: the
  Google birthday Material Design dropdown. Three theories for next attempt (see session record).
  Remaining v1 gaps: act-human cadence + bot self-check (decide after Pass-1). Deferred: task-intake
  format + `feather-journal` skill; E1–E3 blog beat parked in `blog/_pending.md`.
- **Current phase:** Phase 4a — framed for humans as **Feather v1** ("It runs errands for me").
- **v1 Instagram test — DONE (2026-06-08, this session).** Account created (`feather_test_roi`),
  Gmail confirmation retrieved from spam, social errand complete (liked @shaked_golan1's latest post +
  posted comment "Sinai looks unreal bro absolute king"). All over the local HTTP API. **v1 is proven.**
  Session closeout: `journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md`.
  Blog entry: `blog/0013-the-test-that-passed.md`.
- **4a.8 + deferred fixes DONE (2026-06-09, this session).** Markdown snapshot built (DOM walker,
  zero deps, 20k cap); `select-option` command added; resume-confirmation linger; disposable
  `ENOTEMPTY` cleanup race fixed; `extract` multi-match behavior tested. 9 commits + a docs/skills
  commit (`0c0e7ee`), all pushed to origin/dev. 240/241 tests (1 pre-existing flake).
- **Agent operator layer DONE:** `docs/agent-playbook.md` + 4 skills
  (`skills/using-feather-browser` + form-filling/human-handoff/data-extraction) + AGENTS.md pointer.
- **Showcase/eval suite REVIEWED + APPROVED + PLANNED (2026-06-09, this session).** Spec revised into a
  **stress-and-learn instrument** (`PARTIAL`+lesson first-class; proof split headed→film/headless→artifact;
  M1 hard-path-first; H1 fragile calendar-write on purpose; E3 suffix-parse). Full implementation plan
  written → `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (Phases A–D, grounded in real API source).
  Recorder = `wf-recorder` (installed). Committed `8a040b5` (spec+AGENTS) ; plan + Codex handoff committed at
  this `/stop`.
- **Testing Honesty is now repo law:** root `AGENTS.md` § "Testing Honesty — Objective, Not Flattering" +
  memory `feedback_testing_honesty`. (Test for truth, not green checkmarks; never go easy to please.)
- **EXECUTION PIVOT:** the suite will be **run by Roi's pi_agency agent team** (Pi harness), with the setup
  ("set the ground") done via **Codex** — NOT by Claude Code. Brief:
  `docs/specs/2026-06-09-codex-handoff-pi-agency-runs-feather.md`.
- **NEXT = Roi sets up pi_agency-runs-Feather with Codex → pi team runs the suite (Phases A–D).** Claude Code
  resumes only to tweak the plan/handoff or reconcile results. Remaining v1 gaps (act-human cadence, bot
  self-check) decided after the Pass-1 verdict (plan Task B4). Plan flags: fix stale `api-reference.md`
  (missing `chromium-headed-cdp`, Task D4); spec's `jq` claim was wrong (use node).

## Key facts for next session

- **Scratch profile** (`workspaceId: scratch`) has `feather_test_roi` IG account + warmed
  `roionly9@gmail.com` Google session. Handle carefully — this is the test identity.
- **Server lifecycle:** kill by pid from `endpoint.json`; read baseUrl with
  `grep -o '"baseUrl": *"[^"]*"'`; start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows.
- **IG input quirk:** confirmation code input ignores `fill` + `type` modes. Use Shift+Tab +
  individual `press` keypresses. Filed under things to watch for.
- **Spam first** for email confirmation codes — learned this session; saved to memory.
- **Tab API:** `POST /tabs` creates blank page; must follow with explicit `/navigate`.
- `continuity.test.ts` is a pre-existing flake — ignore it.

## Recent completed context

- **v1 Instagram test DONE (2026-06-08):** full signup + email verify + social errand. PASS.
- **Pause-for-human primitive DONE (2026-06-08, `dev` 5d7a9b8):** `await-human` + on-page Resume
  banner (DOM-flag/CDP-poll). Live-tested with Roi. Specs `docs/specs/2026-06-08-pause-for-human-*`.
  Finding: banner dies on page navigation → v2 MFA Handler must re-inject on `framenavigated`.
- **v1→v2→v3 restructure + open-source doctrine (2026-06-08):** `feather.md`,
  `docs/roadmap/{v1,v2,v3}.md`, `adr-0011`; ROADMAP is now the execution engine-room index.
- **4a.9 DONE:** hero demo recorded (28s, 1.25x), in README, pushed.
