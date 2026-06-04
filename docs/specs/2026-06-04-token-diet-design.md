# Token Diet — Context Optimization Design

**Status:** Design (measurement + blueprint complete; prune NOT yet executed)
**Date:** 2026-06-04
**Scope:** Reduce the per-session orientation token load by removing duplication across
auto-loaded surfaces. No information is deleted — every fact is relocated to a single owner
plus links. This spec is the plan the prune session executes against.

---

## 1. Problem

~15,650 tokens load on every `/start` before any work begins. The cause is **duplication, not
volume**: the single "where are we / what's next" fact is restated across 5–7 auto-loaded
surfaces. Roughly **8,000 of the ~15,650 hot tokens is the same current-state told many ways.**

## 2. Audit (measured 2026-06-04)

Token estimate = bytes ÷ 4. `log.md` counted as tail-20 (what `/start` loads).

| Rank | Surface | Loader | Bytes | ~Tokens |
|---|---|---|---:|---:|
| 1 | `PROGRESS.md` | /start | 11,074 | 2,768 |
| 2 | `journal/log.md` (tail-20) | /start | 10,640 | 2,660 |
| 3 | `ROADMAP.md` | /start | 9,110 | 2,277 |
| 4 | `journal/context/active.md` | /start | 4,483 | 1,120 |
| 5 | `journal/ops/tasks.md` | /start | 4,122 | 1,030 |
| 6 | `README.md` | /start | 2,943 | 735 |
| 7 | `memory/project_phase4_sequencing.md` | recall | 2,618 | 654 |
| 8 | `memory/project_security_and_agent_fidelity.md` | recall | 2,448 | 612 |
| 9 | `journal/ops/phase.md` | /start | 2,168 | 542 |
| 10 | `memory/project_lightweight_engine_direction.md` | recall | 1,664 | 416 |
| 11 | `.remember/recent.md` | hook | 1,692 | 423 |
| 12 | `memory/feedback_research_driven_not_arrogant.md` | recall | 1,577 | 394 |
| 13 | `memory/MEMORY.md` | recall | 1,490 | 372 |
| 14 | `journal/README.md` | /start | 1,420 | 355 |
| 15 | `memory/feedback_dev_master_push_policy.md` | recall | 1,085 | 271 |
| 16 | `memory/feedback_defer_to_recommendations.md` | recall | 1,028 | 257 |
| 17 | `.remember/today-2026-06-04.md` | hook | 1,023 | 255 |
| 18 | `memory/feedback_stop_for_sudo.md` | recall | 769 | 192 |
| 19 | `memory/feedback_load_desk_context.md` | recall | 626 | 156 |
| 20 | `.remember/now.md` | hook | 357 | 89 |
| 21 | `.remember/archive.md` | hook | 293 | 73 |

**Total hot load (worst case, all memories recalled): ≈ 62,600 B ≈ 15,650 tokens.**

`.remember/today-*.done.md` (~3,300 B) are NOT loaded — the `.done` suffix already excludes them.
`core-memories.md` is referenced by the hook but **missing**.

### Duplication evidence
- `"next action"` is written into **4 hot files**: `PROGRESS.md`, `active.md`, `tasks.md`, `phase.md`.
- state-phrase hit counts: `active.md`=16, `tasks.md`=14, `PROGRESS.md`=6, `phase.md`=4.
- `log.md`: **23 of 51 entries are `STOP` handoffs** (largest 1,306 B); each duplicates its
  `ops/sessions/*.md` file AND the `active.md`/`.remember` narration.

## 3. Single-owner hierarchy (each fact lives in exactly ONE hot file)

| Fact type | THE one owner | Everyone else must… |
|---|---|---|
| Current state + next action | `journal/context/active.md` *(owner TBD — see §6)* | link, never restate; only mutable state file |
| Destination, milestones, exit criteria | `ROADMAP.md` | archive completed-phase detail to `ops/archive/` |
| Current-phase task checklist | `journal/ops/tasks.md` | checkboxes only, no state narration |
| Machine phase pointer | `journal/ops/phase.md` | frontmatter ONLY — strip prose `step:`/`next:`/`note:` |
| Decisions + rationale | `docs/specs/adr-*.md` | reference by ADR number, never restate body |
| History / narrative | `blog/` · `ops/sessions/` · `log.md` (1-line index) | `active.md`/`PROGRESS` stop recounting history |
| Standing constraints/prefs | `memory/` | — |
| Process docs | `journal/README.md`, `docs-map.md` | demote to **warm** (load on demand, not at `/start`) |

**Two highest-leverage moves:**
1. Demote `PROGRESS.md` out of the hot set → thin pointer; drop from `/start` read list (−2,618 tok).
2. Collapse the 4-way state narration into one owner (−~1,100 tok): `phase.md`→frontmatter only,
   `tasks.md`→checklist only, `README.md`→strip "Development Status" prose to one line.

## 4. `log.md` rules (enforceable)

1. **One line per entry, hard-capped ≤ 140 chars**, format unchanged. Full detail lives in the
   linked artifact (STOP→`ops/sessions/<file>.md`; BUILD/DECISION→commit/ADR). No inlined prose.
2. **Phase-boundary rotation.** On any `PHASE` transition (or when `log.md` > 40 lines), collapse
   all pre-current-phase entries into a one-line-per-phase digest moved to
   `journal/ops/archive/log-archive.md`. Hot `log.md` holds only the current phase's entries.
3. **`/start` loads tail-15, not tail-20.** With capped lines ≈ 525 tok vs 2,660 today.

## 5. `.remember` compaction rules (`now → today → recent → archive`)

Principle: `.remember` is a thin time-ordered buffer that POINTS at `active.md`; `active.md` is
authoritative. They must not both narrate next-action.

| Layer | Role | Hard rule / cap |
|---|---|---|
| `now.md` | current-session scratch | ≤ 5 lines; cleared/rolled at every `/stop` |
| `today-YYYY-MM-DD.md` | today's session one-liners | new-day first `/start`: summarize prior day → 1 line into `recent.md`, rename raw → `….done.md` (auto-excluded) |
| `recent.md` | rolling 7-day window | one line per day; cap ~10 lines; >7d → move line to `archive.md` |
| `archive.md` | long-term | collapse 7 daily lines → 1 weekly digest; tiny forever |
| `core-memories.md` | identity-defining moments | **create it** (missing); rarely written, never rotated; move stranded "Identity Candidates" lines here |

## 6. Open decision (resolve live during the prune)

**Owner of "current state + next action": `active.md` vs `PROGRESS.md`.** Deferred by Roi to the
prune session — decide with both files side by side. (`active.md` is the lighter candidate;
`PROGRESS.md` is the larger/heavier file.)

## 7. Projected result

| | Hot tokens |
|---|---:|
| Now | ~15,650 |
| `PROGRESS.md` demoted to pointer | −2,618 |
| `log.md` capped lines + tail-15 | −2,100 |
| `ROADMAP.md` completed-phase detail archived | −877 |
| `active.md` tightened | −670 |
| `phase.md` frontmatter-only | −452 |
| `tasks.md` checklist-only | −430 |
| `README.md` status-dump → one-liner | −485 |
| `journal/README.md` → warm | −355 |
| `.remember` buffers tightened | −440 |
| **After** | **≈ 7,200** |

**≈ 53% cut to per-session orientation load, zero information lost.** `memory/` (~3,326 tok) left
intact — it is the durable single-owner constraint layer.

## 8. Recommended execution order (prune session)

1. Resolve §6 (state owner), then demote `PROGRESS.md` + collapse 4-way state narration.
2. Cap + rotate `log.md`; create `ops/archive/log-archive.md`.
3. Apply `.remember` rules; create `core-memories.md`.
4. Trim `README.md`/`ROADMAP.md`; demote process docs to warm.
5. **Verify hot-load token count drops at each step** (re-run the §2 audit command).

## 9. Adjacent finding (NOT part of the diet — record for the security/vault work)

`src/config.ts:11` defaults `featherDir` to relative `.feather` (inside the repo), and `.feather/`
is **not** in `.gitignore` (only `.browser-profile/` is). This violates the firm constraint that
the **persistent Google profile + vault data must live under XDG user paths (`~/.config`,
`~/.local/share`) and be strictly gitignored.** Flagged here only because it surfaced during the
audit; the fix belongs to the security/vault track, not the token diet.
