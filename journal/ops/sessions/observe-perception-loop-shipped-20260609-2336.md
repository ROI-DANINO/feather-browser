# Session — Observe / Perception Loop: brainstorm → spec → plan → SHIPPED

**Timestamp:** 2026-06-09 ~23:36
**Phase:** 4a (Feather v1)
**Desk:** browser
**Branch:** dev (pushed → origin/dev, `eee44f3..837435c`)

## Done this session

A full vertical slice, brainstorm to shipped, of the **perception / observation loop** — the answer to "the agent works but it's slow and blind to banners."

1. **Research (6 platforms).** How Claude for Chrome, ChatGPT Agent, Perplexity Comet, Manus, Anchor, browser-use perceive + plan. Convergent findings: everyone runs perceive→reason→act→observe; the win is the **accessibility-tree/indexed-refs** path (cut API calls ~50%, ~93% more token-efficient than raw DOM); planning-on-the-go = cheap **observation reduction + change-diff**, not server-side planning; screenshots are the expensive trap.
2. **Spike (proven).** `spikes/observe-perception-spike.mjs` — validated the "between B and C" approach on a controlled overlay page + real Instagram login (sparse ARIA) + Guardian (cross-origin consent iframe): DOM-walk + `elementFromPoint` occlusion + no-DOM-mutation refs. This settled the B-vs-C call with evidence, not priors.
3. **Spec** — `docs/specs/2026-06-09-observe-perception-loop-design.md` (APPROVED section by section).
4. **Plan** — `docs/specs/2026-06-09-observe-perception-loop-plan.md` (11 TDD tasks, waves A–E, dependency-wired).
5. **Implementation — SHIPPED via subagent-driven parallel dispatch + TDD.** 11 tasks across 5 waves; commits `6118e8d`..`837435c` (plus the doc/spec commits `706a3aa`, `66ddfe3`).

### What the feature gives the agent
- **`POST /observe`** — action-shaped perception, text-only: numbered **observe-scoped refs** (`<observeId>.e<i>`), first-class **overlays** (occlusion via `elementFromPoint`), and a **change-diff** vs the previous observe. Shadow-DOM-piercing; **never reads `el.value`** (no credential/PII leak); same-origin frames walked, cross-origin walls detected-but-not-entered.
- **Act by ref** — `{by:"ref", ref}` on click/type/press/wait/select-option, resolved from a per-page cache to a live `ElementHandle` (reuses the proven Playwright input layer). New cheat-sheet #1.
- **`POST /dismiss`** — opt-in, overlay-scoped, affirmative-label-only banner dismissal. Retires the `dismiss_got_it` crutch.
- **Screenshot hygiene** — retention cap (newest 20) + 8s timeout/animations-off (kills the H1 30s font-stall).

### Engineering notes (the "what it misses" pass)
- **Caught a real safety bug** (`3b82839`): refs weren't observe-scoped → a stale in-range ref silently resolved to a *different* element instead of `REF_EXPIRED`. Found by the T10 e2e test (Testing Honesty), fixed by scoping refs to `observeId`; T10 now proves expiry even when the element persists.
- **T5 interface gap** — cache methods were on the `FeatherSession` class but not the `ISession` interface; surfaced during T7 wiring, fixed.
- **T7 subagent dropped mid-flight** (API ConnectionRefused) with uncommitted edits; verified its work against the real-Chromium `input-commands` integration test (6/6) before committing, and updated 5 stale input-command unit tests to the new `resolveActionable`/probe contract.
- **Parallel-same-tree hazard observed** — T2's typecheck transiently saw T1's in-flight edit; disjoint-file commits stayed clean. Lesson: same-file tasks (T8/T9 both edit `routes.ts`) must run sequentially.

## Verification (final)
- typecheck: clean
- unit: 262 pass / 1 fail (pre-existing `continuity.test.ts` flake — documented, unrelated)
- integration: **60/60** (was 54; +6 new: perception-walk, observe, observe-route, dismiss, observe-loop)
- tree clean; `dev` pushed to `origin/dev`.

## Left unfinished / deferred (spec §16)
- Cross-origin iframe descent (clicking inside third-party CMP iframes) — `await-human` is the v1 fallback.
- Goal-aware LLM relevance filter — deliberately not built (would add a model dependency).
- **v2 stealth hardening:** move the identical walk fn into a CDP isolated world (evades page DOM-method traps). Clean future swap — walk logic unchanged.

## Next concrete action
Open. Candidates: (a) exercise the new loop on a real showcase task to measure the speed/round-trip win vs the old guess-and-fail loop; (b) start v2 Gate A (capability/safety gate, ADR-0010). Roi to choose.

## Decisions
- **Option 1 (rich perception, agent plans)** — Feather perceives; the LLM plans. Model-neutral (ADR-0006). "Planning on the go" = the change-diff, not server-side planning.
- **Mechanism: "between B and C"** → Playwright `evaluateHandle`/`ElementHandle` walk (reuses input layer, shadow-safe); isolated-world execution sequenced to v2 stealth.
- **`observe` is read-only; `dismiss` is the side-effecting, opt-in, overlay-scoped split** — preserves the detectability guarantee (passive reads, no mutation, no value reads).
- **Same-origin walk / cross-origin detect-only** for v1 (lean + flat detectability).

## Roi quotes (verbatim)
- "how can we make it plan its path forword, 'see' the screen in 'real time' and adjust to changing artifacts on the site"
- "how to find relevant context to plan the on the go as well"
- "and doing it fast and efficient"
- "im thinking somwher btwin b and c actually"
- "do i risk detectability?"
- "work smart, research online when needed. think of the actual feature and wht it might miss, while keeping stealth efficiency security and usability"

## Artifacts
- Spec: `docs/specs/2026-06-09-observe-perception-loop-design.md`
- Plan: `docs/specs/2026-06-09-observe-perception-loop-plan.md`
- Spike: `spikes/observe-perception-spike.mjs`
- Blog: `blog/0017-teaching-it-to-see.md`
- Commits: `706a3aa`, `66ddfe3`, `6118e8d`, `c3e6c63`, `1a66102`, `7068b94`, `de7da75`, `5b3c70a`, `3b82839`, `837435c` (+ T1–T5: `c9c2c6a`, `5e93376`, `280707a`, `91f2b58`, `43bc910`)
