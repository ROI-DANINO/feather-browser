# Roadmap — Future Phases (cold storage)

Extracted from the hot `ROADMAP.md` during the Token Diet (Step 2, 2026-06-04) to keep the hot
roadmap scoped to the current active phase. The hot file links here. Destination/Roadmap-Model and
the current phase live in `ROADMAP.md`; completed Phases 0–3 detail lives in
`journal/ops/archive/roadmap-phases-0-3.md`.

---

## Phase 5+: Agent Runtime Layer & Daily Hardening

Goal: Add agent-oriented systems on top of the stable human browser shell. Implement the Cookie Mine
model: agents open new pages (tabs) within the human's running session via the Fastify
MCP-compatible hub, piggybacking on accumulated trust signals. Harden the result for daily use.

Planning notes (check before starting Phase 5+):
- Microsoft ships an official Playwright MCP server. Evaluate it before designing Feather's MCP hub —
  Feather may build on top of it rather than reimplement from scratch.
- The MCP spec is evolving rapidly (stateless HTTP core, Tasks extension RC expected mid-2026). Check
  current spec state before committing to the hub design to avoid rework.
- MCP spec is final 2026-07-28. Do not design the hub before then.

Milestones:
- Step 0: research and plan Phase 5+.
- Cookie Mine: tab open pathway in SessionManager — agents open new pages within the existing human
  session rather than launching isolated contexts (see ADR-0003).
- Local MCP-compatible hub routing: Fastify endpoint (`POST /v1/sessions/:id/tabs`) for agent tab
  requests against the live human session.
- Agent orchestration integration — leading candidate **Hermes**, with **OpenClaw** as a challenger
  if better suited; selection deferred to Phase 5 Step 0 (see ADR-0006). The agent-facing surface
  must also be drivable by external agent clients (**Claude Code, Codex**) via the MCP-compatible hub.
- **Agent-Blind Credentials Vault** (ADR-0008) and LLM API credential handling. The agent never sees,
  holds, or handles raw credentials; Feather infrastructure reads the vault and injects under the
  hood; the agent only operates inside the resulting authenticated state. Vault/profile/cookie data
  is isolated from the repo under standard Linux user paths (`~/.config`, `~/.local/share`),
  gitignored — never inside the workspace.
- Human approval checkpoint system.
- Agent chat sidebar.
- Atomic agent action protocol.
- Scripted agent recipes.
- Headless screencast / viewport preview portal.
- User-to-agent tab handover.
- yt-dlp subprocess adapter for media downloads.
- Stability testing, performance budget, security review, and update strategy.

---

## Core behavioral objectives (North Star — must survive any restructuring)

These two are the *point* of the agent runtime, not optional polish. They are deliberately defined
sharply so a passive, lesser version is never mistaken for the milestone.

### 1. Active Anti-Bot Self-Detection (beyond a passive recorder)

A telemetry recorder spun up early is **only a data collector** — necessary, but not the milestone.
The destination is an **active, real-time self-monitoring system running alongside the agent**. It
continuously analyzes the agent's own behavior (cadence, timing, mouse/keyboard signature, request
patterns) against live detection criteria (e.g. Cloudflare and similar bot-ID heuristics) and
**warns or corrects the agent in real time** when its behavior trends too robotic — closing the loop,
not just logging it for later. Defensive self-emulation: model how sites fingerprint bots in order to
find and fix the agent's own weak spots. Distinct from the passive recorder; the recorder feeds it.

> **Existing hook (tech-debt, deferred 2026-06-04):** `DebugCapture.recordCommand()`
> (`src/debug/capture.ts`) is wired but has **no caller** — so `commands.jsonl` is written empty
> every debug session. It's the natural producer for this recorder; claim it (or redesign it) when
> building the telemetry layer rather than guessing the shape now. Same file has a minor known race:
> `finalize()` can drop an in-flight network request from `network-summary.jsonl` — acceptable for
> best-effort debug, no fix planned.

### 2. True Perception & Generalized Workflows (beyond a DOM stripper)

The Agent-Browser Interface is **not merely a token-saving DOM stripper / context shrinker**. The
destination is a **core perception layer** that lets the agent **reason about, adapt to, and execute
repeatable workflows on completely unfamiliar websites it has never seen before** — generalizing
across novel layouts rather than replaying site-specific scripts. The context-shrinker / token
optimizer is one component feeding this layer, not the goal itself. Prior research:
`research/2026-06-03-phase-5-agent-perception-layer-notes.md`.

> Related Phase-5 continuity items (framed as user-authorized continuity, NOT "stealth/bypass") are
> parked in `journal/context/active.md` → Parked: sensitive-session / no-trace policy + mediated late
> credential release; learned behavioral fidelity (agent acts with the human's mouse/typing
> signature); observe-to-learn (agent sees the human's screen on request to learn workflows).
