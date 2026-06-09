# Session — pi chain fork→fresh + showcase E1–E3 shipped (2026-06-09 07:54)

Phase 4a (Feather v1). Desk: automation. Branch `dev` (pushed `12b96a9`, `f05453d`).

## Done
- **Triaged the "4 stumbles" → not repo defects.** Models *were* correctly pinned (verified), the
  chain *already* used template vars; #3 (~6m/task) and #4 (OpenRouter flakiness) are inherent/external.
  The headline "model self-ID unreliable" is sidestepped by reading the *recorded* model, not the prose.
- **Found the objective model-verification source.**
  `~/.pi/agent/sessions/--…feather-browser--/subagent-artifacts/<run>_<agent>_<step>_meta.json` records
  the actual `model` (+ `attemptedModels`/`modelAttempts`/cost/turns). The prose self-ID **lies** — the
  coder wrote "Claude Sonnet 4" while running `glm-5.1`. Read `meta.json`, never the badge/prose.
- **Diagnosed the real defect (an invocation-timing issue, not a config bug).** The chain died because a
  forking step (planner first, then coder) has no persisted parent history to copy when fired into a
  fresh/cold Pi session (`pi-subagents/src/shared/fork-context.ts:58`). Caught from the failed-then-working
  transcripts: the only working pattern was a **plain-English instruction** that lets the parent warm up
  and drive (it reads the chain/spec first, building the history the fork needs).
- **First E1–E3 build (messy run).** Chain coder got SIGKILL'd (exit 143) forking; parent recovered via
  individual dispatch → produced a real passing `showcase.sh`. Proved fork was the only fragile bit.
- **FIX: fork→fresh for all subagents.** coder + operator (agent files) and planner (`.pi/settings.json`
  builtin override; verified `agents.ts:459` honors it). Reviewer/validator were already fresh. A fresh
  step still receives the prior output via `{outputs.X}` template injection, so nothing is lost.
  Committed `12b96a9`, pushed.
- **Confirmation rehearsal (run `af0cfcdc`).** Clean 4-step chain, all exit 0, pinned models, **no
  exit-143, no recovery**; rails held (stub to `/tmp`, real `showcase.sh` untouched).
- **Clean E1–E3 rebuild + ship.** Reran the easy-tier build through the fork-free chain for clean
  provenance — clean 4-step chain (planner `minimax-m3` → coder `glm-5.1` → reviewer `opus-4.8` →
  validator `kimi-k2.6`, all exit 0). E1 (HN top story) / E2 (wttr.in temp) / E3 (GitHub stars, k/m
  normalized) **all PASS live**. Read the 192-line script myself: disposable headless only, honest
  PASS/PARTIAL (selector drift → PARTIAL, not sanded), medium/hard cleanly stubbed. Committed `f05453d`
  (`examples/showcase.sh` + gitignore `examples/showcase-output/*` + `.gitkeep`), pushed. Output `.txt`
  artifacts left gitignored.

## Folded prior-chat context (separate fb-stop chat — NOT pi)
- **fb-stop blog backlog** (`70bd825`): step 4 of `skills/fb-stop/SKILL.md` now reads/writes
  `blog/_pending.md` so a skipped `/stop` blog is folded into the next blog write, then cleared. Untested
  live. Does not touch the pi thread. (Its `/next` bridge archived this stop.)

## Left unfinished / NEXT
- **Stage 3** = rebuild fresh `scratch` + operator warms new sacrificial Google+IG (VPN optional) → then
  medium/hard tiers + full suite (A–D) via the now-clean chain.
- Remaining v1 gaps: act-human typing cadence + bot self-check (decide after Pass-1).
- Stale `docs/api-reference.md` (missing `chromium-headed-cdp`) — plan Task D4.
- E1–E3 narrative deferred to `blog/_pending.md` (write at a bigger milestone, e.g. full suite done).

## Decisions
- **All pi subagents run `fresh`.** The chain passes outputs via template vars; fork buys nothing for a
  determinate codegen pipeline and was the only fragile bit.
- **Model verification = `meta.json` `model` field**, authoritative over both prose self-ID and UI badge.
- **Commit E1–E3 from the clean rerun** (clean provenance), not the messy recovery run.

## Verbatim Roi
- "the last tests that worked were actual instructions prompts of what to do and pi used the skills and agents itself"
- "will it work? will making it frash make us better?"
- "am i ready to resume next session on pi with start commend?"
- "do you think we can commit E1–E3 or should we rerun them?" → "i want to rerun"
- "commit and stop"
