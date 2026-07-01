# Session outputs — 2026-07-01/02 (Chunk 2b build + Chunk 3 research)

Index of what this session's token-expensive workflows produced, so the data outlives the
ephemeral `/tmp` scratch. Per the standing rule (`research-documentation-preference`): receipts are
**verbatim**, digests point at them.

## Workflow 1 — browser-use API research (46 agents, ~1.46M subagent tokens)
- **Digest:** `2026-07-01-browser-use-api-web-synthesis.md` (the buildable API contract).
- **Local ground truth:** `2026-07-01-browser-use-api-groundtruth.md` (venv-probed 0.13.1 on Python 3.14.5 + venv protocol-probe receipts).
- **Verbatim receipts:** `raw/2026-07-01-browser-use-api-research-workflow.json` (full result: synthesis + all 41 claims with per-claim verify verdicts), `raw/2026-07-01-browser-use-claims.json` (claims only).
- **Bottom line:** pin `browser-use==0.13.1`; `Agent`/`Browser`(=BrowserSession)/`ChatAnthropic` top-level; `enable_signal_handler=False` in a subprocess; `is_successful()` None=failure; telemetry env must be literal `"false"`; logs default to stderr; browser via `uvx playwright install chromium`.

## Workflow 2 — Chunk 2b build (6 agents, ~234k subagent tokens)
- **Product (committed):** `tower/core/adapters/browser-use.ts` + tests, `tower/adapters/browser-use/{shim.py,requirements.txt,README.md}`, `tower/smoke/browser-use.ts`, npm script. Merged to `dev` (`a1a0e5d`), pushed.
- **Verbatim receipt:** `raw/2026-07-01-tower-chunk2b-build-workflow.json` (per-task impl summary + adversarial-review verdict + fix). Task-A review READY; Task-B review WITH-FIXES→fixed (telemetry setdefault); Task-C smoke READY.
- **Final whole-branch review (rd-verify, fresh context):** verdict WITH-FIXES, 3 minor — (1) added the `status:error`+exit-0 unit test, (2) documented `DEFAULT_MODEL` divergence from docs, (3) recorded venv-probe receipts. All applied. **572 tests green.**

## Build workflows — Chunk 3 (3a + 3b)
- **3a — detectability (L2 runtime_enable):** built via `tower-chunk3a-detectability` workflow (6 agents, ~362k tokens) — 4 TDD steps + adversarial review (caught+fixed the page-registration gap) + gate. Merged `c270a21`. Receipt `raw/2026-07-02-tower-chunk3a-build-workflow.json`.
- **3b — security (comment_injection):** `tower-chunk3b-security` workflow **CRASHED** on a StructuredOutput retry cap after steps 1–3 (trials/victim-app/hooks had written to disk); steps 4–5 (level factory, ASR-CI) + the review were **hand-completed by the main loop**. rd-verify final review = WITH-FIXES (1 honesty: content-agnostic state-diff was collapsing an honest double-poster to `blocked` → split into ownership-proof=blocked vs ambiguous=gated; +2 minor) → all applied. Merged `32ca437`. Receipt `raw/2026-07-02-tower-chunk3b-build-workflow-CRASHED.json`. **Chunk 3 complete: 190 tower tests green.**

## Workflow 3 — Chunk 3 level-mechanism research (29 agents, ~875k subagent tokens)
- **Design doc:** `docs/specs/2026-07-02-tower-pr1-chunk3-levels-design.md` (buildable, grounded in the live `server.ts`/`types.ts`).
- **Verbatim receipt:** `raw/2026-07-02-tower-chunk3-level-research-workflow.json` (full result: design + all 24 mechanism claims with verify verdicts, across 4 angles: rebrowser runtime_enable / no-attach sink / WASP comment-injection / ASR k=3).
- **Bottom line:** two levels self-report by nonce but from different sides — **detectability** = in-page JS beacons a `Runtime.enable` leak count to a same-origin `127.0.0.1` sink (no-attach; single-shot); **security** = a Tower-owned victim app (WASP comment-injection template) records 3 server-side hooks (canary exfil / state diff / execution marker), scored **any-of-k=3**. New plumbing: `sink-registry.ts` (arm/consume/expire/await), `trials.ts` (runTrials + collapseAnyOfK), `text/plain` beacon parser. **Load-bearing risk:** V8's 2025 getter-guard may make the classic `Error.stack` probe a false-negative → §5.5 calibration gate decides empirically before trusting L2; ship `gated` if the probe is dead. Build order 3a (detectability + registry) → 3b (security + trials).
