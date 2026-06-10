# Feather Codebase Topology

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the codebase topology using curated Graphify results and source-verified interpretation.

## Graph Snapshot
- 135 files
- 719 nodes
- 1592 edges
- 39 communities
- No import cycles detected
- Graph built from commit c0a3c0a9

## God Nodes
- **FeatherPaths**: filesystem layout bridge.
- **FeatherSession**: in-memory browser context and page state.
- **CommandContext**: command handler shared context type.
- **CommandHandler**: transport-separated command pattern.
- **SessionManager**: lifecycle orchestrator and registry.
- **ProfileLock**: persistent profile collision prevention.
- **WorkspaceMetadata**: persistent workspace metadata owner.
- **startHttpServer**: HTTP transport bootstrap.
- **resolveActionable**: input target resolution core.

## Human-Named Communities
Major functional areas include transport layer, command handlers, session lifecycle, browser automation, and integration tests.

## Blast Radius Notes
Changes to god nodes like `FeatherSession` or `SessionManager` have significant downstream effects requiring thorough testing.

## Import Cycles
No import cycles detected, indicating a clean architectural layering.

## Weak or Isolated Nodes
Some utility scripts and spike code remain loosely coupled.

## Graphify Limitations
Graphify is useful for static structure, imports, calls, and blast-radius hints.
Graphify should not be treated as perfect dynamic-call truth.
Interface dispatch can hide direct runtime calls, so critical call paths are cross-checked against TypeScript source.

## Architecture Questions This Source Can Answer
Use this source to map dependencies, understand code boundaries, and trace command flows.
