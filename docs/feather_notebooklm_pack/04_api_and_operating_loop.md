# Feather API and Agent Operating Loop

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains how an agent discovers Feather, authenticates, and drives the browser loop.

## Endpoint Discovery
Discover the base URL from `endpoint.json` (`baseUrl` field).

## Authentication
Send the token from `tokenFile` in the `X-Feather-Token` header.

## Response Envelope
Every response uses the envelope `{ ok, requestId, data | error }`.

## Basic Session Loop
Launch / navigate / read / observe / act / debug / close loop.

## Reading Pages: Snapshot vs Observe
Snapshot is for reading tasks, while observe provides action-shaped reads (numbered refs, overlays, change-diff).

## Acting by Reference
Use `POST /observe` to get refs, then act-by-ref `{by:"ref",ref:"<observeId>.e<i>"}` on input commands.

```text
observe -> act by ref -> observe -> read diff -> repeat
```

## Human Handoff
`await-human` pauses agent workflows for human resolution.

## Debugging and Evidence
On-demand debug bundles and structured JSONL logs.

## Profile Safety Rules
- Use scratch for sacrificial tests and demos.
- Treat primary as Roi's real personal identity.
- Do not imply agents should freely operate primary before v2 safety gates.
