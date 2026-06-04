# Session — token-diet-finish (2026-06-04 10:34)

**Type:** Process/tooling + vision capture. No feature code. Still Phase 4 (Step 0 done); project
next milestone unchanged = Spike A (sudo-gated → Roi), now explicitly **frozen** (architecture stands).

## Done

- **`/init` reshape → phase-boundary ritual.** Rewrote `.claude/commands/init.md` into A. Orient /
  B. Phase-wrap / C. Open-next; dropped the demoted `PROGRESS.md` from the read-set; `active.md` =
  owner; log tail-15. Corrected the false "staged in working tree" line in `active.md`. Moved the two
  completed Process items to Done in `tasks.md`. → `4cc16cf` (pushed).
- **Token-Diet Step 1 — `.remember` Engine Lobotomy.** Verified the `.remember` bundle is injected by
  the **remember plugin's global `session-start-hook.sh`** (registered via plugin enablement), NOT by
  `start.md`/`init.md` — so the 3 literally-specified steps could not achieve the drop (the target
  strings don't exist in the command files). Via the `update-config` skill + a decision prompt, chose
  **"disable plugin injection; journal sole engine."** Set `"remember@claude-plugins-official": false`
  in `.claude/settings.local.json` (local precedence overrides the user-settings `true`;
  project-scoped, gitignored, reversible). Deleted 4 cold `*.done.md` (13.3 KB). Projected −1,038 tok.
- **Token-Diet Step 2 — ROADMAP collapse.** Extracted Phase 5+ → new
  `journal/ops/archive/roadmap-future.md`; hot `ROADMAP.md` `~1,351 → ~987 tok` (−364). Caught &
  corrected Roi's "keep Phase 3" slip → kept **Phase 4** hot (we're in Phase 4, not 3). → `e22ddd6`
  (pushed). Cumulative projected auto-hot: **~5,037 → ~3,635 tok** (−28% this session).
- **Sharpened the two North-Star behavioral objectives** in the archive (defined, not just listed):
  (1) **Active Anti-Bot Self-Detection** — real-time self-monitoring/correction of agent cadence vs
  detection heuristics, NOT a passive recorder (the recorder feeds it); (2) **True Perception &
  Generalized Workflows** — a perception layer that reasons/adapts/executes on *unfamiliar* sites,
  NOT a DOM stripper (the context-shrinker is one component).
- **Locked the pre-shell infrastructure sequence** (see `active.md` → Recommend next + `tasks.md`).

## Decisions

- **Journal is the sole state + history engine.** `active.md` = owner; `.remember` plugin disabled for
  this project. `/stop` (active.md + log.md) is the sole handoff writer.
- `/init` = phase-boundary ritual (distinct from per-session `/stop`).
- Hot `ROADMAP.md` = current phase (Phase 4) only; Phase 5+ → cold `roadmap-future.md`.
- **Pre-shell order is locked:** storage-isolation fix → productionize attach-don't-launch →
  warmed Google session on disk → observability (wire `DebugCapture`) → prove end-to-end Cookie Mine
  loop on the headed-Chromium stopgap → *then* design the Visual Desktop Shell GUI.
- Agent-Blind Vault model reaffirmed as core infra; **Spikes A/B frozen, not deleted** — architecture
  stands; ADR-0008 stays 🚧 non-accepted until A/B clear.

## Left unfinished / ideas

- Empirical confirmation of the ~3,635 baseline = next `/start` (verify the `=== MEMORY ===` block is
  gone). If it still appears, the plugin reconciler needs a restart or `/hooks` reload (Roi-action).
- **`/stop` step 11 (write `.remember/remember.md`) is now vestigial** — drop it from the ritual next
  time `/stop` is edited. (Skipped this session, with approval.)
- `core-memories.md` no longer auto-loads (plugin off) — if the S1/S2/S3 identity line should
  survive, fold it into `journal/` or `MEMORY.md`.
- Inbox still holds 6 genuinely-open files (unprocessed; out of scope this session).

## Next concrete action

Next session `/start` → confirm the lobotomy took → begin the **storage-isolation fix**
(`src/config.ts` `featherDir` → `~/.config` / `~/.local/share` + gitignore), the first item in the
locked pre-shell sequence.

## Roi quotes (verbatim)

- "I accept the blast radius; a single-owner journal is the explicit goal."
- "do not let the high-level vision fall through the cracks during this technical pruning."
- "The ultimate milestone is an *active, real-time self-monitoring system* running alongside the agent."
- "The goal is to build a core perception layer that allows the agent to reason about, adapt to, and execute repeatable workflows on completely *unfamiliar websites*."
- "No feature code yet—finish the diet."

## Out of scope (unchanged)

- Spikes A/B (sudo-gated installs) → Roi; frozen.
- The 6 open inbox files.
