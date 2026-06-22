# Feather v2 — Wrap (Security Foundations) · 2026-06-16

**Scope honesty first.** This is **not** a v1-style, test-driven wrap. v2 — *"It survives the
scary sites, safely"* (`docs/roadmap/v2.md:1`) — is **not** a finished, testable release. Its
exit test (create Feather's **own LinkedIn account** and operate it un-flagged,
`docs/roadmap/v2.md:59-60`) **does not exist yet**, so there are no live v2 task runs to
forensically analyze the way `docs/v1_wrap/` analyzed v1's 10-task showcase.

What *is* wrappable — and what this directory holds — is a **code-and-decision retrospective of
the v2 security foundations shipped to date**: Phase 5.0 (Gate A capability model) and Phase 5a
(Identity Model), plus the safety primitives and architectural decisions that frame v2. Every
claim is grounded in `file:line` / commit evidence. Nothing is rounded up. Where a number is
journal-reported rather than re-verified this session, it says so.

## Contents

| File | What it is |
|------|------------|
| `META-ANALYSIS.md` | The retrospective: v2 in one line + the exit test, the **status ledger** (proven / shipped-untested / planned / unstarted), the **honest nuances** behind every "proven", the **distance to the exit test**, and the **ranked forward items**. |
| `SECURITY-SURFACE.md` | Inventory of the security contracts now **stable for v2** — transport hardening, the capability model, Identity, the human-in-control safety primitives — each with code pointers and test coverage. |
| `raw/` | Gitignored working notes (house pattern; nothing load-bearing lives here). |

## How this wrap was produced

- A 5-agent read-only evidence sweep over `docs/roadmap/`, `journal/`, `docs/specs/`, and `src/`
  (one agent per area: Gate A · Identity 5a · v2 scope/gap · decisions+risks · v1_wrap precedent),
  each returning cited, honesty-flagged evidence packs.
- A **deterministic gate re-run this session** (2026-06-16) against `v2-wrap @ 77abccb`:
  `tsc --noEmit` clean; `vitest` unit suite **399 passed / 399** across 62 files. These two
  numbers are independently verified here — not taken from the journal.
- Integration counts (Gate A 7i, identity 4/4, full 96/96, await-human 9/9) are **journal/commit
  reported and NOT re-run this session** (they need a headed browser and carry a known niri red).
  They are labelled as such throughout.
- An adversarial verify pass cross-checked the written claims against code and journal before this
  was offered for review.

## If you're here to start 5b (MFA — the unblocked next build)

Read, in order: `docs/specs/2026-06-07-mfa-handler-design.md` → `docs/specs/2026-06-07-mfa-handler-plan.md`
(14 TDD tasks) → `docs/specs/adr-0010-local-control-plane-capability-model.md` (the capability spine
MFA consumes) → `SECURITY-SURFACE.md` §2 (the **session-hold primitive** MFA plugs into, already
shipped in Gate A). The MFA handler creates an `mfa` hold rather than touching stealth — that
dependency break is what lets Stealth move to last (see `META-ANALYSIS.md` §5).
