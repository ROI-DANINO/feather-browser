# browser-use API — local ground-truth probe (2026-07-01)

**Method:** `pip install browser-use` into an isolated venv on THIS machine (Python 3.14.5), then
introspect the installed package with `inspect` + grep its source. This is ground truth for the
version we pin — not web claims. A parallel web-research workflow (sweep → adversarial refutation →
synthesis) cross-checks against official docs; its synthesis is appended below when it lands.

## Pinned facts (verbatim probe output)

- **Version installed:** `browser-use 0.13.1` (PyPI, installed clean on **Python 3.14.5** — no compat problem).
- **Agent:** `from browser_use import Agent`;
  `Agent.__init__` params (first 25): `task, llm, browser_profile, browser_session, browser, tools,
  controller, skill_ids, skills, skill_service, sensitive_data, initial_actions, …, use_vision, …, max_failures, …`
- **Run:** `Agent.run(self, max_steps: int = 500, on_step_start=None, on_step_end=None) -> AgentHistoryList`
  (async — needs `asyncio.run`).
- **Result:** `browser_use.agent.views.AgentHistoryList` has `is_done()`, `is_successful()`,
  `final_result()`, `errors()`, `number_of_steps()`, `total_duration_seconds()`.
- **Anthropic LLM ships inside browser-use** (no langchain needed):
  `from browser_use.llm import ChatAnthropic`; init params include `model, max_tokens, temperature, …,
  api_key, base_url, timeout, max_retries` (api_key defaults from `ANTHROPIC_API_KEY` env).
- **Headless:** `from browser_use import BrowserProfile` (top-level) /
  `browser_use.browser.BrowserSession(headless=…, browser_profile=…, executable_path=…, user_data_dir=…, cdp_url=…)`.
- **Backend is `cdp_use`, NOT Playwright** (probe: `playwright installed: False`, `patchright: False`,
  `cdp_use: True`) — browser-use 0.13 drives Chromium via its own CDP client; it finds a local
  Chromium via `channel`/`executable_path` or provisions its own. Old Playwright-era docs are stale.
- **Telemetry/cloud opt-out** (`browser_use/config.py:58-67`):
  `ANONYMIZED_TELEMETRY` env defaults **true**; `BROWSER_USE_CLOUD_SYNC` defaults to the telemetry
  value. Shim must set both to `false`.
- **stdout safety** (`browser_use/logging_config.py:115,187`): the console log handler defaults to
  **`sys.stderr`** (`logging.StreamHandler(stream or sys.stderr)`) — stdout is safe for the one-line
  JSON protocol; shim still routes its own logging explicitly to stderr as a belt-and-braces.

## Consequences for the shim (`tower/adapters/browser-use/shim.py`)

- `requirements.txt` pins `browser-use==0.13.1`.
- Shim shape: read one JSON line on stdin → `ChatAnthropic(model=…)` + `Agent(task=…, llm=…,
  browser_session=BrowserSession(headless=True))` → `asyncio.run(agent.run(max_steps=N))` →
  map `history.is_successful()` to `{"status":"ok"|"error","error":…}` on stdout → exit 0/1.
- Env the TS side sets when spawning: `ANONYMIZED_TELEMETRY=false`, `BROWSER_USE_CLOUD_SYNC=false`.

## Venv protocol-probe receipts (2026-07-01, Task 2b.5 — verbatim, no API key spent)

Run against the REAL installed browser-use 0.13.1 in the scratch venv (Python 3.14.5):

```
--- probe 1: malformed stdin ---
{"status": "error", "error": "JSONDecodeError: Expecting value: line 1 column 1 (char 0)"}
exit=1
--- probe 2: missing goal key ---
{"status": "error", "error": "KeyError: 'goal'"}
exit=1
--- probe 3: valid input, real browser_use import, NO API key (unset) ---
{"status": "error", "error": "\"Could not resolve authentication method. Expected either api_key
or auth_token to be set. ...\"; Failed to complete task in maximum steps"}
exit=1
--- probe 3 stderr tail ---
INFO:browser_use.BrowserSession... [SessionManager] Cleared all owned data (targets, sessions, mappings)
INFO:browser_use.BrowserSession...: Browser session reset complete
```

Probe 3 is the strong one: the shim **launched a real headless browser** (BrowserSession lifecycle
on stderr), ran the agent loop to the auth boundary, kept stdout protocol-pure (exactly one JSON
line), and exited 1 with an honest reason. `enable_signal_handler=False` accepted. The only
unexecuted path is the paid LLM call — the deferred live smoke.

## Web-research synthesis (landed 2026-07-01)

→ `2026-07-01-browser-use-api-web-synthesis.md` (verbatim; 46 agents, 40/41 claims survived
refutation; receipts `raw/2026-07-01-browser-use-claims.json`). Key deltas it added over the local
probe, then **re-verified locally against the installed 0.13.1** (second probe, all confirmed):

- `from browser_use import Agent, Browser, ChatAnthropic` all work top-level; `Agent` is the
  **classic** agent (`browser_use.agent.service`, not the Rust beta); `Browser is BrowserSession`;
  `Browser(headless=True)` constructs fine; `Agent(browser=…)` alias param exists.
- **`enable_signal_handler=False`** exists on `Agent.__init__` and must be set in a subprocess
  (otherwise Ctrl+C pause `print()`/`input()` machinery exists — the one stdout risk).
- `is_successful()` returns `bool | None` — **treat `None` (never finished / step cap) as failure**;
  `has_errors()` exists.
- Telemetry env parse gotcha: value is truthy if it *starts with* t/y/1 — an **empty string keeps
  telemetry ON**; set the literal `"false"`. Set env **before** `import browser_use`.
- `BROWSER_USE_LOGGING_LEVEL=result` (custom level 35, stderr) quiets step logs.
- Python range `>=3.11,<4.0`; upstream tests only 3.11–3.13 (3.14 unsupported-but-works — our probe
  machine runs it fine; README should recommend 3.12 for strangers).
- **Browser provisioning:** `pip install` downloads NO browser. Provisioning step =
  `uvx playwright install chromium --with-deps --no-shell` (what `uvx browser-use install` runs on
  Linux). Known fragility: browser-use resolves Chromium from Playwright's cache paths (issue #3779).
- PyPI latest = 0.13.1 (tags 0.13.2/0.13.3 exist on GitHub only) — pin stands.
