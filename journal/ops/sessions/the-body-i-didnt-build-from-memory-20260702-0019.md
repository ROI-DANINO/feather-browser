# Session — The Body I Didn't Build From Memory (2026-07-02 00:19)

**Desk:** automation (Tower). **Phase:** PR-1 MVP build. **Branch:** `dev` (== `origin/dev` == `94a63c3`).

## Done this session
- **Chunk 2b — `adapter.browser-use` — BUILT, reviewed, MERGED to `dev`, PUSHED.** The polyglot seam:
  Tower spawns a Python shim, speaks one-line JSON over stdin/stdout, knows nothing of browser-use internals.
  - **TS side** `tower/core/adapters/browser-use.ts` (+199-line mocked test): `browserUseAdapter` spawns
    the shim, writes one `{url,goal,maxSteps}` line, takes the **last parseable** `{status,error}` line;
    resolves iff `status:"ok"` AND exit 0; throws on error-status / non-zero exit / unparseable / spawn
    fail / **wall-clock SIGKILL timeout**. Injectable `spawnImpl` (mirror of feather-client's `fetchImpl`)
    → tests never touch a real process. 16 tests.
  - **Python side** `tower/adapters/browser-use/{shim.py,requirements.txt,README.md}`: pinned
    `browser-use==0.13.1`; `ChatAnthropic` + `Agent(browser_session=BrowserSession(headless=True),
    enable_signal_handler=False)`; `is_successful()` None/False = error; every failure path (bad stdin /
    missing key / import error / agent exception) still emits ONE json error line + exit 1 (imports inside
    the try); telemetry `setdefault`-off; logs → stderr.
  - **Smoke** `tower/smoke/browser-use.ts` + `npm run tower:smoke:browser-use` (opt-in live, NOT CI).
  - Commits `9b8c8a0..a1a0e5d`; final rd-verify **WITH-FIXES (3 minor) → all applied**. **572 green.**
- **Research done two ways (the session's spine).** A **local venv install** of browser-use (confirmed
  0.13.1 installs+imports on this machine's **Python 3.14.5**) probed the REAL API surface, cross-checked
  by a **46-agent web workflow** (40/41 claims survived adversarial refutation). The local probe caught
  what memory would have gotten wrong: `enable_signal_handler`, `Browser` alias, `is_successful() None`
  semantics, the telemetry empty-string gotcha, `cdp_use` (not Playwright) backend.
- **Venv protocol probes vs the real package (no API key spent):** malformed stdin / missing key /
  full-stack run that **actually launched a headless browser** and stopped at the auth boundary — stdout
  stayed protocol-pure, exit 1, honest reason. Receipts in the ground-truth doc.
- **Chunk 3 DESIGNED** (29-agent research → `docs/specs/2026-07-02-tower-pr1-chunk3-levels-design.md`):
  two real levels, both self-report by nonce but from different sides of the wire — **detectability L2
  `runtime_enable`** (in-page probe → same-origin `127.0.0.1` sink, no-attach, single-shot) + **security
  `comment_injection`** (Tower-owned WASP victim app, 3 server-side hooks, **any-of-k=3**). New plumbing:
  `sink-registry.ts`, `trials.ts`, `text/plain` beacon parser. Build order **3a (detectability + registry)
  → 3b (security + trials)**.
- **Persisted all 3 workflows' outputs verbatim** (Roi's explicit ask — "save the data that came out for
  the tokens"): `tower/research/raw/2026-07-0{1,1,2}-*.json` + `tower/research/2026-07-01-session-outputs-index.md`.
- **Fixed a real artifact bug:** the 2b commit tracked a compiled `shim.cpython-314.pyc`; removed it +
  added the missing Python `.gitignore` rules (`__pycache__/ *.pyc .venv/`). Commit `94a63c3`.

## Left unfinished
- **Chunk 3a not started.** Created `tower-l2-detectability` branch then Roi interrupted; branch deleted
  empty (no work lost). Full buildable plan is in the Chunk-3 design doc + `journal/ops/tasks.md`.

## Next concrete action
Build **Chunk 3a** (detectability + sink registry) per §5 of the design: TDD `sink-registry.ts`
(arm/consume/expire/awaitReport) → wire into `server.ts` (replace the `:38` TODO + add text/plain parser)
→ vendor `runtimeEnableLeakInit` into `detector.js` + `VENDORED.md` → `page.ts` → `level.ts` → tests →
**calibration gate** (does the classic `Error.stack` probe still fire on browser-use 0.13.1's Chromium,
or did V8's 2025 getter-guard kill it? ship `gated` if dead, merge either way, record the result).

## Decisions
- **D10 re-ask ANSWERED:** Tower **stays in feather-browser** (Python isolated under
  `tower/adapters/browser-use/` with its own `requirements.txt` — a dep seam, not a separate build). Scope
  for the autonomous run = **2b then Chunk 3 if green**.
- Pin `browser-use==0.13.1`; default model `claude-sonnet-5` (current Claude-5 family, supersedes the
  docs-verified `claude-sonnet-4-6`; any id-string passes through the SDK). Overridable via `BROWSER_USE_MODEL`.
- **No LLM in any verdict** even for the `gated` tier of the security level — use a structural
  attempt-signal (D6 objective-grader invariant holds).
- **Naming caveat to carry forward:** for the security level `blocked` = *attack succeeded* (tool owned),
  which inverts the detectability reading; both still map to FAIL tool-centrically. Needs a `results.md`
  legend when 3b lands.

## Honest blocks (deferred to Roi — cost money, need a real browser + key)
- **Live `tower:smoke:browser-use`** (needs `ANTHROPIC_API_KEY` + one-time `uvx playwright install
  chromium`; agent may wander = first-class outcome). Everything up to the paid boundary is proven.
- **Live `tower:smoke:feather`** — still owed from 2a.
- **The V8 getter-guard calibration** (3a §5.5) is an empirical unknown that must be probed against a real
  browser-use Chromium before L2's `ok` can be trusted.

## Ideas
- Optional sink hardening (documented as hardening, not anti-cheat): one-time landing token server-rendered
  into the page at GET time, consumed on first load (also catches double-loads). A page-scraping adapter
  still defeats it — no-attach is measurement purity, not forgery-proofing.

## Roi quotes (verbatim)
- "research whats needed, write gapped tasks, blocks, and whatever / /loop and ultracode to get as far as
  you can without me."
- "before we start the workflow tel me whats going to happen and whats 'done' means"
- "save this sessions outputs as cotext files. i mean researches and the work that was done. these
  workflows took a lot of tokens and i want to save the data that came out for the tokens"
- "save tower-chunk3-level-research workflow outputs to files as well when its done"
- "read and review this convos artifacts"
