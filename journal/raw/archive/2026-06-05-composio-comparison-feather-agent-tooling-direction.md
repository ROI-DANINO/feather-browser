# Inbox: Composio Comparison and Feather Agent Tooling Direction

Status: idea / strategic note
Priority: medium
Do not implement immediately

## Context

Composio appears to operate in an adjacent layer to Feather, not as a direct competitor.

Feather is currently a browser runtime for agentic automation: local Chromium / Playwright sessions, persistent and disposable profiles, HTTP control API, snapshots, extraction, screenshots, debug bundles, profile locks, logs, and Linux-first runtime concerns.

Composio is positioned more as an agent tooling / integration / authentication layer: connectors, tool calls, delegated auth, MCP gateway, sandboxed execution, and integrations with external apps and APIs.

## Core Conclusion

Composio is not a direct competitor to Feather. It operates at the agent tool / integration / auth layer, while Feather operates at the browser runtime / session automation layer.

The useful insight is that Feather can become the browser-native missing tool inside broader agent systems.

In short:

- Composio connects agents to applications and APIs.
- Feather connects agents to the web itself through a controllable browser runtime.

## Strategic Positioning

Feather should not try to become a Composio clone.

Feather should stay focused on being:

> Browser-native runtime for agents when APIs are not enough.

This means Feather becomes valuable when:

- an app or website has no useful API;
- visual state matters;
- login cookies / persistent profiles matter;
- browser screenshots or page snapshots are needed;
- automation needs a real Chromium runtime;
- debugging browser automation requires artifacts, logs, screenshots, traces, and reproducible sessions.

## What Not To Build

Do not turn Feather into:

- a generic integration marketplace;
- a Gmail / Slack / Notion wrapper;
- a general OAuth platform;
- a full agent framework;
- a Composio competitor;
- a SaaS connector hub before the browser runtime is mature.

## Useful Inspiration From Composio

The useful ideas to borrow conceptually are:

- tool discovery;
- tool manifests;
- MCP gateway / MCP server support;
- permission levels;
- risk levels per tool;
- session identity models;
- delegated/authenticated runtime flows;
- guardrails before risky browser actions;
- context-aware sessions.

These should be adapted to Feather's browser-runtime domain, not copied as a broad integration platform.

## Possible Feather Direction

A strong future direction is to expose Feather as an MCP Browser Runtime.

Potential agent-facing tools:

```text
feather.launch_session
feather.navigate
feather.snapshot
feather.extract
feather.screenshot
feather.click
feather.type
feather.submit
feather.debug_bundle
feather.close_session
```

This would allow Feather to plug into agent systems as a browser tool layer while keeping the existing HTTP API and internal command-handler architecture intact.

## Architecture Note

The existing separation between command handlers and HTTP transport appears aligned with this direction. If command logic is not coupled to Fastify, the same core operations could later be exposed through MCP, JSON-RPC, WebSocket, or another agent-facing protocol without rewriting the browser runtime.

## Suggested Next Action

Do not implement MCP immediately.

First next action:

> Draft an agent-facing Feather Tool Manifest that describes the current HTTP API capabilities as tools.

The manifest should include, for each tool:

- tool name;
- description;
- input schema;
- output shape;
- required session state;
- risk level;
- whether it is read-only or action-taking;
- whether user confirmation should be required.

## Candidate Tool Risk Levels

Initial rough classification:

```text
Low risk:
- feather.snapshot
- feather.screenshot
- feather.extract
- feather.debug_bundle

Medium risk:
- feather.launch_session
- feather.navigate
- feather.click
- feather.type

High risk:
- feather.submit
- actions that send forms, confirm purchases, delete content, change account settings, or publish content
```

## Roadmap Placement

This should be treated as a strategic direction / future architecture note, not an immediate implementation task.

Recommended placement:

- keep in inbox for later review;
- use as input for Phase 4 / Phase 5 planning;
- revisit after the visual desktop shell and core browser runtime stabilize.

## Working Summary

Feather's opportunity is not to compete with tool platforms like Composio.

The opportunity is to become the browser-native execution layer that those ecosystems still need when API tools are not enough.
