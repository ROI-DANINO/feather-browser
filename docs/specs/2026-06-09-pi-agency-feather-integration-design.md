# pi_agency ⇄ Feather Integration (thin, project-local) — Design

**Date:** 2026-06-09
**Status:** Approved (design) — implementation plan next
**Spec owner:** Roi
**Related:** `docs/specs/2026-06-09-showcase-eval-suite-plan.md`,
`docs/specs/2026-06-09-codex-handoff-pi-agency-runs-feather.md` (this replaces the *Codex-does-setup* framing:
Claude Code does the grounding instead; pi agents still run the suite).

---

## Goal

Let Roi run the Feather v1 **showcase/eval suite** with his **pi_agency** agent team (the Pi
`pi-subagents` harness) instead of with Claude Code — by giving feather-browser a **thin, project-local
`.pi/` config** that teaches Pi how to drive Feather **only inside this repo**, using **only Feather-relevant,
trusted configs**.

This is the **thin "set the ground" version**. The **heavy version** (making pi_agency a permanent,
first-class Feather-native agent runtime) is explicitly **deferred** — see *Out of scope* below.

## Why this is the right time (and what it deliberately is *not*)

- The showcase suite is the immediate next deliverable; running it with pi is the stated goal. The grounding
  is its genuine prerequisite.
- This adds **no new privilege surface**: pi agents run `curl` / `examples/showcase.sh` exactly as Claude
  Code would, and a human still watches the hard tier (warmed Google + `feather_test_roi` IG). The *runner*
  changes, not what Feather exposes. So it does **not** violate the security-first spine (Gate A / Gate B
  still gate any real privilege escalation).
- The **heavy** integration (pi_agency as Feather's official agent-runtime layer) belongs to **Phase 5e —
  Agent Runtime Surface & Ecosystem Interop**, which the roadmap deliberately sequences **last (v3)**, after
  the capability/security gates. Building it now would re-introduce the exact "high-privilege surface before
  the safety machinery" inversion the 2026-06-07 council reversal corrected.

## How Pi discovery works (verified from `pi-subagents` v0.28.0 source — do not re-derive)

The `pi-subagents` extension resolves agents/chains/skills in **two scopes**:

- **user** (laptop-global): `~/.pi/agent/agents`, `~/.agents`, `~/.pi/...`
- **project**: the nearest ancestor of `cwd` that contains a `.pi/` (or `.agents/`) dir becomes the *project
  root* (`src/agents/agents.ts:242`). From it, Pi loads:
  - agents: `<root>/.pi/agents/*.md` (`agents.ts:788`)
  - chains: `<root>/.pi/chains/*.chain.md` (`agents.ts:803`)
  - skills: `<root>/.pi/skills/<name>/SKILL.md` (`agents.ts:320`)
  - settings: `<root>/.pi/settings.json` (`agents.ts:258`)

Scope is `user | project | both`; default `both` (`agent-scope.ts`). Selecting **`project` scope excludes
the user team entirely** (`agents.ts:828-829`).

**Consequence:** a `.pi/` inside feather-browser is seen **only when `pi` is launched from inside this repo**.
It does *not* teach Pi about Feather globally. This satisfies the "Feather-only, not global" requirement
directly, and is the extension's intended, supported mechanism.

## Design — project-local `.pi/` in feather-browser

```
feather-browser/.pi/
  settings.json                  # project model pins (no secrets, no auth)
  agents/
    coder.md                     # COPIED from pi_agency, trimmed: builds examples/showcase.sh
    validator.md                 # COPIED, trimmed: runs the suite, reports PASS/PARTIAL/FAIL, never fixes
    opus-reviewer.md             # COPIED, trimmed: gates risky commits / go-no-go
    feather-operator.md          # NEW: the driver — drives Feather over the local HTTP API
  chains/
    showcase-run.chain.md        # NEW: maps showcase Phases A→B→C→D onto the roles + Roi gates
  skills/
    feather-operator/SKILL.md    # NEW, thin: pointer to docs/agent-playbook.md + skills/using-feather-browser
```

### What we copy vs. write (and why)

- **Copy (cheap, token-efficient):** `coder.md`, `validator.md`, `opus-reviewer.md` from
  `pi_agency/.pi/agents/`. These are generic role profiles worth reusing verbatim. Trim each to Feather and
  set **`inheritSkills: false`** (see Trust below). Drop the Hebrew-default communication line (Feather =
  English per `AGENTS.md`).
- **Write fresh (the Feather-specific glue only):**
  - `feather-operator.md` — the agent that actually drives Feather. `tools: read, bash, grep, find, ls`
    (needs `bash` for `curl`/the script). `inheritSkills: false`; `inheritProjectContext: true` (so it gets
    Feather's `AGENTS.md`). System prompt: golden loop + targeting rules, pointing at the project skill.
  - `showcase-run.chain.md` — the phase→role flow (below), in pi chain format (`## role`, `phase:`, `label:`,
    `as:`, body with `{task}` / `{outputs.X}`).
  - `feather-operator/SKILL.md` — ~20 lines: name/description frontmatter + a pointer to Feather's existing
    trusted operator docs (`docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`). It **reuses**
    Feather's own knowledge and **imports none of pi_agency's skills**.
  - `settings.json` — minimal: model pins matching the roles; no auth (auth stays in `~/.pi/agent/auth.json`).

### Phase → role mapping (the chain)

| Showcase phase | Role | Notes |
|---|---|---|
| A — scaffolding (codegen) | `coder` | builds `examples/showcase.sh` per the plan |
| C — per-task functions (codegen) | `coder` → `opus-reviewer` | review gates commits |
| B — Pass-1 live discovery | `feather-operator` | drives the 10 tasks live; writes the recipe log |
| D — film + docs + journal | `validator` (+ Roi films, `docs-memory` if used) | validator runs tiers, reports the table |

### Human (Roi) gates — unchanged from the plan/handoff

1. Hard-tier launch (confirm `scratch` is warm).
2. The H1 calendar-write attempt (fragile-on-purpose).
3. The Pass-1 (B4) verdict.
4. Any commit/push (pi `coder` needs Opus review + Roi approval; Feather pushes to `dev` only).

## Trust & scoping guarantees

- **No pi_agency skills imported.** We copy *agent profiles* only; the only skill present is the new thin
  Feather-operator pointer.
- **`inheritSkills: false`** on the project agents → they cannot pull the laptop-global skills
  (Hebrew/content) Roi doesn't trust for Feather.
- **Run in project scope** (or simply launch `pi` from inside feather-browser) → Feather configs are the
  active team; nothing leaks to other projects.
- **No secrets in the repo.** `auth.json` / API keys stay under `~/.pi/agent/`. The committed `.pi/` holds
  only role definitions and model-id strings.

## Decisions (settled with Roi)

- **Commit the `.pi/` dir** into feather-browser (versioned + reproducible; it's small and secret-free).
- **Commit this design spec** under `docs/specs/` (repo convention).

## Out of scope (deferred to v2/v3)

- pi_agency as Feather's **permanent / first-class agent-runtime layer** → Phase **5e** (v3, "correctly
  last"), behind Gate A/B.
- Any change to Feather's HTTP surface, MCP exposure, or new privileged endpoints.
- Editing pi_agency's global team or settings (`~/.pi/...`). This work is feather-browser-local only.

## Definition of done (for this integration)

- `feather-browser/.pi/` exists with the files above; committed to `dev`.
- Launching `pi` from inside feather-browser exposes the Feather team (coder / validator / opus-reviewer /
  feather-operator) and the `showcase-run` chain, and **not** the global Hebrew/content skills.
- `feather-operator` can: discover the Feather endpoint (`endpoint.json` → `baseUrl`/`tokenFile`), hit
  `GET /health`, launch a disposable headless session, and run one easy showcase task end to end (proves the
  loop).
- The thin skill points the driver at Feather's existing playbook (golden loop + targeting rules reachable).
- Roi confirms; the pi team then runs the full suite (showcase plan Phases A–D).
