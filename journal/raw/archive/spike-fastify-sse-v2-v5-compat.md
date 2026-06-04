# Spike: fastify-sse-v2 + Fastify v5 compatibility
# Date: 2026-06-03 | S1 Session 1C

## Question
Does our SSE plugin `fastify-sse-v2` (currently ^4.2.2) support Fastify v5?
This gates the S3 Fastify v4→v5 migration.

## Method
`npm view fastify-sse-v2 version | peerDependencies | dist-tags`; releases page + raw package.json from repo.

## Findings
- Latest version: 4.2.2 (January 2026)
- fastify peer range: `>=4` — covers v5 by range
- devDependencies fastify: `^4.10.2` — tested against v4 only
- No release mentions Fastify v5 support
- Source: https://github.com/nodefactoryio/fastify-sse-v2/releases

## Result: PARTIAL — range permits v5, but untested against it

The peerDep `>=4` technically allows v5, but the plugin was developed and CI-tested
exclusively against Fastify v4.10.x. Fastify v4→v5 introduced breaking changes to the
plugin registration API (`fastify.register()` lifecycle, `done()` removal for async
plugins). Whether fastify-sse-v2 works against v5 is unknown without running the suite.

## Implication for S3
- **Cannot assume it works.** S3 must explicitly test `fastify-sse-v2@4.2.2` against
  Fastify v5 as Step 0.
- **If it passes:** Fastify v5 migration is straightforward — bump fastify + run tests.
- **If it fails:** S3 must choose a workaround:
  1. Pin `fastify-sse-v2` and keep Fastify v4 (security risk — v4 LTS ended June 2025).
  2. Replace `fastify-sse-v2` with a v5-compatible alternative (e.g., `@fastify/sse`, or
     a hand-rolled async-generator SSE handler — the existing `src/transport/sse.ts`
     already has the pattern).
  3. Fork and patch `fastify-sse-v2` for v5 (low-cost if the change is just removing `done()`).
- **Recommended S3 approach:** test first; only escalate to replacement if test fails.
