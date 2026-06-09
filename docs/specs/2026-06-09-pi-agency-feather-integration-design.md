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
the user team entirely** (`agents.ts:828-829`). Scope is selectable **explicitly** in two places:
- at **create** time: `config.scope: "project"` (`schemas.ts:253`) → writes the file into `<root>/.pi/...`
- at **run** time: `agentScope: "project"` on the subagents tool (`schemas.ts:271`)

An agent can be given an **explicit skill allowlist** via a `skills:` field (comma-separated;
`schemas.ts:253`, parsed `agent-management.ts:261-264`); with `inheritSkills:false` the agent resolves
**only** those listed skills.

**Consequence:** a `.pi/` inside feather-browser is seen only when `pi` runs inside this repo — but the
implementation does **not** rely on cwd as the isolation guarantee. The plan **forces project scope
explicitly** (create with `scope:project`, run with `agentScope:project`) so the Feather team/chains are the
active set regardless of how Pi is launched. This is the extension's intended, supported mechanism.

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
    (needs `bash` for `curl`/the script). `inheritSkills: false` **and** `skills: feather-operator` (explicit
    allowlist); `inheritProjectContext: true` (so it gets Feather's `AGENTS.md`). Created with
    `scope:project`. System prompt: golden loop + targeting rules, pointing at the project skill.
  - `showcase-run.chain.md` — the phase→role flow (below), in pi chain format (`## role`, `phase:`, `label:`,
    `as:`, body with `{task}` / `{outputs.X}`).
  - `feather-operator/SKILL.md` — ~20 lines: name/description frontmatter + a pointer to Feather's existing
    trusted operator docs (`docs/agent-playbook.md`, `skills/using-feather-browser/SKILL.md`). It **reuses**
    Feather's own knowledge and **imports none of pi_agency's skills**.
  - `settings.json` — minimal: model pins matching the roles; no auth (auth stays in `~/.pi/agent/auth.json`).

### Phase → role mapping (the chain)

| Showcase phase | Role | Notes |
|---|---|---|
| Pre-suite — sacrificial account setup | `feather-operator` | first autonomous op: create/warm new Google + IG into a fresh `scratch` (Roi gate; VPN/proxy on) |
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

- **Project scope is forced, not assumed.** Agents/chains are created with `scope:project` and run with
  `agentScope:project`. The Feather team is the active set regardless of launch directory — cwd is a
  convenience, not the wall.
- **Skills are an explicit project-local allowlist, not inheritance.** Each project agent sets
  `inheritSkills:false` **and** lists only `skills: feather-operator` (the thin project skill). With
  `inheritSkills:false` the agent resolves *only* the allowlisted skill. To keep that airtight, the project
  `.pi/settings.json` lists **no** `skills`, and **no** skill-bearing project packages are installed under
  `.pi/npm` — so the *only* resolvable skill in this project is `.pi/skills/feather-operator`.
- **No pi_agency / global skills reachable.** We copy *agent profiles* only; no pi_agency skill is imported,
  and the laptop-global Hebrew/content skills are out of scope by the above.
- **No secrets in the repo.** `auth.json` / API keys stay under `~/.pi/agent/`. The committed `.pi/` holds
  only role definitions and model-id strings.

## Sacrificial scratch identities, pre-suite setup, and privacy

The live/hard tier intentionally touches logged-in sessions and probes failure/blocking boundaries — that is
the point, and the plan must **not** over-sanitize it. But it must run against **dedicated sacrificial
accounts**, not Roi's existing warmed profile.

- **Keep the workspace name `scratch`, but rebuild it fresh.** Before the full suite, the existing `scratch`
  profile dir is cleared/recreated so the hard tier runs against brand-new throwaway accounts (the prior
  `feather_test_roi` / warmed Google are *not* reused).
- **Pre-suite setup task (the first autonomous Feather operation).** Before the eval suite, the
  `feather-operator` agent creates and warms a **new Google account** and a **new Instagram account** that
  look normal / non-bot-like (human-plausible cadence, realistic warm-up browsing), then registers them as
  the `scratch` identities (`markWarm`). This is itself a real boundary test — account creation commonly
  hits phone/SMS/again-later walls — so it carries a **Roi human gate** (he may need to help clear an SMS or
  CAPTCHA) and honest `PASS/PARTIAL/FAIL` reporting per Testing Honesty.
- **Privacy preference (practical, not a hard requirement):** route the sacrificial Google/IG setup through
  a **VPN/proxy** so the new `scratch` profile is less easily associated with Roi's home IP / personal
  identity cluster. Feather exposes a per-session `proxy` on `POST /v1/sessions` (`routes.ts:32`:
  server/username/password/bypass), so the setup session can carry the proxy directly; a system-level VPN is
  an equivalent fallback. Treated as a default-on convenience for the setup, not a security architecture
  change.

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
- Running with `agentScope:project` exposes the Feather team (coder / validator / opus-reviewer /
  feather-operator) and the `showcase-run` chain, and resolves **only** the `feather-operator` skill — no
  pi_agency / global Hebrew/content skill is reachable (verified by listing resolvable skills).
- `feather-operator` can: discover the Feather endpoint (`endpoint.json` → `baseUrl`/`tokenFile`), hit
  `GET /health`, launch a disposable headless session, and run one easy showcase task end to end (proves the
  loop).
- The thin skill points the driver at Feather's existing playbook (golden loop + targeting rules reachable).
- A **fresh `scratch`** profile exists holding **new sacrificial** Google + Instagram accounts (created via
  the pre-suite operator task, VPN/proxy on); the old warmed accounts are not reused.
- Roi confirms; the pi team then runs the full suite (showcase plan Phases A–D).
