---
session: phase3-branch-bugs
date: 2026-05-31
time: "23:01"
branch: dev
---

## Done This Session

### Branch analysis
- Fetched and analyzed 3 remote branches: master, claude/phase-3-roadmap-analysis-j5eUo, claude/branch-commit-info-p51r8
- Pulled master — picked up Phase 3 stability-first brief (phase-3-browser-stability-first-brief.md)
- Analyzed both AI branches: interface extraction (ISession, ISessionManager), lifecycle logging, ROADMAP/PROGRESS rewrite, tech-stack-guidelines.md, tech-stack-analysis-report.md (5 critical bugs found)

### Brainstorm + design
- Ran full brainstorm: branch strategy, merge plan, bug fixes, AGENTS.md, ui-playground
- Chose Approach A: create dev first, merge AI branches there, fix bugs, merge to master
- Wrote design spec: docs/specs/2026-05-31-phase3-branch-strategy-design.md
- Wrote implementation plan: docs/plans/2026-05-31-phase3-branch-setup-and-bug-fixes.md

### Execution (parallel agents)
- Created dev branch off master
- Merged claude/branch-commit-info-p51r8 into dev (superset — all interface work + docs in one merge)
- Deleted both stale remote branches
- Wave 2 (3 parallel agents): middleware fix, lock fix, snapshot fix
- Wave 3 (sequential, same file): registry ordering fix, context.close() timeout fix
- Side fix: added DOM lib to tsconfig.json (required for Playwright arrow function types in snapshot)
- Full test suite: 101 tests passing, typecheck clean
- Updated AGENTS.md (Phase 3 state, branch rules, change classification, security audit note)
- Merged dev → master, pushed
- Created ui-playground branch, wrote ui-playground/launch.ts
- Applied stealth patches: --disable-blink-features=AutomationControlled, ignoreDefaultArgs --enable-automation
- Discovered Chrome not installed (Fedora 43), fell back to Playwright Chromium + args only

### Bug fixes committed (dev)
| Bug | File | Commit |
|-----|------|--------|
| Auth handler continues after 401 | src/transport/middleware.ts | 834a67a |
| Non-atomic lock creation | src/profiles/lock.ts | 0f7c1ef |
| new Function() in snapshot eval | src/commands/snapshot.ts | e5b3079 |
| Registry removed before cleanup | src/sessions/manager.ts | da432ee |
| context.close() no timeout | src/sessions/manager.ts | 265c0e8 |

## Left Unfinished

Phase 3 gaps 3–8 from PROGRESS.md:
- Gap 3: Tab lifecycle events (TAB_CREATED, TAB_CLOSED, TAB_UPDATED) missing from EVENTS catalog
- Gap 4: toRecord() always returns pages: [] — misleading contract
- Gap 5: Dynamic page tracking — context.on("page") not wired in FeatherSession.setContext()
- Gap 6: PageInfo lacks loadState
- Gap 7: ProfileLock doesn't check if locking pid is still alive (stale lock problem)
- Gap 8: RAM/CPU delta between browser modes unrecorded

**Blocking decision for Gap 5+3:** Where does the internal event bus live?
- Option A: EventEmitter on FeatherSession — consumers hold session reference
- Option B: EventEmitter on SessionManager — one bus, events tagged with sessionId
- Option C: logger-only for now — emit tab events to JSONL, wire bus later when SSE is designed

## Decisions Made

- Branch hierarchy: master (stable) / dev (Phase 3) / ui-playground (sandbox, one-way)
- Nothing lands on master without passing through dev and tests first
- AI-generated branches always target dev, not master
- AGENTS.md is now a public tracked file (removed from .gitignore)
- Stealth patches: Playwright Chromium + args only — no Chrome install (350MB, not worth it yet)
- Real Chrome + residential proxies deferred to Phase 5+ (scraping reliability milestone)
- DOM lib added to tsconfig — standard for Playwright TypeScript projects
- Tech stack guidelines pointer in AGENTS.md is sufficient; inlining the 4-step checklist is redundant

## Roi Quotes

- "analyze remote repo for branches and commits. do not pull yet"
- "Approach A it is"
- "i dont know these stuff so i trust you.. did you think of this good enugh?"
- "is it importent or redundent?"
- "i dont want actual chromium, or is it just temporery"
- "i want you to write the relevant stuff to theyr relevant branch, no?"

## Next Session

1. Resolve the event bus design decision (Option A, B, or C)
2. Implement Gap 5: wire context.on("page") in FeatherSession.setContext()
3. Implement Gap 3: emit tab lifecycle events
4. Then address remaining gaps in order of impact (Gap 4, 6, 7, 8)
