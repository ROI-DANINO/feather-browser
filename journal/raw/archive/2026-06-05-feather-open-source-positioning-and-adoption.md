# Inbox: Feather Open Source Positioning and Adoption

Status: strategic note / product direction
Priority: high
Do not implement directly from this note

## Context

Feather currently works best on the developer's own machine and is heavily shaped by a Linux / Fedora / Wayland environment. This makes it hard to immediately imagine Feather as a broad end-user browser that many people install and use across platforms.

At the same time, the project has a real open-source opportunity if it is positioned correctly.

The core question:

> Does Feather have potential as an open-source project people know, understand, and use?

## Short Answer

Yes, but probably not first as a general-purpose AI browser.

Feather's strongest near-term potential is as:

> A local Chromium runtime for AI agents.

This is narrower than "AI browser", but much more useful and understandable for an early open-source audience.

## Key Positioning Decision

Feather should lead with:

> Feather Core first. Browser Shell later.

The headless / runtime layer is the part that can become useful to other developers sooner:

- local Chromium control;
- persistent and disposable sessions;
- workspace profiles;
- screenshots;
- page snapshots;
- extraction;
- logs;
- debug bundles;
- profile locks;
- future MCP/tool interface.

The visual desktop shell and Cookie Mine vision remain important, but they are harder to adopt, harder to explain, and more platform-specific.

## What Feather Should Not Try To Be First

Do not initially present Feather as:

- a Chrome replacement;
- an Arc / Zen / Dia / Comet competitor;
- a general consumer browser;
- a polished cross-platform GUI product;
- a complete agent framework;
- a broad Composio-style integrations platform.

Those frames create unrealistic expectations and make the current Linux / Wayland limitation look like a product failure.

## What Feather Can Be First

Present Feather as:

> A local browser runtime for AI agents when APIs are not enough.

Useful when agents need to:

- open a real browser session;
- preserve login / cookies / profile state;
- navigate websites;
- capture screenshots;
- inspect page text and links;
- extract structured data;
- debug failed browser automation;
- work against websites that do not expose good APIs.

## Why This Has Potential

Feather is not only a Playwright script. It already has several runtime-grade concepts:

- HTTP control API;
- session lifecycle;
- persistent vs disposable profiles;
- profile locking;
- structured logs;
- credential redaction;
- debug artifacts;
- screenshots and extraction;
- resource measurement;
- transport-separated command handlers.

That makes the project easier to explain as infrastructure rather than as a single-use automation script.

## The Real Risk

The biggest risk is not Wayland.

The biggest risk is positioning the project too broadly too early.

Current possible sources of confusion:

- hybrid browser;
- Zen-inspired shell;
- Cookie Mine;
- MCP hub;
- anti-bot self-detection;
- perception layer;
- generalized workflows;
- human browser;
- agent runtime.

Each of these is interesting, but together they can overwhelm a new contributor or external user.

## Recommended Public Message

Suggested front-page positioning:

```text
Feather is a local Chromium runtime for AI agents.

It gives agents controlled browser sessions with persistent profiles, screenshots, snapshots, extraction, debug bundles, and a clean local API.
```

Optional secondary line:

```text
Feather is Linux-first today and designed to become an agent-facing browser runtime with future MCP support.
```

## How To Treat The Wayland / Linux Limitation

Do not hide it.

Write clearly:

```text
Feather is currently Linux-first and developed on Fedora. Cross-platform support is not promised yet.
```

This limitation is acceptable for an early developer-focused open-source project if the scope is honest.

The goal should not be immediate mass adoption.

The realistic first audience is:

- Linux developers;
- local-agent builders;
- MCP users;
- Playwright-heavy automation developers;
- people building personal AI workflows;
- researchers / builders interested in browser agents;
- developers who need persistent authenticated browser sessions.

## Suggested OSS Path

### 1. Make Feather Core understandable first

Create or refine docs that answer:

- What is Feather?
- What is it not?
- Why not just use Playwright directly?
- Why local?
- Why persistent profiles?
- Why do agents need browser state?
- What works today?
- What is Linux/Fedora-specific?

### 2. Add one strong public demo

A simple demo should show:

1. start Feather locally;
2. launch a persistent session;
3. navigate to a site;
4. capture a snapshot;
5. take a screenshot;
6. extract page data;
7. create a debug bundle;
8. close the session.

The demo should work with curl or a tiny script before involving a full agent.

### 3. Separate public roadmap layers

Suggested split:

```text
Feather Core
- local browser runtime
- sessions
- profiles
- screenshots
- extraction
- debug bundles
- API / future MCP tools

Feather Shell
- visual browser shell
- human browsing context
- Cookie Mine
- long-running trust context
- later agent-facing workflows
```

### 4. Add explicit limitations

A good limitations section will increase trust:

- Linux-first;
- Fedora development target;
- Wayland/browser surface still unresolved for shell work;
- GUI shell not the first public adoption path;
- not a general browser replacement yet;
- not a general integration platform.

## Suggested Next Action

Create a concise public-positioning draft:

`docs/public-positioning.md`

Working title:

```text
Feather Public Positioning: Core First, Shell Later
```

It should define:

- one-sentence description;
- target user;
- what Feather does today;
- what Feather does not do yet;
- why this is useful for agents;
- current platform limits;
- relationship between Feather Core and Feather Shell;
- near-term open-source adoption strategy.

## Working Principle

Do not try to make Feather look broader than it is.

Make it look sharper.

The open-source opportunity is not:

> Everyone should use Feather as their browser.

The better opportunity is:

> Developers building local agents can use Feather as their browser runtime.

That is a smaller promise, but a much stronger one.
