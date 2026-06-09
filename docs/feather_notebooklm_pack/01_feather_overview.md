# Feather Browser — Overview for NotebookLM

## Purpose

Feather Browser is a local Chromium runtime for AI agents.

In plain terms: Feather gives an AI agent a real browser session on the user's own machine. The agent can open pages, read what is on the page, extract structured data, click, type, press keys, wait for content, take screenshots, and create debug bundles.

Feather is not trying to be a consumer browser yet. It is infrastructure for local agent-driven browser work when a normal API is not enough.

## The core idea

Many useful web tasks cannot be solved cleanly through APIs:

- Some sites do not expose useful APIs.
- Some pages require logged-in sessions.
- Some workflows depend on visual/browser state.
- Some tasks need cookies and session continuity.
- Some failures need screenshots, traces, logs, and reproducible debugging.

Feather solves this by giving agents controlled access to real Chromium sessions over a small local HTTP API.

## One-line explanation

Feather is a local browser control layer that lets AI agents operate real Chromium sessions safely, repeatably, and debuggably.

## Product metaphor

Feather is not a chatbot and not a scraper.

It is closer to a local browser engine with a steering wheel for agents.

The human warms the browser context through normal use. Feather then lets an agent piggyback on authorized session state under controlled conditions.

This long-term model is called the Cookie Mine: human browsing creates trusted session context, and local agents can later use that context to run errands.

## Who it is for

Feather is for:

- Developers building local AI agents.
- People working with Playwright or browser automation.
- Researchers exploring browser agents.
- Builders who need persistent authenticated sessions.
- Personal AI workflow builders.
- Anyone who needs a browser runtime where API access is not enough.

## What Feather is not

Feather is not:

- A Chrome replacement.
- A general polished desktop browser yet.
- An Arc, Zen, Dia, or Comet competitor today.
- A full agent framework.
- A broad connector or integration platform.
- A production cloud service.

## Current status

Feather currently leads with Feather Core: the local browser runtime, sessions, profiles, page reading, extraction, screenshots, debug bundles, and local HTTP API.

The larger future vision is Feather Shell: a visual desktop browser shell where human browsing and agent work share the same long-running trusted context.

## Infographic emphasis

A good infographic should show Feather as:

1. A real local Chromium runtime.
2. A control API for AI agents.
3. A system with persistent and disposable profiles.
4. A safer path toward agents using real browser sessions.
5. A developer-focused core today, with a larger browser-product vision later.
