# browser-use API — web-research synthesis (2026-07-01)

_Verbatim output of the `browser-use-api-research` workflow (46 agents: 4-angle sweep →
adversarial refutation, 40/41 claims survived → synthesis). Receipts: `raw/2026-07-01-browser-use-claims.json`._

---

# Python Shim API Contract for `browser-use` (Tower bench)

Synthesis date 2026-07-01. Every load-bearing fact below is drawn from the verified claims; the one refuted claim is flagged as a warning in §1 and §4.

## 1. PINNED VERSION

- **Pin `browser-use==0.13.1`** in `requirements.txt`. That is the current PyPI release (uploaded 2026-06-10T01:02:04). GitHub tags 0.13.2 (2026-06-12) and 0.13.3 (2026-07-01) exist but are **not on PyPI**, so `pip install browser-use` today resolves to 0.13.1. Pin exactly, and re-verify at install time (`pip show browser-use`) since a 0.13.2/0.13.3 PyPI release could land any day.
- **Python range: `>=3.11,<4.0`** (PyPI metadata for 0.13.1; identical in main's `pyproject.toml`).
- **Python 3.14: NOT supported / untested.** The `<4.0` constraint *permits* installing on 3.14, but upstream gives zero positive signal: CI's package matrix tests only 3.11 and 3.13, `.python-version` pins 3.12, the quickstart uses `uv venv --python 3.12`, and the only trove classifier is the generic `Programming Language :: Python :: 3`. **Target Python 3.12** (upstream's own pin) for the Tower venv.
- **Playwright is NOT a pip dependency** of 0.13.1 (major change vs older releases). Browser control rides on `cdp-use==1.4.5` + `bubus==1.5.6`, with native control behind the optional `[core]` extra (`browser-use-core==0.13.1`, platform-conditional). Do not add `playwright` to `requirements.txt` expecting browser-use to use it as a library — see §4 for how Chromium is actually fetched.

> ⚠️ Warning (refuted claim): one researched claim listed the `[cli]` extra as "empty" and `browser-use-core` deps loosely. Verification showed that description mixed **unreleased main (0.13.3)** with the **0.13.1 release**. For the version you are pinning (0.13.1): `[cli]=textual==7.4.0` (not empty), `[core]` installs `browser-use-core==0.13.1`, and a `[cli-oci]` extra also exists. None of this affects the base install — just don't rely on that claim's extras enumeration.

## 2. THE SHIM CODE CONTRACT

Verbatim minimal `shim.py`. Every element (`from browser_use import Agent, ChatAnthropic`, `ChatAnthropic(model=...)` reading `ANTHROPIC_API_KEY`, `Agent(task=..., llm=..., browser=Browser(headless=True), enable_signal_handler=False)`, `run(max_steps=...)`, `is_successful()`/`final_result()`, auto-kill on `run()`'s finally) is confirmed against the 0.13.1 tag.

```python
import os
import sys
import json
import asyncio

# --- Opt-outs and log routing MUST be set before importing browser_use ---
# (setup_logging + config are read at import time; CONFIG re-reads env per access,
#  but import-time side effects mean set these first.)
os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")
os.environ.setdefault("BROWSER_USE_CLOUD_SYNC", "false")
os.environ.setdefault("BROWSER_USE_LOGGING_LEVEL", "result")  # or "info"
# ANTHROPIC_API_KEY must be present in the environment (read by the Anthropic SDK).

from browser_use import Agent, Browser, ChatAnthropic  # Browser is an alias for BrowserSession


async def run_task(task: str, max_steps: int = 25) -> dict:
    llm = ChatAnthropic(model="claude-sonnet-4-6")  # any Anthropic model id string; see note below
    agent = Agent(
        task=task,
        llm=llm,
        browser=Browser(headless=True),   # 'browser' is the preferred alias for 'browser_session'
        enable_signal_handler=False,       # disable Ctrl+C pause/input() prompt in a subprocess
    )
    history = await agent.run(max_steps=max_steps)  # returns AgentHistoryList
    # Browser is auto-killed by run()'s finally block (keep_alive unset/None).
    return {
        "done": history.is_done(),               # bool
        "successful": history.is_successful(),   # True | False | None (None = never finished)
        "result": history.final_result(),        # str | None
        "has_errors": history.has_errors(),      # bool
    }


def main() -> None:
    task = sys.argv[1] if len(sys.argv) > 1 else "Find the number 1 post on Show HN"
    result = asyncio.run(run_task(task))
    # Own stdout for the JSON-line protocol; browser-use logs go to stderr (see §3).
    print(json.dumps(result))


if __name__ == "__main__":
    main()
```

**Success/failure detection contract** (from `AgentHistoryList` in `agent/views.py`):
- `is_successful() -> bool | None` — the agent's own judgment on its final `done` step. **Treat `None` as failure/not-finished** (e.g. ran out of `max_steps`).
- `final_result() -> str | None` — `extracted_content` of the last action, `None` if none.
- `is_done() -> bool`, `has_errors() -> bool`, `errors() -> list[str | None]` also available.

**Model ID validity** (the three you asked about are all real, current model IDs):
- `claude-sonnet-4-6` — browser-use's own docs/examples use this for `ChatAnthropic`.
- `claude-opus-4-8` — valid; current Opus-tier default.
- `claude-fable-5` — valid; most capable model. Note browser-use **HEAD** `browser_use/llm/anthropic/chat.py` (lines 88–108) carries adaptive-thinking-only validation for `claude-fable-5` / `claude-mythos-5`: it forces auto tool choice and **raises `ValueError` if you pass a `thinking` config of type `enabled`/`disabled` or a `budget_tokens` key** — use adaptive thinking (e.g. `{"type": "adaptive", "display": "summarized"}`) if you configure thinking at all. Since `ChatAnthropic.model` is typed `str | ModelParam`, any of these strings is accepted; the wrapper passes it to `AsyncAnthropic`. `ANTHROPIC_API_KEY` is read from the environment by the SDK when `api_key` is unset.

`max_steps` default is **500** (not 100) and belongs to `run()`, not the `Agent` constructor — always pass an explicit cap (e.g. 25) for the bench.

## 3. STDOUT SAFETY

browser-use 0.13.x is well-behaved for a JSON-line protocol; the shim can own stdout.

- **Logs default to STDERR.** `setup_logging()` uses `logging.StreamHandler(stream or sys.stderr)` (verbatim at 0.13.1). INFO/step logs, CDP logs, and the single telemetry INFO line all land on stderr. (Note: the docstring stale-says "default: sys.stdout" — the code is stderr.)
- **The launched Chromium can't pollute stdout either:** `LocalBrowserWatchdog` spawns the browser with `stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE` — piped, not inherited.
- **Residual stdout risks, both eliminated:** the Ctrl+C pause `print()` (killed by `enable_signal_handler=False`, already in the shim) and `sync/auth.py` prints (unreachable — cloud sync is removed in 0.13.x).
- **Recommended:** print your result JSON to stdout yourself (as in the shim); optionally set `BROWSER_USE_LOGGING_LEVEL=result` (custom level 35, message-only, still on stderr) or `=info`. Logging auto-configures at `import browser_use` unless `BROWSER_USE_SETUP_LOGGING=false`; if you want to own Python logging entirely, set that and configure it yourself.

**Telemetry / cloud opt-outs** (set before import — the shim does this):
- `ANONYMIZED_TELEMETRY=false` — parsed as `os.getenv('ANONYMIZED_TELEMETRY','true').lower()[:1] in 'ty1'`, i.e. any value not starting with t/y/1 disables it. ⚠️ Edge case: an **empty string keeps telemetry ENABLED** (`''[:1] in 'ty1'` is True) — always set the literal `"false"`, never `""`. Even enabled, it only logs one INFO line (to stderr) and posts to PostHog; it never prompts.
- `BROWSER_USE_CLOUD_SYNC=false` — belt-and-suspenders. Cloud sync is already **removed** from the Agent in 0.13.x (`authenticate_cloud_sync()` just warns and returns False); the env var is effectively inert but harmless to set. No cloud auth prompt occurs in a scripted run.

## 4. BROWSER PROVISIONING

- **Nothing in `pip install browser-use` downloads a browser.** Playwright is not a pip dependency of 0.13.1.
- **Chromium is fetched via Playwright's installer, invoked as an external `uvx` tool.** The documented step is `uvx browser-use install`; under the hood `browser_use/cli.py` subprocess-runs `uvx playwright install chromium --no-shell`, appending `--with-deps` on Linux. So on the Tower host (Linux/Fedora) the effective command is:
  ```
  uvx playwright install chromium --with-deps --no-shell
  ```
- **How to pin/control it:** run the install step explicitly as a provisioning stage (don't rely on lazy download at run time). Chromium lands in Playwright's browser cache; browser-use then locates it via those cache paths. ⚠️ Corroborating risk: GitHub issue #3779 shows browser-use broke when **Playwright 1.57.0 changed its install directory** — browser-use resolves Chromium from Playwright's hardcoded cache paths, so a Playwright installer upgrade can move the binary out from under it. To pin: fix the `uvx playwright` version used for the install (e.g. `uvx playwright==<known-good>`), or pre-place/point at a known Chromium and verify browser-use finds it in the venv before trusting the bench.
- To **skip** re-downloading, run the install once during image/venv build; subsequent runs reuse the cache.

## 5. UNKNOWNS & RISKS — probe locally in the venv before trusting

1. **Actual installed version.** Re-check `pip show browser-use` at install; if PyPI has advanced to 0.13.2/0.13.3 the API notes above still hold (they were verified against 0.13.3 too), but **confirm** rather than assume.
2. **Classic vs Rust-beta Agent on 0.13.1.** On the **released** 0.13.1, `from browser_use import Agent` is the **classic Python agent**; `browser_use.beta.Agent` is the new Rust-core agent (the 0.13.1 README quickstart actually imports `from browser_use.beta import ...`). Unreleased HEAD promotes the new agent to top-level. The shim uses the top-level (classic) path deliberately for stability — but verify `from browser_use import Agent` gives you the agent you expect in your pinned build, and that `Browser`/`ChatAnthropic`/`AgentHistoryList` import cleanly.
3. **`browser=` vs `browser_session=` vs `browser_profile=`.** All three are accepted on 0.13.1's `Agent.__init__` (`browser` is the alias, takes precedence; passing both `browser` and `browser_session` raises `ValueError`). The shim uses `browser=`. Confirm against the installed signature (`inspect.signature(Agent.__init__)`) — this was verified at the 0.13.1 tag but is worth a one-line check.
4. **`Browser(headless=True)` direct kwarg.** `Browser` is confirmed an alias for `BrowserSession`, and `BrowserSession.__init__` accepts `headless` directly in its local-mode overload. The all-parameters docs illustrate it via `BrowserProfile(headless=True)` passed as `browser_profile=` rather than the bare kwarg — if `Browser(headless=True)` errors in your build, fall back to `Agent(..., browser_profile=BrowserProfile(headless=True))`. There is also a `BROWSER_USE_HEADLESS` env override. `headless` accepts `True`/`False`/`None` (None = auto-detect, the default).
5. **Chromium discovery after install** (issue #3779 class). Actually run one task end-to-end in the venv after `uvx playwright install chromium` and confirm browser-use launches Chromium — don't trust that install alone wired the paths.
6. **Late env-var setting.** In 0.13.x `CONFIG` re-reads env per access, so late-setting *mostly* works, but import-time side effects (logging setup) argue for setting all env before `import browser_use` — which the shim does. If you must set them after import, verify telemetry/logging actually honored it.
7. **`fable-5` thinking validation.** If you point `ChatAnthropic` at `claude-fable-5`/`claude-mythos-5` **and** configure a `thinking` param, browser-use HEAD raises `ValueError` for non-adaptive thinking. Confirm the behavior in your pinned version (the verbatim check was against HEAD) before using a Claude-5-family model with explicit thinking config.
