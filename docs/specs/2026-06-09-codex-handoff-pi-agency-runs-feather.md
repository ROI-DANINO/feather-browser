# Handoff for Codex — Wire pi_agency to run the Feather Showcase Suite

**Date:** 2026-06-09
**Audience:** Codex (setup/grounding work), not Claude Code. After setup, the **pi_agency** agent team runs the suite.
**Status:** Setup brief — ground the integration, apply the plan tweaks below, then hand to the pi team.

---

## TL;DR

Roi wants the **Feather v1 showcase/eval suite** run by his **pi_agency** agentic team (Pi harness), not by Claude Code. Two repos are involved:

- **`~/Desktop/Projects/feather-browser`** — the browser runtime + the approved showcase **spec** and **plan** (below). The suite is API-driven (curl over localhost).
- **`~/Desktop/Projects/pi_agency`** — the Pi-native agent team (`roi-chief` orchestrator + `coder`/`researcher`/`validator`/`opus-reviewer`/`docs-memory`/`cheap-worker`, chains, `roi-agent-operations` skill).

**Codex's job (this handoff):** set the ground so pi agents can drive Feather and execute the plan — then leave the actual suite run to the pi team. Roi will do the setup with Codex; the full test run he wants done by the pi agents.

**Read first:**
- `docs/specs/2026-06-09-showcase-eval-suite-design.md` (the approved spec — what/why)
- `docs/specs/2026-06-09-showcase-eval-suite-plan.md` (the implementation plan — Phases A–D, exact API recipes)
- `feather-browser/AGENTS.md` → "Driving Feather (operator skills)" + "Testing Honesty"
- `feather-browser/docs/agent-playbook.md` + `feather-browser/skills/using-feather-browser/SKILL.md`
- `pi_agency/AGENTS.md`, `pi_agency/.pi/agents/*.md`, `pi_agency/.pi/chains/*.md`

---

## What's already true (verified 2026-06-09 — don't re-derive)

**Feather side:**
- HTTP API over localhost; discover `baseUrl` + `tokenFile` from `endpoint.json`; auth via `X-Feather-Token` header; envelope `{ ok, requestId, data|error }`. Full contract in `docs/api-reference.md` (note: that file is **stale** — missing `chromium-headed-cdp`; plan Task D4 fixes it).
- Operator knowledge already exists: `docs/agent-playbook.md` (full reference) + 4 skills under `skills/` (`using-feather-browser` entry + form-filling/human-handoff/data-extraction).
- The plan's API recipes are grounded in real source (`src/transport/routes.ts`, `src/sessions/manager.ts`, `src/browser/modes.ts`), including the warmed-headed launch `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp"}`.
- Prereqs for the **hard tier**: Feather server must be started from a shell with `WAYLAND_DISPLAY`/`DISPLAY` (headed windows), and the `scratch` workspace must hold the warmed Google + `feather_test_roi` Instagram sessions. These run on the local desktop host.

**pi_agency side:**
- Agents have `bash` (coder: read/write/edit/bash/grep/find/ls; validator: read/bash/grep/find/ls) → **they can run `curl`/`./examples/showcase.sh` directly. No HTTP bridge is needed.**
- `coder` already runs on **`openai-codex/gpt-5.5`** (so Codex is the natural builder); `validator` runs commands and reports exact results without editing — ideal for running the suite and reporting PASS/PARTIAL/FAIL.
- `coder`/most agents have `inheritProjectContext: true` and (coder) `inheritSkills: true`.
- pi uses **Pi-native** slash commands/chains, **not** Claude Code commands. Existing chains: `.pi/chains/read-only-plan.chain.md`, `.pi/chains/implementation-review-validation.chain.md`.

---

## Setup tasks for Codex ("set the ground")

> Keep Roi in control of installs/config (per both repos' AGENTS.md). Prefer project-local files. MVP first.

1. **Decide the cross-repo working arrangement.** The suite artifacts (`examples/showcase.sh`, `examples/showcase-output/`, the Pass-1 recipe log) live in **feather-browser**. Recommended: run the pi team with **feather-browser as the project context/cwd** so `coder` builds into the right repo and `inheritProjectContext`/`inheritSkills` pick up Feather's operator skills. Confirm how the Pi harness sets project context/cwd and document the exact invocation.

2. **Expose Feather's operator knowledge to the pi agents.** Make `skills/using-feather-browser` (+ the 3 workflow skills) and `docs/agent-playbook.md` available to the driving agent. Pick a mechanism: (a) run with feather-browser as project so skills inherit, or (b) add a thin `roi-agent-operations` reference/skill in pi that points at the playbook path. Verify the operator agent actually sees the golden loop + targeting rules.

3. **Confirm Feather endpoint/token discovery from a pi agent.** Have a pi agent (validator) run the `endpoint.json` discovery block from `examples/quickstart.sh` and a `GET /health` to prove it can reach a running Feather. Document the one-liner.

4. **Map the plan's phases onto the pi team** (this is the core wiring). Suggested assignment — adjust to the team's real strengths:
   - **Phase A (scaffolding) + Phase C (per-task functions):** `coder` (Codex) builds `examples/showcase.sh` per the plan; `opus-reviewer` reviews; commits gated on Roi.
   - **Phase B (Pass-1 live discovery):** a **driving/operator agent** runs the 10 tasks against live/warmed Feather and writes the recipe log. In the Claude-Code plan this was "interactive, not a subagent" — in the **pi context a dedicated operator agent IS the driver**; keep Roi as the gate-keeper at the hard-tier and at the Pass-1 verdict (B4). The driver needs `bash` + the operator skill + a host with display + warm `scratch`.
   - **Phase D (film + docs + journal):** `validator` runs the final tiers and reports the results table; Roi films the headed tier with `wf-recorder`; `docs-memory` reconciles the journal.
   Encode this as a pi **chain** (e.g. extend `implementation-review-validation.chain.md`, or a new `showcase-run.chain.md`).

5. **Apply the plan tweaks below** to the plan (or as a pi-context addendum) so the pi team isn't tripped up by Claude-Code-isms.

---

## Plan tweaks for the pi context (apply during setup — leave the originals intact, add a "pi-context" note)

These are the deltas between the plan-as-written (assumes Claude Code) and the pi-team execution:

- **Replace Claude Code skill references with pi equivalents.** The plan cites `superpowers:subagent-driven-development`, `executing-plans`, `systematic-debugging`, `writing-plans`. In pi, use the `.pi/chains/*` + agent roles instead. Specifically: "debug with systematic-debugging" → route to `coder` with a debug brief; "subagent per task" → pi subagent delegation via `roi-chief`.
- **Phase B framing:** the plan's "INTERACTIVE — NOT a subagent" warning refers to **Claude Code** subagents (which run headless/cold). In pi, the **operator agent** is the intended driver; keep human checkpoints at: (a) hard-tier launch (confirm `scratch` warm), (b) the H1 calendar-write attempt, (c) the B4 verdict. Roi watches the headed window.
- **Honor "Testing Honesty" (feather-browser/AGENTS.md):** pi agents must report PASS/**PARTIAL**/FAIL exactly, with the recorded lesson. `PARTIAL` (e.g. M1 normal-DDG blocked → html fallback; H1 calendar-write fails → holiday-screenshot baseline) is a **successful** test, not a failure to route around. The `validator` agent's "report exact results, never fix" posture fits this perfectly — do not let an agent sand a fragile task into an easy one to get a green row.
- **Commit discipline:** feather-browser pushes to `dev` only (not `master`) unless Roi calls a milestone. pi's `coder` must not commit without Opus review + Roi approval. Reconcile these — Roi approves the commits/push.
- **Host constraints unchanged:** the agent that drives the **hard tier** must run on the local desktop host (display + warmed `scratch`), not a remote/headless runner. Easy/medium tiers are headless and host-agnostic.
- **No `jq`:** the script uses node (matches `quickstart.sh`); don't let an agent reintroduce a `jq` dependency.

---

## Definition of done for the setup (then hand to pi team)

- A pi agent can: discover the Feather endpoint, hit `/health`, launch a disposable headless session, and run one easy task end-to-end (proves the loop).
- The operator skill/playbook is reachable by the driving agent.
- A pi chain encodes the A→B→C→D flow with the role assignments + Roi gates above.
- The plan tweaks are recorded (addendum or inline pi-context notes).
- Roi confirms; the **pi team then executes the full suite** (Phases A–D), producing `examples/showcase.sh`, the recipe log, `results.md`, artifacts, and the `wf-recorder` film of the hard tier.

---

## Pointers
- Feather showcase spec: `docs/specs/2026-06-09-showcase-eval-suite-design.md`
- Feather showcase plan: `docs/specs/2026-06-09-showcase-eval-suite-plan.md`
- Feather operator layer: `docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`
- Feather API: `docs/api-reference.md` (+ stale-mode caveat above)
- pi team: `pi_agency/.pi/agents/*.md`, `pi_agency/.pi/chains/*.md`, `pi_agency/docs/specs/agent-team-design.md`
