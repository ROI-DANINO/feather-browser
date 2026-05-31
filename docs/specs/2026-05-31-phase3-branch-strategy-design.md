# Phase 3 Branch Strategy & Stabilization — Design Spec

**Date:** 2026-05-31  
**Status:** Approved  
**Scope:** Establish branch hierarchy, merge unreviewed AI branches, fix 5 critical bugs, write AGENTS.md, set up ui-playground sandbox.

---

## 1. Branch Hierarchy

```
master          ← stable source of truth, never broken
  └─ dev        ← all Phase 3 active work lands here first
       └─ ui-playground  ← headed browser sandbox, one-way branch
```

**Three rules enforced at all times:**

1. Nothing lands on `master` without first living on `dev` and passing tests.
2. Future Claude sessions and AI-generated branches target `dev`, never `master` directly.
3. `ui-playground` is one-way. Experiments that graduate get cherry-picked or re-implemented on `dev` — `ui-playground` never gets a direct merge to `master`.

---

## 2. Merge Plan for Unmerged Branches

Two remote branches exist from a prior Claude session:
- `claude/phase-3-roadmap-analysis-j5eUo` — interface extraction, lifecycle logging, ROADMAP/PROGRESS updates
- `claude/branch-commit-info-p51r8` — superset of the above, adds `docs/tech-stack-guidelines.md` and `docs/tech-stack-analysis-report.md`

**Action:** Merge only `claude/branch-commit-info-p51r8` into `dev`. It is the strict superset — one merge gets everything. Merging the roadmap-analysis branch separately would be redundant.

**After merge:** Delete both remote branches. Their work lives on `dev`.

**Commit strategy:** Keep commits as-is (no squash). The audit trail is worth preserving — the tech-stack-analysis-report references specific commit SHAs.

---

## 3. Critical Bug Fixes on `dev`

Five bugs identified in `docs/tech-stack-analysis-report.md`. Each gets its own commit. No architectural changes — all fixes are localized.

### Fixes with no research gate

| # | File | Fix |
|---|------|-----|
| 1 | `src/transport/middleware.ts:17-18` | Add `return` after `reply.status(401).send(...)` — handler execution must stop after auth rejection |
| 4 | `src/sessions/lock.ts` | Replace read-then-write with `fs.open` + `wx` flag for atomic lock creation |
| 5 | `src/sessions/manager.ts` | Swap order: run profile cleanup **before** `registry.delete(sessionId)` so a failed cleanup leaves a registry record |

### Fixes requiring research first

| # | File | Research needed | Fix |
|---|------|----------------|-----|
| 2 | `src/snapshot.ts` | Read file to understand current `new Function()` usage; check Playwright `.evaluate()` pattern for this specific case | Replace `new Function()` with a Playwright `.evaluate()` arrow function |
| 3 | `src/sessions/manager.ts` | Check current Playwright docs for `context.close()` behavior; verify correct `Promise.race()` timeout pattern and kill behavior | Wrap `context.close()` with a timeout — force-kill if it hangs |

**After all five fixes:** Run the full test suite. All 129 tests must pass before proceeding.

---

## 4. AGENTS.md

**Location:** `/AGENTS.md` (root, uppercase — picked up automatically by Claude and compatible AI tools)  
**Length:** ~80-100 lines  
**Style:** Thin constitution. Points to existing docs rather than duplicating them.

### Sections

1. **Project identity** — one paragraph: Feather Browser is a minimalist browser-first project. It is not an agent platform yet.
2. **Current phase** — Phase 3 scope in ~5 lines. Pointers to `docs/specs/phase-3-browser-stability-first-brief.md` and `PROGRESS.md`.
3. **Branch rules** — the master/dev/ui-playground hierarchy and the "nothing lands on master unreviewed" rule.
4. **Tech stack** — pointer to `docs/tech-stack-guidelines.md`. One hard rule stated inline: research official docs before implementing anything non-trivial.
5. **Change classification** — every proposed change must be labeled as one of: *core browser stability / UI readiness / future agent layer / do not implement yet*.
6. **Known critical bugs** — pointer to `docs/tech-stack-analysis-report.md`. Lists the 5 bugs with file locations. **This section is removed once all 5 are fixed.**

---

## 5. ui-playground Branch

**Branching point:** Off `dev`, after all 5 critical bugs are fixed and tests pass.

**Purpose:** Headed, persistent-profile Chromium sandbox for visual experimentation. Not connected to the Phase 3 HTTP server. No production expectations.

### Initial commit contents

Single file: `ui-playground/launch.ts`

- Uses `launchPersistentContext()` from Playwright with `headless: false`
- Persistent profile stored at `ui-playground/.browser-profile/` (gitignored on this branch)
- No Fastify server, no SessionManager, no command handlers, no tests
- Run command confirmed from `package.json` at implementation time (`tsx` or `ts-node`)

### Hard rules for this branch

- `ui-playground/.browser-profile/` is gitignored
- No code merges directly from `ui-playground` to `master`
- Experiments that graduate are cherry-picked or re-implemented on `dev`
- Branch may freely diverge and stay messy — that is its purpose

---

## 6. Execution Order (This Session)

1. Create `dev` off `master`
2. Merge `claude/branch-commit-info-p51r8` into `dev`
3. Delete both stale remote branches
4. Fix bugs 1, 4, 5 on `dev` (no research gate)
5. Research + fix bug 2 (`snapshot.ts`)
6. Research + fix bug 3 (`manager.ts` close timeout)
7. Run full test suite — verify all 129 tests pass
8. Write `AGENTS.md` on `dev`
9. Merge `dev → master`
10. Branch `ui-playground` off `dev`
11. Write `ui-playground/launch.ts`
12. Push all branches to remote

---

## 7. Out of Scope

- High/medium severity bugs from the analysis report (addressed incrementally after this session)
- Phase 3 feature work (dynamic page tracking, tab lifecycle events, SSE stream, stale lock recovery)
- Any agent runtime, LLM integration, or desktop shell work
- Changes to existing tests
