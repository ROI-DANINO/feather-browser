# Feather Product Model and Doctrine

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains Feather's product model, Core/Shell split, Cookie Mine concept, and native-by-default doctrine.

## One-Sentence Product Model
Feather is infrastructure for when a plain API isn't enough, providing controlled sessions over a local HTTP API.

## Feather Core
Feather Core is the current open-source surface.

## Feather Shell
Feather Shell is the larger future daily-driver browser shell that owns the long-running primary context.

## Cookie Mine
Cookie Mine means human browsing builds persistent trust context that local agents can later use under explicit control and safety gates.

## Native by Default
Critical product capabilities should be Feather-owned native TypeScript features unless a package is clearly worth buying. Do not depend on Chrome extensions as core product strategy.

## Recipe Books, Not Dependencies
Open-source projects are recipe books consulted per feature, not shopping lists.

## What Feather Is Not
Feather is not a Chrome extension, cloud service, full agent platform, or finished consumer browser.

## Why Human Browsing and Agent Automation Are Coupled
The Phase 4 human browser session is the trust foundation for Phase 5+ agent automation.
