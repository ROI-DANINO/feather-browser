# Session — Native Capabilities Router Placed At 5.0.1 (2026-06-10 ~09:50)

**Phase:** 4a — Feather v1. **Type:** product/roadmap placement decision (product desk).
**Bridge consumed:** 2 `/next` entries (08:20 native-capabilities capture, 09:28 command-layer ship),
archived at `journal/archive/next/2026-06-10/0950-stop-bundle-native-capabilities-placed.md`.

## Done

- **Verified the `CLAUDE.md → @AGENTS.md` import works** in a fresh session — the 09:28 bridge's open
  check. The agent knew the Graphify rebuild verb (`graphify update .`) cold, straight from
  auto-loaded instructions. Check closed.
- **Pull-and-process request:** confirmed local `dev` == `origin/dev` at `3cb86dc`; nothing to pull.
  The 4 modified journal files were the expected uncommitted `/next` bridge, not incoming work.
- **Native Capabilities Router placement analysis + decision (core of the session):**
  - Read both inbox notes, v1/v2 roadmaps, ADR-0010, product desk context.
  - Recommended and Roi confirmed: **anchored at Session 5.0.1 (MCP & tool-surface reconciliation),
    after Gate A** — not inside Gate A (5.0.0), not now, no spec/plan yet.
  - Rationale: (1) recorded doctrine ("NOT a Composio-style platform"; tool-surface = Phase 5.0
    input) already routes it there; (2) connectors widen the blast radius (OAuth, real-account
    writes, imported tools) — Gate A's deny-by-default machinery must exist first, otherwise we
    repeat the council-flagged sequencing mistake; (3) routing already happens for free in the
    driving agent's head until Feather becomes the MCP host — which is 5.0.1's headline question.
- **Processed the thread end-to-end:**
  - Inbox notes merged → `research/2026-06-10-native-capabilities-router.md` with the placement
    rationale at top; originals archived to `journal/raw/archive/`.
  - Pointer block added to `docs/sessions/5.0.1-mcp-tool-surface.md` (+ read-before list).
  - One-liners in `ROADMAP.md` (5.0.1 row) and `journal/ops/tasks.md` (5.0.1 item).
  - Inbox now clean except `claude_for_chrome_output/` (deliberately kept).

## Decisions

1. **Router → 5.0.1, after Gate A** (Roi confirmed via placement question).
2. **Rename: "Connector Registry"**, never "Capability Registry" — collides with ADR-0010's
   security-critical capability *grants*.
3. The **"universal web execution layer" vision sentence is a doctrine-change ADR question** for the
   5.0.1 joint call (it's broader than the recorded "sharper, not broader" positioning) — not a
   default to slide in.
4. **Docs-import / generated-connector builder = v3/5e.** Deep API research checklist (Google MCP
   auth, XMCP architecture, …) runs at build time, not earlier — early API research goes stale.
5. Blog gate: **No** → owed line appended to `blog/_pending.md` (first live use of the new gate —
   it worked as designed).

## Left unfinished / next

- **NEXT (Roi's pick): resume the observe-bug-fixes brainstorm** — confirm the 3 tentative
  approaches (Bug 1 dismiss under-report → re-observe verify; Bug 2 accname gap → descendant
  aria-label query; Bug 3 nav-click INTERNAL_ERROR → `navigated:true`), present full design
  sections, write spec, review, then writing-plans.
- Then: operator-skills rewrite to the observe loop; suite semantic-assertion layer; **v2 Gate A**.
- Optional: C4C transcripts analysis (`journal/raw/_inbox/claude_for_chrome_output/`).

## Ideas

- Browser-first recipes for Israeli portals (research doc MVP 4) need no new infra — they're
  showcase-style tasks runnable anytime with today's Feather.

## Roi quotes

- "i want you to pull the remote dev from github and process it"
- "lets do the native-capabilities placement analysis"
- Placement answer: "5.0.1, after Gate A (Recommended)"; analysis "Looks right"; next focus
  "Observe bug fixes"; blog "No".

## Files touched

- New: `research/2026-06-10-native-capabilities-router.md`, this session file.
- Moved: 2 inbox notes → `journal/raw/archive/`.
- Edited: `docs/sessions/5.0.1-mcp-tool-surface.md`, `ROADMAP.md`, `journal/ops/tasks.md`,
  `journal/context/active.md`, `journal/log.md`, `blog/_pending.md`, trackers per `/stop`.
