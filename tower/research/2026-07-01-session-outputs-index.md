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

## Workflow 3 — Chunk 3 level-mechanism research
- **Status:** running at this checkpoint. Outputs (design doc + `raw/` mechanism receipts) append here on completion.
