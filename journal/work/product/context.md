# Product Desk

Use this desk for product definition, non-goals, workflow design, UX direction, and roadmap decisions.

Current focus: preserve the original intent while narrowing the first buildable shape.

## Standing design lenses

- **Product shape — "v1 → v2 → v3"** (`feather.md` + `docs/roadmap/{v1,v2,v3}.md`, 2026-06-08).
  The destination is now framed as three versions Roi can hold in his head and attend to one at a time:
  **v1** = an agent runs errands in a browser (basic Claude-for-Chrome; mostly built); **v2** = it works
  on bot-hostile sites *as you*, safely (the Cookie Mine payoff + the whole security-first spine);
  **v3** = the visual shell + ecosystem interop (lowest priority). The version files own the *product
  narrative*; `ROADMAP.md` stays the execution engine-room. Born from Roi losing track of "what am I
  building" amid well-specced feature sprawl — keep the picture small. Version→phase map:
  v1=Phase 4a, v2=Phase 5.0+5a/5b/5d, v3=Phase 4b+5e.
- **Open-source consumption — "build native by default"** (`adr-0011`, 2026-06-08). Other repos are
  *recipe books* consulted per-feature, not a feature shopping list. Buy a package only for
  hard/fast-moving/security-critical work (rare); expose-to-external is v3/5e (governed by `adr-0006`).
- **Public positioning — "Core first, Shell later"** (`docs/public-positioning.md`, 2026-06-05).
  Lead with **Feather Core = "a local Chromium runtime for AI agents"** (the adoptable, near-term
  OSS surface); the visual Shell + Cookie Mine are the larger, more platform-specific vision that
  comes later. Honest Linux-first/Fedora/Wayland limits stated up front. Make Feather look
  **sharper, not broader.** Feather is the browser-native execution layer agent ecosystems need when
  APIs aren't enough — NOT a Composio-style integration platform (memory:
  `project_feather_agent_runtime_direction`).
  **EXECUTED (Phase 4a, 2026-06-05):** this stopped being a lens and became the public artifact —
  artifact-forward `README.md` + a verified `examples/quickstart.sh` demo + ROADMAP Core-vs-Shell
  split, shipped live to the default branch (`dev`). The README's structure (what it is / who it's
  for / see it work / honest "what it doesn't do yet" / built-in-the-open) is the canonical public
  framing; reuse it. Phase 4 splits **4a (Core, done) → 4b (Shell, next)**.
- **ADR-0006 — agent-facing interface neutrality** (on `dev`). Three layers stay separate:
  orchestrator (Hermes leading / OpenClaw challenger), agent client (Claude Code + Codex as
  required targets), model provider (neutral) — unified by a standard MCP-compatible seam.
  Selection deferred to Phase 5 Step 0; this is a constraint, not a build instruction.

## Agent Browsing Stack — Phase 5 input (locked 2026-06-07)

Three-feature plan for making agents work on every site without being blocked.
Master brief: `docs/specs/2026-06-07-agent-browsing-stack-brief.md`.

**Feature 1 — Stealth Stack:** Browser fingerprint indistinguishable from a real human.
Graduated layers: CDP surface minimization (cheap) → consistent environment → behavioral timing
→ active fingerprint hardening (canvas/WebGL). Goal: "as deep as legal." Tier C target:
LinkedIn, Instagram, insurance portals. Foundation already right (headful system Chromium +
human-warmed sessions). Three spec sessions planned; this is first.

**Feature 2 — MFA Handler:** Human-in-the-loop auth. Agent hits a login wall → Feather pauses
→ phone notification (Telegram likely) → human approves/enters code → agent resumes. Agent
never holds raw credentials. Handles: TOTP, SMS OTP, push approval, passkey.

**Feature 3 — Identity Model:** Formalize Cookie Mine into named Identities. An Identity =
name + profile + site list + optional Vault reference. Agent attaches by name, starts
pre-authenticated. Wraps Features 1+2. Formalizes what's already half-built.

**Build order (security-first spine — council reversal 2026-06-07; SUPERSEDES the earlier
Stealth→MFA→Identity):** capability/safety gate → Identity → MFA → warmed-profile attach → Stealth
(last, most complex). All of this is **Feather v2** — see `docs/roadmap/v2.md` + `ROADMAP.md`.
**Guiding constraints:** local-first, lightweight (no cloud relay), legal (own accounts only).
**Anchor Browser research reference:** `research/2026-06-06-anchor-browser-product-reference.md`
— confirms architecture is correct (same CDP-attach pattern); Cookie Mine parallel confirmed;
stealth claims are mostly marketing — concrete ideas are minimal-CDP-surface + declared-bot path.

## Use-case seed — Social Research Mode  (`Proposed / needs confirmation`)

A motivating *application* of the Agent Browsing Stack (not a new feature; not committed scope).
Consolidated 2026-06-07 from two near-duplicate inbox captures (now archived under
`journal/raw/archive/`).

A personal social-research assistant that uses the **user's own authenticated** browser session to
inspect social posts, save references, read **visible** comments, and turn audience reactions into
content insights. Instagram is the named example; it exercises Identity Model (named authenticated
profile), MFA Handler (login walls), and the Stealth/Runtime modes.

**Framing guardrail (preserve):** this is a *personal research assistant*, explicitly **not** an
Instagram bot, scraping farm, engagement-automation tool, or anti-detection system. Own-accounts
only, human-warmed session, read/observe what's already visible.

## North-Star behavioral objectives (Phase 5+; defined sharply — `journal/ops/archive/roadmap-future.md`)

Defined so a passive, lesser version is never mistaken for the milestone:

- **Active Anti-Bot Self-Detection** — NOT a passive telemetry recorder. The destination is an
  active, real-time self-monitoring system running alongside the agent that analyzes its own behavior
  (cadence/timing/signature) against live detection heuristics (Cloudflare et al.) and **warns or
  corrects the agent in real time** when it trends robotic. The recorder *feeds* this; it isn't it.
- **True Perception & Generalized Workflows** — NOT just a token-saving DOM stripper. The destination
  is a core perception layer that lets the agent **reason about, adapt to, and execute repeatable
  workflows on completely unfamiliar websites** it has never seen. The context-shrinker is one
  component, not the goal.

