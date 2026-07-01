# browser-use shim (Tower adapter, Python side)

Isolated venv — never install into the repo's toolchain:

    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

`pip install` downloads **no browser**. One-time provisioning (what `uvx browser-use install`
runs on Linux; browser-use finds Chromium via Playwright's cache):

    uvx playwright install chromium --with-deps --no-shell

Python: upstream pins/tests 3.11–3.13 (`>=3.11,<4.0`); 3.14 installs and imports fine
(probed 2026-07-01) but is untested upstream — prefer 3.12 if provisioning fresh.

Env: `ANTHROPIC_API_KEY` **required** (ChatAnthropic reads it implicitly); `BROWSER_USE_MODEL`
optional (default `claude-sonnet-5`); `ANONYMIZED_TELEMETRY=false` / `BROWSER_USE_CLOUD_SYNC=false`
are set by the TS side on spawn (the shim also defaults both to `false` for bare runs).

Manual protocol test (one JSON line in, one JSON line out, exit 0/1):

    echo '{"url":"https://example.com","goal":"read the page title","maxSteps":5}' | .venv/bin/python shim.py
