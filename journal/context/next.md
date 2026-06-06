# Next — Context Bridge

---
## 2026-06-06 16:58 — HERO DEMO gate: spec + plan for Core input commands (click/type/press/wait)

### Done
- `/start` → resumed at Phase 4 (4a shipped + graduated to master PR #2). Loaded browser desk context.
- Brainstormed the gating Core capability for the HERO DEMO: Feather goes **observe-only → act**.
- Wrote + committed the **design spec** `docs/specs/2026-06-06-core-input-commands-design.md`
  (`a6f3792`), then a **hardened pass** (`07b7482`) after verifying every assumption against the
  actually-installed **Playwright 1.60.0** + real code (research-driven). Hardening closed 4
  demo-breaking gaps (see Decisions).
- Wrote + committed the **implementation plan** `docs/plans/2026-06-06-core-input-commands.md`
  (`776cc8c`) — 10 TDD tasks, full copy-paste code, exact run commands, zero placeholders,
  self-reviewed for spec coverage + type consistency.
- Confirmed a security invariant by inspection: `Fastify({ logger: false })` + no route logs
  `request.body` → `type` payloads (future creds) are never logged. Spec forbids introducing it.

### Unfinished / open threads
- **Execution NOT started.** Awaiting Roi's pick: **subagent-driven (recommended)** vs inline.
- Two minor calls kept (no objection): command named **`type`** (not `fill`); default timeouts
  **15s actions / 30s stable**. Change at execution time if Roi prefers.
- Housekeeping (non-blocking): Anchor brief still sitting in `journal/raw/_inbox/`
  (`anchor-browser-research-brief-2026-06-06.md`) — already-processed, just needs archiving to
  `journal/raw/archive/`.

### Decisions
- **Scope** = just the reusable act/wait commands; warming ChatGPT + demo script + recording are
  separate downstream tasks.
- **Targeting** = robust strategies (role/text/placeholder/testid/css) via a shared
  `resolveLocator`, plus a positional `at: "first"|"last"|number` — **critical**: ChatGPT renders
  user msg + reply as siblings, so the new reply is the **last** match; `.first()` alone would
  read the wrong one.
- **`wait until:"stable"`** = site-agnostic "text stopped changing for quietMs", with a
  **non-empty guard** (ChatGPT attaches an empty answer node before streaming; naive logic would
  falsely settle on it) + per-poll read timeout + lazy re-query for mid-stream node replacement.
- **`type`** supports `mode: "fill" | "sequential"` (sequential = ProseMirror/contenteditable
  fallback; `fill`-on-`[contenteditable]` confirmed supported in PW 1.60).
- **Error codes**: `ELEMENT_NOT_FOUND` (404), `ELEMENT_NOT_ACTIONABLE` (409, via `loc.count()`),
  `WAIT_TIMEOUT` (408).
- This is **Feather Core** (command surface), **not** the Phase 5 agent — no perception/autonomy.

### Next action
Execute `docs/plans/2026-06-06-core-input-commands.md` starting at **Task 1** (Target + I/O
types). Roi picks subagent-driven (recommended) or inline execution. All integration tests are
CI-friendly (headless, inline `data:` pages — no Wayland needed).
