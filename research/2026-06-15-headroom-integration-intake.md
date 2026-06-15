# Research Intake — Headroom integration potential for Feather

> **Reconciliation note (2026-06-15, added on filing).** This intake was auto-generated on the
> branch `research/context-compression-intake` (commit `c9e1ff0`). Filed here under `research/`
> (the durable research home) rather than `journal/raw/_inbox/`, which is kept README-only as a
> triage queue. Two corrections to read it with:
>
> 1. **Kernel = SELECT, not compress.** The body frames the idea around Headroom's
>    *compress-then-retrieve*. The sharper, Feather-native framing is: because Feather is a **loop**,
>    the cheapest win is to **return less and let the agent re-query for the detail it wants**
>    (progressive disclosure / verbosity levels on `observe`/`snapshot`/`extract`). That is lossless,
>    needs **no model**, and has **nothing to leak** — strictly better than running a compressor.
>    Treat the body's `ContextCompressor` / ML-backend material as *one* option, not the spine; an ML
>    compressor would fight Feather's lightweight-core principle and is at most an optional plugin.
> 2. **Status = intake, trigger-gated — NOT a queued spike.** No context pain has been felt yet
>    (Roi: "I didn't feel I need it, just wanted to log the idea"). The polished acceptance-criteria
>    and interface sketches below are raw material, not a teed-up plan. The trigger to revisit is a
>    real errand choking on a giant snapshot.
>
> Backlog breadcrumb: `journal/ops/tasks.md` → Feather v2 → "Perception-output efficiency" points here.

---

Date: 2026-06-15
Status: raw intake for follow-up analysis
Source repo: https://github.com/chopratejas/headroom
Target repo: ROI-DANINO/feather-browser
Branch: research/context-compression-intake

## Why this file exists

Roi asked for a fast research note on whether `chopratejas/headroom` could fit into Feather Browser, with enough context for Claude to continue analysis from this PR.

This is intentionally an intake note, not an implementation decision. Do not add Headroom as a dependency from this file alone.

## Source summary

Headroom presents itself as "the context compression layer for AI agents" and claims to compress what agents read before it reaches the LLM: tool outputs, logs, RAG chunks, files, and conversation history.

Relevant claimed capabilities from the Headroom README:

- Python and TypeScript library usage via `compress(...)`.
- Local proxy mode via `headroom proxy --port 8787`.
- Agent wrapping for Claude, Codex, Cursor, Aider, Copilot.
- MCP server tools: `headroom_compress`, `headroom_retrieve`, `headroom_stats`.
- Cross-agent memory and local deduplication.
- `headroom learn`, which mines failed sessions and writes corrections to `CLAUDE.md` / `AGENTS.md`.
- Reversible CCR compression, where originals are cached and can be retrieved on demand.
- Claimed token savings across agent workloads, with particularly high savings for code search and incident/debugging-style outputs.

Primary link:

```text
https://github.com/chopratejas/headroom
```

## Feather context

Feather is currently a local Chromium runtime for AI agents. It gives agents controlled Chromium sessions over a small localhost HTTP API, including persistent/disposable profiles, page snapshots, structured extraction, screenshots, debug bundles, structured logs, and an eventual transport-separated path toward MCP or other protocols.

Current product shape from `AGENTS.md`: Feather v1 is "It runs errands for me" — an agent-drivable browser runtime with a local HTTP API and an action-shaped perception loop:

```text
observe → act by ref → re-observe
```

Feather is not trying to become a broad agent framework. The current repo rule says future agent-layer work is deferred unless explicitly approved. So Headroom should be evaluated as optional context plumbing around Feather outputs, not as a new core strategy.

## Initial fit assessment

### Strongest fit: compress Feather observation outputs before they hit the LLM

The best integration point is not browser control. Feather already owns browser/session control.

The plausible fit is compressing the material Feather produces for agents:

- `observe` / snapshot payloads
- structured extraction results
- debug bundle summaries
- console/network/error logs
- long page text
- repeated page state across `observe → act → re-observe`
- multi-step task traces
- session handoff material for Claude/Codex/Gemini-style workflows

This directly matches Headroom's stated target: compressing tool outputs, logs, files, and agent history before sending to the LLM.

### Possible product-level value

If validated, this could make Feather feel more practical for real browser-agent work because browser observations can get large quickly. Token cost is not only a provider cost issue; it also affects:

- model context budget
- latency
- ability to preserve longer browser task history
- ability to compare current and previous observation states
- ability to keep debug details available without dumping all of them into the model context

Potentially useful positioning:

```text
Feather drives the browser. Headroom-like compression helps agents afford to read what Feather sees.
```

### Best architecture shape if explored

Prefer a thin, optional adapter layer rather than a hard dependency.

Candidate design:

```text
Feather HTTP API
  → observe/snapshot/extract/debug output
  → optional ContextCompressor interface
  → raw output stored locally
  → compressed output returned to agent
  → retrieval handle allows full raw source to be fetched when needed
```

Possible interface sketch:

```ts
interface ContextCompressor {
  compress(input: FeatherObservationPayload, options: CompressionOptions): Promise<CompressedObservation>;
  retrieve(handle: string): Promise<RawObservationPayload>;
  stats?(): Promise<CompressionStats>;
}
```

Important: keep this interface Feather-owned. Headroom would be one candidate backend, not the abstraction itself.

## Integration options

### Option A — No dependency, just research and steal the pattern

Use Headroom as inspiration only:

- reversible compression
- content-type routing
- stable prefixes for cache friendliness
- local raw artifact store
- explicit retrieval handles
- compression stats

This is lowest risk and likely the right first move.

### Option B — External proxy around agent provider, outside Feather

Run Headroom outside Feather, wrapping Claude/Codex/Cursor while they use Feather.

Pros:

- no Feather code change
- immediate experimentation
- keeps dependency and failure modes outside Feather
- easiest for Claude to test manually

Cons:

- Feather cannot shape its own response contracts around compressed/retrievable observations
- integration remains operator-specific, not productized
- hard to guarantee consistent behavior across agent clients

### Option C — Optional dev-only compression adapter inside Feather

Add a feature-flagged integration that compresses large observation/debug payloads before returning them.

Pros:

- directly targets Feather's context-cost problem
- can keep raw artifacts under `.feather/`
- can expose compression metadata in Feather's own response envelope

Cons:

- new dependency surface
- added failure mode inside core browser control path
- must not alter correctness of observe/action loop
- reversible retrieval must be robust or the agent may lose critical page state

### Option D — MCP-level bridge later

When Feather exposes MCP/other protocols, add compression as MCP middleware or companion MCP tools.

Pros:

- aligns with Feather's transport-separated design
- avoids contaminating HTTP API contract too early
- fits Headroom's MCP story

Cons:

- likely Phase 5+ / future agent layer
- too early for current core readiness unless explicitly scoped as research only

## Recommended next step

Do not implement yet.

Recommended Claude task:

1. Read Headroom docs/repo, especially architecture, proxy, MCP, CCR/retrieval, TypeScript package, license, and dependency footprint.
2. Inspect Feather outputs that can become token-heavy:
   - observe/snapshot response shape
   - extraction response shape
   - debug bundle manifest/log artifacts
   - event stream / JSONL logs
3. Build a small benchmark plan using existing Feather demo/task outputs:
   - raw token count
   - compressed token count
   - retrieval correctness
   - latency overhead
   - failure behavior when compression drops critical information
4. Decide whether the first implementation should be:
   - no-code operator experiment with `headroom wrap claude/codex`, or
   - a Feather-owned `ContextCompressor` interface with a fake/noop backend first.

## Key risks and questions for Claude

### Dependency risk

- Is Headroom mature enough to trust inside Feather's core flow?
- What is the actual TypeScript package quality?
- Is the proxy/library stable, or mostly marketing/demo surface?
- Does it introduce heavy ML dependencies or Python runtime coupling if used from Node?

### Correctness risk

Browser-agent tasks often fail on small details:

- button labels
- disabled/enabled state
- selected tab/content region
- URLs
- error banners
- hidden login state
- dynamic page changes

Compression must not remove the specific detail needed for the next action.

### Security/privacy risk

Feather handles logged-in browser sessions and debug artifacts. Any compression layer must remain local-first and must not leak:

- auth tokens
- cookies
- credentials
- private page content
- debug traces
- profile paths or environment details beyond what is already safe

### Product-scope risk

Feather should not become a general agent memory framework right now. The repo's current rules explicitly classify future agent-layer work as deferred unless approved.

A safe framing is:

```text
Compression for Feather-produced observations and artifacts.
Not cross-agent memory as a product feature.
Not a replacement for Feather's own session/profile/logging model.
```

## Potential acceptance criteria for a later spike

A spike is only useful if it produces measured evidence, not vibes.

Minimum spike outputs:

- one representative Feather observe/snapshot payload before/after compression
- token count comparison
- latency comparison
- retrieval test proving raw content can be recovered
- failure case where compression hides an important UI detail
- recommendation: no-go / operator-only / adapter-interface / product integration

Suggested file output for that later spike:

```text
docs/plans/YYYY-MM-DD-context-compression-spike.md
docs/specs/YYYY-MM-DD-context-compression-design.md  # only if moving beyond research
```

## Provisional verdict

Headroom looks relevant to Feather, but only around context efficiency for agent-facing outputs.

Best short-term use:

```text
Run Headroom outside Feather as an operator experiment while Claude/Codex uses Feather.
```

Best medium-term architecture if validated:

```text
A Feather-owned optional ContextCompressor interface for observe/debug/extract payloads, with raw local artifact retrieval.
```

Do not merge it into core behavior until measured on real Feather browser tasks.
