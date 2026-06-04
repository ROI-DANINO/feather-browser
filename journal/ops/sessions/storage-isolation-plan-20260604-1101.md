# Session — Storage-Isolation Plan + `.remember` Lobotomy Verified

**When:** 2026-06-04 ~10:30–11:01
**Branch:** dev
**Desk:** browser
**Phase:** Phase 4, pre-shell infrastructure sequence — Task #1 (storage isolation)

## Done

1. **`/start`** → reported Phase 4 state; flagged two issues: 6 open inbox files, and Token Diet
   "verification failed" (the `=== HANDOFF/REMEMBER/MEMORY ===` block still injecting at SessionStart).

2. **Diagnosed the `.remember` lobotomy "failure" — config was correct all along.** The disable
   (`.claude/settings.local.json` → `"remember@claude-plugins-official": false`) is the right
   mechanism and right scope (project-only). It hadn't taken effect because **plugin hooks load at
   Claude Code process launch**, and the disable was saved (settings mtime **10:13**) *after* the
   running process started (**09:38**). `/clear` re-fires SessionStart but runs against the
   already-loaded plugin set — it does not reload plugins. The hook is registered solely via the
   plugin (`remember/0.7.3/hooks/hooks.json`); no standalone `hooks` entry in any settings file.

3. **Roi did a full CC restart → verified fixed.** Fresh process PID **43547** (launched 10:44, after
   the disable), `settings.local.json` still `false`, and **this session injected no MEMORY block**.
   Lobotomy now holds. Closed the verification note in `active.md` (recorded: config correct; needs a
   **full restart, not `/clear`**).

4. **Opened Task #1 (storage-isolation fix)** via brainstorming. Roi chose the **full XDG split**
   ("the Linux way") over a single relocated dir. No existing `.feather` data in the repo → no
   migration needed.

5. **Spec written + committed** — `docs/specs/2026-06-04-storage-isolation-xdg-design.md` (`5f8f4e7`).
   Layout: profiles/cookies/vault → DATA (`~/.local/share/feather`); logs/debug/measurements → STATE
   (`~/.local/state/feather`); disposable sessions → CACHE (`~/.cache/feather`); token/endpoint →
   RUNTIME (`$XDG_RUNTIME_DIR/feather`, falls back to STATE — never the workspace). Honors XDG env
   vars + a `FEATHER_DIR` single-root override. Adds `.feather/` to `.gitignore` as a safety net.

6. **Implementation plan written + committed** — `docs/plans/2026-06-04-storage-isolation-xdg.md`
   (`0fa0b8a`). 5 TDD tasks. **Refinement of the spec:** `FeatherPaths`/`ensureDirs` accept
   `FeatherDirs | string` (string = single-root, normalized via `singleRootDirs`) so the 14 existing
   test files that pass a `tmpDir` string stay untouched and green. Task ordering keeps each commit
   compilable (config → fs-layout → index).

7. Saved a `plain-English` preference memory (Roi: "i dont know this tech things and i need plain
   english"). Wrote blog **0007 — The Keys Were Under the Doormat** + updated `blog/README.md`.

## Left unfinished / Next

- **Execute the storage-isolation plan** (Tasks 1→5). Awaiting Roi's execution-mode choice
  (subagent-driven vs inline) — that question was open when `/stop` was called. **This is the next
  session's focus** (Roi confirmed).
- Inbox still holds 6 open files (untouched).

## Decisions

- Storage layout = **full XDG split** (data/state/cache/runtime), not single-dir. (Roi: "i like the
  linux way.")
- `FeatherPaths`/`ensureDirs` accept `FeatherDirs | string` to avoid churning the stabilized test suite.
- `.remember` disable **requires a full CC restart**, not `/clear` (plugin hooks load at launch).

## Verbatim Roi quotes

- "i want to addres 2. Token Diet verification FAILED... worth investigating."
- "i did now the Fully quit and relaunch Claude Code thing / now what"
- "i dont know this tech things and i need plain english to understand you."
- "i like the linux way"
- "right, focus next session on executing the storage-isolation plan"

## Artifacts

- Spec: `docs/specs/2026-06-04-storage-isolation-xdg-design.md` (`5f8f4e7`)
- Plan: `docs/plans/2026-06-04-storage-isolation-xdg.md` (`0fa0b8a`)
- Blog: `blog/0007-the-keys-were-under-the-doormat.md`
- Memory: `plain-English` preference (built-in auto-memory)
