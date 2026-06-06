# Feather Public Positioning: Core First, Shell Later

> Status: product-positioning reference. Promoted from
> `journal/raw/_inbox/2026-06-05-feather-open-source-positioning-and-adoption.md` (2026-06-05).
> This sets the public-facing message; it is not a roadmap change. Roadmap → `ROADMAP.md`.

## One sentence

**Feather is a local Chromium runtime for AI agents.**

It gives agents controlled browser sessions with persistent profiles, screenshots, page
snapshots, extraction, debug bundles, and a clean local API.

## Who it is for (first audience)

Not "everyone who wants an AI browser." The realistic early audience is developers:

- Linux developers and local-agent builders
- MCP users and Playwright-heavy automation developers
- people building personal AI workflows
- researchers and builders working on browser agents
- anyone who needs persistent, authenticated browser sessions an agent can drive

## What Feather does today

- Launches and controls isolated Chromium sessions over a local HTTP API
- Persistent **and** disposable profiles, with profile locks to prevent collisions
- Page snapshots, structured extraction, screenshots
- Structured JSONL logs with automatic credential redaction
- On-demand debug bundles (console, network, screenshots, trace)
- Resource measurement
- Transport-separated command handlers (so the same core can later expose MCP/other protocols)

## What Feather does not do yet

Stated plainly so the scope is honest, not so it looks unfinished:

- Not a Chrome replacement or a general consumer browser
- Not an Arc / Zen / Dia / Comet competitor
- Not a polished cross-platform GUI product
- Not a complete agent framework
- Not a broad integration / connector platform (see the Composio note: Feather is the
  browser-native execution layer those ecosystems still need, not a clone of them)

## Why this is useful for agents

Feather earns its place when an API is not enough — when an app has no useful API, when
visual state matters, when login cookies / persistent profiles matter, when you need real
Chromium, or when debugging automation needs reproducible artifacts (logs, screenshots,
traces). It is infrastructure, not a single-use Playwright script.

## Platform limits (honest, up front)

Feather is currently **Linux-first and developed on Fedora (Wayland)**. Cross-platform
support is not promised yet. The visual desktop shell's browser-surface architecture on
Wayland is still unresolved, so the **GUI shell is not the first public adoption path**.

This is acceptable for an early, developer-focused open-source project — as long as the
scope is honest. The goal is not mass adoption; it is being genuinely useful to a sharp,
narrow audience.

## Feather Core vs. Feather Shell

The public roadmap is split so the adoptable part is legible on its own:

**Feather Core** (the near-term open-source surface)
- local browser runtime, sessions, profiles
- screenshots, snapshots, extraction, debug bundles
- local API / future MCP tool interface

**Feather Shell** (the larger, more platform-specific vision)
- the Zen-inspired visual browser shell
- the long-running human browsing context (Cookie Mine)
- shared persistent trust context, later agent-facing workflows

Both matter. But Core is what another developer can pick up, understand, and use sooner;
Shell is harder to adopt and harder to explain. Lead with Core.

## Near-term open-source strategy

1. **Make Core understandable** — docs that answer: what is Feather, what is it not, why not
   just use Playwright directly, why local, why persistent profiles, what works today, and
   what is Linux/Fedora-specific.
2. **One strong public demo** — start a session, navigate, snapshot, screenshot, extract,
   debug-bundle, close — runnable with `curl` or a tiny script before any agent is involved.
3. **Separate the public roadmap layers** (Core vs. Shell, as above).
4. **State the limits explicitly** — Linux-first, Fedora target, Wayland shell unresolved,
   GUI not the first adoption path, not a general browser, not an integration platform.

## Working principle

Do not make Feather look broader than it is. Make it look **sharper**.

The weaker promise is "everyone should use Feather as their browser." The stronger one is
"developers building local agents can use Feather as their browser runtime." Smaller
promise, much stronger pull.
