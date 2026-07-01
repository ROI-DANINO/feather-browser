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

## Web-research synthesis (appended when the workflow completes)

_Pending — workflow `browser-use-api-research` (sweep 4 angles → 2-lens refutation → synthesis)._
