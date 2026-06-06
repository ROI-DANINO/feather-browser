# Core-First Reorientation + Public Demo — Design

> Status: design spec (brainstormed + approved 2026-06-05). Implementation plan to follow via
> writing-plans. Scope is documentation + one runnable demo; no `src/` feature work, no journal
> restructuring, no shell work.

## Purpose

Orient Feather professionally for a public, artifact-forward debut tied to a LinkedIn share. Promote
the "Core first, Shell later" positioning (`docs/public-positioning.md`) from public *messaging* to
the actual *work order*: make **Feather Core** legible and runnable for a stranger, and correct the
internal steering files so future sessions aim at Core readiness rather than the deferred shell.

Drivers (from the brainstorm): primarily (1) an imminent public moment — the README must read
launch-grade now — and (3) internal coherence — the tracking files must stop pointing at "build the
shell." Organic-discovery readiness comes along for free.

Audience: a LinkedIn-curious human who likes to *read and try*, a developer evaluating the artifact,
and an AI agent parsing the API. Front door is **artifact-forward** (what it is → see it work →
understand the architecture), not story-forward. The journal stays as building-in-the-open but is
*not* the headline.

## Non-Goals (YAGNI)

- No journal/process restructuring. The `journal/` stays exactly where it is and as-is. (A separate
  "skill repo for the journal + workflow" is a possible *future* project, explicitly not this one.)
- No shell-stack work (ADR-0009 / Casilda spike). Resequenced behind Core, not cancelled.
- No CONTRIBUTING guide, no `llms.txt`, no recorded GIF/asciinema, no architecture-doc rewrite. These
  are the heavier "C" layer, added later when traction pulls for them. (The demo GIF is an optional
  LinkedIn-time add-on once the script works, not a repo deliverable.)
- No `src/` feature work beyond, at most, a one-line default-port/doc reconciliation if needed.

## The Steering Decision

Phase 4 keeps its number and splits:

- **Phase 4a — Core Open-Source Readiness (now):** README, runnable demo, public roadmap split,
  doc-drift fixes. Makes Core adoptable.
- **Phase 4b — Visual Desktop Shell (after):** the shell-stack joint call and GUI, unchanged in
  substance, simply resequenced behind 4a.

No renumbering (renumbering would collide with Phase 5 = agent runtime and create churn). The two
open joint calls (cookie-isolation on `primary`; vault backend) remain parked.

## Components / Changes

### 1. `README.md` — launch-grade, artifact-forward rewrite

Restructure to lead with the artifact, not the internal changelog:

- One-liner: **"Feather is a local Chromium runtime for AI agents."** + 2–3 sentence what/why.
- **Who it's for** — Linux/Fedora local-agent developers; honest expectation-setting.
- **Quickstart** — install, `npm run dev`, then "see it work in ~60 seconds" → the demo.
- **What works today** / **What it doesn't do yet** — honest scope, lifted from the positioning doc.
- **Architecture** — short, links to `docs/architecture.md`.
- **For AI agents** — a short pointer block: the API reference is the machine-readable contract;
  base URL discovery (`endpoint.json`), auth header, response envelope in a few lines.
- The dense internal status line ("Phase 3 Complete | 182 tests…") moves down into a small
  **"Status / built in the open"** section that *links into* the journal for the curious — turning
  noise into an invitation.

Honesty fix: the current README claims the server "binds to `127.0.0.1:3000`". It does not — the
default `port` is `0` (OS-assigned) unless `FEATHER_PORT` is set, and the real address is written to
`endpoint.json` at startup. The rewrite states this correctly.

### 2. The demo — `examples/quickstart.sh` (centerpiece)

A single self-contained shell script a stranger runs after `npm run dev`:

- Discovers the base URL from `endpoint.json` and the token from the token file (paths are printed at
  startup; the script documents how to point at them — env override + sensible default).
- Hits `/health`, then runs the full loop against a stable public page (`https://example.com`):
  launch (disposable profile) → navigate → snapshot (prints title + first lines of text) → extract
  (e.g. `h1` text + canonical href) → screenshot (prints saved PNG path) → debug-bundle (prints
  manifest path) → close (`DELETE`).
- Prints each step's result human-readably; exits non-zero on any failure (`set -euo pipefail`,
  checks `ok: true`).
- Lives in a new `examples/` directory with a tiny `examples/README.md` (prereqs + one-line run).

Dependency note: uses `curl` + a JSON parse step. Prefer `jq` if the script can assume it; otherwise
a minimal `node -e` parse to avoid adding a hard `jq` dependency. Decision deferred to the plan.

### 3. `ROADMAP.md`

- Add the public **Core vs. Shell** split near the top (mirroring the positioning doc) so the public
  roadmap and the internal one tell the same story.
- Reflect the 4a → 4b sequencing.

### 4. Internal steering files

- `journal/ops/tasks.md` — swap the active track from "shell-stack joint call" to **"Core
  Open-Source Readiness"** (README rewrite, demo, roadmap split, port/doc-drift fix). Shell-stack
  drops to *next*, not deleted. Parked joint calls stay parked.
- `journal/context/active.md` — update "Now" and "Recommend next" to Core-first.
- `journal/ops/phase.md` — update the `sub_phase` pointer.

## Data Flow (demo)

```
endpoint.json ──► base URL ─┐
token file ─────► token ────┤
                            ▼
/health ─► POST /v1/sessions ─► navigate ─► snapshot ─► extract ─► screenshot ─► debug-bundle ─► DELETE
            (disposable)         (example.com)   │           │          │             │
                                                 └─ printed human-readable each step ──┘
```

The demo is read-only against a public page; no auth/cookies/persistent profile involved, so it is
safe to publish and safe to re-run.

## Testing / Verification (the real gate)

- **The demo must run green end-to-end** against a live `npm run dev`. This is the acceptance gate —
  it audits the docs (port discovery, envelope shape, field names) against reality. Not "written,"
  but "observed passing."
- Existing suite stays green: `npm test` (unit), `npm run typecheck` (exit 0). No `src/` regressions.
- All new/edited Markdown links resolve.

## Error Handling

- Demo: fail fast and loud — non-zero exit with the failing step and the server's `error.code` /
  `requestId` surfaced, so a stranger can debug. Missing `endpoint.json`/token → a clear "is the
  server running?" message.

## Risks

- **Doc/reality drift beyond the port** — the demo may surface more mismatches (field names, envelope
  edge cases). That is the demo working as intended; fix docs to match reality as found.
- **`example.com` brittleness** — minimal and stable; acceptable. If extract needs a richer page, the
  plan picks one deliberately, favoring stability over richness.

## Acceptance Criteria

1. A stranger can clone, `npm install`, `npm run dev`, run `examples/quickstart.sh`, and watch the
   full loop succeed — guided only by the README.
2. README leads with what Feather is, who it's for, how to try it, and honest limits; the internal
   changelog is demoted to a linked "built in the open" section; the `:3000` claim is corrected.
3. ROADMAP shows the Core-vs-Shell split and 4a→4b sequencing.
4. Steering files (`tasks.md`, `active.md`, `phase.md`) point at Core-first; shell-stack preserved as
   *next*; parked items intact.
5. `npm test` + typecheck green; no journal restructuring; no shell work.
