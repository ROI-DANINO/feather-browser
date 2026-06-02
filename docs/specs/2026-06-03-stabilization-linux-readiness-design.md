# Stabilization & Linux-Readiness Program — Design Spec

- **Date:** 2026-06-03
- **Status:** Approved (design); S2/S3 to be brainstormed when reached
- **Author:** planning session (Opus)
- **Scope owner:** Feather Browser
- **Supersedes:** the flat 7-target "pre-Phase 4 audit" checklist in `context/active.md` / `ops/tasks.md`

---

## 1. Why this program exists

Phase 3 is complete and merged to `master`. Before the ROADMAP's Phase 4 (the visual desktop shell) begins, the codebase needs a short, deliberate hardening pass driven by two things that happened after Phases 1–3 were planned:

1. **A confirmed pivot: Feather is Linux-only (Fedora target).** This invalidated assumptions baked into earlier research (Electron eliminated, Tauri a candidate, system Chromium and Flatpak now in play) and was never written into the canonical docs.
2. **A research pass** (6 files in `raw/_inbox/`) that surfaced concrete gaps — most importantly that we run **Fastify v4, whose LTS ended June 2025 and receives no security patches.**

This program is the bridge between "Phase 3 done" and "Phase 4 Step 0 starts clean." It is **not** Phase 4. Its job is to leave the codebase **patched, lighter, Linux-honest, agent-ready, and decision-documented.**

### Vision alignment

Feather's North Star: a **Linux-native, feather-weight, agentic-AI-native + human daily-driver browser** that uses Linux's strengths to be smart, light, agentic, and operative. Every phase below maps to that:

- **Light** — system Chromium drops a ~300 MB bundled download (S2).
- **Smart / agentic** — completing the tab-event model and tracing gives future agents the observability they read the browser through (S2), and the agentic token/context constraint is recorded as a standing design driver (S1, ADR-0005).
- **Secure** — migrating off end-of-life Fastify v4 is the single most important fix here (S3), and each phase carries a security checkpoint.
- **Linux-native** — the host-vs-container runtime question is decided and written down (S1, ADR-0004).

---

## 2. Audit findings (verified against the code, 2026-06-03)

The original handoff carried a 7-target list. Inspecting the actual source corrected it:

| # | Original target | Verified reality | Lands in |
|---|---|---|---|
| 1 | Fastify v4 → v5 | Smaller than feared: `.listen()` is already object-form; no `request.connection`/`.hostname`/`defaultRoute`; **no Fastify schema validation is used at all** (we validate with Zod), so the "full JSON schema required" breaking change does not affect us. The **only real gate is whether `fastify-sse-v2` has a v5-compatible release.** | S1 spike → S3 |
| 2 | Playwright `.type()` deprecated | **Non-issue.** The only match is `msg.type()` (console-message type), not the deprecated input method. Nothing to replace. | — (closed) |
| 3 | `executablePath` configurability | **Real.** `src/browser/modes.ts` has no `executablePath` / `FEATHER_CHROMIUM_PATH`. | S2 |
| 4 | Linux/Wayland launch flags | **Real but premature.** We are headless-only today; `--ozone-platform=wayland` only matters for *headed* mode → genuinely a ROADMAP-Phase-4 concern. Documented now, not built. | Phase 4 |
| 5 | `TAB_UPDATED` event | **Real, confirmed missing.** Only `TAB_CREATED` / `TAB_CLOSED` exist in `src/logs/events.ts`. | S2 |
| 6 | Debug-bundle tracing | **Already implemented.** `context.tracing.start/stop` exists in `src/debug/capture.ts:78,102` behind `opts.trace`. Needs a check that it is reachable end-to-end via the debug-bundle command. | S2 |
| 7 | Playwright 1.50 → 1.51+ | **Real.** `package.json` pins `^1.50.0`. Bump unlocks `page.screencast()`. | S3 |

Net: two targets evaporated, one moved to Phase 4, and the Fastify work is gated on one cheap spike.

---

## 3. Working method

This program follows the project's existing research-driven, session-based rhythm — with one tightening.

- **Phases are named `S1 / S2 / S3`** (not "Phase 1/2/3") so they are never confused with the ROADMAP's Phase 4 / Phase 5+.
- **Only the current phase gets detailed tasks.** S2 and S3 are brainstormed (their own short design pass) only after the prior phase completes, using what it learned. This is the agility principle: replan with real information.
- **Each phase is sized to one or two work sessions.** A session = fresh context window, opened with `/start`, closed with `/stop`, documented for the next session.
- **Tasks declare blocks** (dependencies) so ordering is explicit.
- **Per-phase exit checklist includes a permanent item: "leave the docs true."** Every phase ends with the canonical docs reconciled to reality, so the drift that left README saying "Phase 2 Complete" cannot recur.
- **Each phase carries a security checkpoint** appropriate to its work.

### Command usage (to be written into AGENTS.md in S1)

- **`/start`** — at the start of *every* session. Always.
- **`/stop`** — at the end of *every* session. Always.
- **`/init`** — only when arriving with a *new goal* you want gate-checked against the current phase before any work. Redundant with `/start` for normal continuation; optional.

---

## 4. Program structure

| Phase | Theme | Detailed now? | Notes |
|---|---|---|---|
| **S1** | Foundation: truth, decisions & spikes | **Yes** | No risky code. Docs honest, big decisions locked, cheap unknowns answered. |
| **S2** | Core improvements: Linux weight & observability | No (brainstorm after S1) | system Chromium, `TAB_UPDATED`, tracing verification — built with agents in mind. |
| **S3** | Currency & security | No (brainstorm after S1) | Riskiest upgrades last, on an orderly base: Fastify v4→v5, Playwright bump, security checkpoint. Gated by S1's `fastify-sse-v2` spike. |
| → | **Exit:** hand off to ROADMAP Phase 4 Step 0 | — | Program complete when S1–S3 exit criteria all met. |

---

## 5. S1 — Foundation (detailed)

Three sessions. No production-code changes; outputs are docs, ADRs, and recorded research findings.

### Session 1A — Reconcile reality *(no code; blocks: none)*

- Update `README.md`, `PROGRESS.md`, `ops/phase.md`, `context/active.md` to state: **Phase 3 complete; Stabilization & Linux-Readiness program started.**
- Reconcile `ROADMAP.md` with the research corpus: Linux-only confirmed; Electron eliminated; Tauri a candidate (WebKitGTK stability caveat); system Chromium opportunity; Flatpak as distribution format; MCP spec final **2026-07-28** (do not design the hub before then).
- **Polish `AGENTS.md`:**
  - Correct **Current Phase** (Phase 3 is done; this program is active).
  - Mark **Tech Stack** as "upgrade pending" (Fastify v5, Playwright bump in S3).
  - Fix the **`research/` → `raw/_inbox/`** location mismatch so future sessions look in the right place.
  - Add pointers: **Linux-only**, **runtime = host-primary (ADR-0004)**, **agentic North Star (ADR-0005)**.
  - Add a **"When to use each command"** section (`/start`, `/stop`, `/init` guidance from §3).
- **Write a one-page docs map** (`docs/docs-map.md` or a section in `schema.md`): for each doc surface, state what it is the source of truth for. Add a one-line pointer to it from `/init` and `/start` command docs, and sync their file lists if anything is renamed/retired.

### Session 1B — Lock the decisions *(no code; blocks: 1A)*

- **ADR-0004 — Runtime target.** Decision: **host-primary** daily-driver process; **Flatpak** as the eventual distribution sandbox; **Podman** kept as an *optional* target for headless/CI only, not the primary runtime. Rationale: keeps the Phase 4 Wayland/GPU/GUI path simple; Flatpak is the desktop-native sandbox (uses portals, already in research); container plumbing for Wayland/libsecret/GPU is avoided on the daily-driver path. Consequence: code that touches the browser binary path must be **decision-independent** (env-configurable), so it works whether Chromium is host-installed or image-baked.
- **ADR-0005 — Agentic North Star (constraint + deferral).** Records the standing requirement: **agents must use the browser's API auth token and their LLM context window efficiently.** Captures the informing research (Playwright MCP ≈114K vs CLI ≈27K tokens for the same task; Cookie Mine needs persistent state, which favors MCP; ARIA snapshots are how Playwright MCP feeds non-vision models). **Decision: defer tool selection (build-on Playwright MCP vs. Feather hub vs. CLI) to ROADMAP Phase 5 Step 0, after the 2026-07-28 MCP spec is final.** Until then it is a *design lens*, not a build task — S2 observability work should produce agent-friendly, compact event/context data.

### Session 1C — Answer the unknowns *(throwaway research probes only, no production code; blocks: none)*

- **Spike — `fastify-sse-v2` v5 compatibility.** Check the npm registry / peer-dependency range / changelog for a Fastify-v5-compatible release. Record the finding in `raw/_inbox/` (or `research/` per the corrected location). **This gates S3's migration plan.**
- **Spike — system Chromium as `executablePath`.** Smoke-test driving `/usr/bin/chromium` (and/or `chromium-headless`) via Playwright's `executablePath` on the Fedora target. Record version-compatibility result. **This informs S2's weight work.**

### S1 exit criteria

- README / PROGRESS / phase.md / active.md / ROADMAP / AGENTS.md all reflect reality.
- `docs-map.md` exists; `/init` and `/start` point to it; command docs in sync.
- ADR-0004 and ADR-0005 written and committed.
- Both spikes have recorded findings.
- **Docs-true check passes.** No source code changed (or, if a throwaway probe touched code, it is reverted).

---

## 6. S2 / S3 — placeholders (brainstorm later)

Detailed tasks are intentionally **not** written yet. Sketches only:

**S2 — Core improvements: Linux weight & observability**
- `FEATHER_CHROMIUM_PATH` env-configurable `executablePath` (decision-independent per ADR-0004); honor `PLAYWRIGHT_CHROMIUM_SKIP_DOWNLOAD`.
- Remove any host-path assumptions; keep Wayland flags documented for Phase 4 (not built).
- `TAB_UPDATED` event: add to `EVENTS`, emit on main-frame navigation, add to the SSE `LIFECYCLE_EVENTS` set — completes the created/updated/closed trio.
- Verify debug-bundle tracing is reachable end-to-end; add a test if the path is untested.
- Design lens (ADR-0005): keep agent-facing event/context data compact and token-efficient.
- Security checkpoint: confirm no new data path leaks secrets past the redaction layer.

**S3 — Currency & security**
- Fastify v4 → v5 migration (plan shaped by S1's `fastify-sse-v2` spike result).
- Playwright 1.50 → latest 1.5x bump; confirm full suite green (129 unit + 32 integration) and `page.screencast()` available.
- Focused security checkpoint: token auth, localhost binding, credential redaction, lock handling re-reviewed against the upgraded stack.

Each will get its own short brainstorm → spec section → plan when reached.

---

## 7. Non-goals

- No Phase 4 shell work (Tauri/GTK, Wayland embedding, browser surface) — that is ROADMAP Phase 4 Step 0.
- No agent runtime, MCP hub, or tool-building — ADR-0005 defers this to Phase 5 Step 0.
- No `yt-dlp`/media, credentials vault, or LLM wiring — Phase 5+.
- No redesign of the docs system — only reconciliation, a docs map, and AGENTS.md polish.

---

## 8. Branch & workflow

Per AGENTS.md: target `dev` for all work; never commit directly to `master`; `ui-playground` stays a one-way sandbox. S1 is docs/ADRs/spikes, so it can land on `dev` in small commits. Tests must stay green (`npm test`, `npm run test:integration`) at every phase boundary.

---

## 9. Open questions / downstream

- **Wayland browser surface** (Phase 4 Step 0): how the browsing surface appears inside the shell — three candidate architectures already researched; must be prototyped.
- **Agentic tooling** (Phase 5 Step 0, post 2026-07-28): build on Playwright MCP vs. Feather hub vs. CLI; ARIA-snapshot adoption; token/context efficiency mechanics (ADR-0005).
- **D-Bus vs. SSE** for shell events (Phase 4+ optimization, only if SSE proves a bottleneck).
