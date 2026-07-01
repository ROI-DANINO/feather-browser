"""Tower <-> browser-use shim.

Protocol (the whole contract with the TS side):
  stdin:  ONE JSON line  {"url": string, "goal": string, "maxSteps"?: number}
  stdout: ONE JSON line  {"status": "ok" | "error", "error": null | string}
  exit:   0 on ok, 1 on error

Nothing but the result line ever goes to stdout — all logging goes to stderr
(browser-use 0.13.1 already logs to stderr by default; we pin our own logging
there too). Every failure path (malformed stdin, missing key, import error,
agent exception) still emits the one JSON error line and exits 1.

Ground truth for the API used here (browser_use 0.13.1, locally probed):
tower/research/2026-07-01-browser-use-api-groundtruth.md
"""

import asyncio
import json
import logging
import os
import sys

DEFAULT_MAX_STEPS = 25  # matches the TS adapter's default (browser-use.ts)
# claude-sonnet-5 = current Sonnet tier (Claude 5 family, newer than the id in
# browser-use's own docs); ChatAnthropic passes any model-id string through to
# the Anthropic SDK. Override with BROWSER_USE_MODEL.
DEFAULT_MODEL = "claude-sonnet-5"

# Telemetry opt-out (ground truth line 28: shim must set both to false). The TS
# side sets these on spawn; setdefault keeps its values authoritative while
# covering bare runs (README manual test, venv probes).
os.environ.setdefault("ANONYMIZED_TELEMETRY", "false")
os.environ.setdefault("BROWSER_USE_CLOUD_SYNC", "false")


def emit(status: str, error: "str | None") -> None:
    """Print the single protocol result line to stdout."""
    sys.stdout.write(json.dumps({"status": status, "error": error}) + "\n")
    sys.stdout.flush()


def main() -> int:
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    log = logging.getLogger("tower-shim")

    try:
        line = sys.stdin.readline()
        task_input = json.loads(line)
        url = task_input["url"]
        goal = task_input["goal"]
        max_steps = int(task_input.get("maxSteps") or DEFAULT_MAX_STEPS)

        # Imported inside the try so a missing/broken install still follows
        # the protocol instead of dumping a traceback.
        from browser_use import Agent
        from browser_use.browser import BrowserSession
        from browser_use.llm import ChatAnthropic

        llm = ChatAnthropic(model=os.environ.get("BROWSER_USE_MODEL", DEFAULT_MODEL))
        agent = Agent(
            task=f"Go to {url} and {goal}",
            llm=llm,
            # headless=True is the only non-default browser flag (spec §11:
            # declare any non-default flag). No safety features disabled.
            browser_session=BrowserSession(headless=True),
            # In a subprocess there is no TTY to pause from; without this the
            # agent installs a Ctrl+C pause handler whose print()/input() is
            # the one stdout-pollution risk (web synthesis §3).
            enable_signal_handler=False,
        )
        log.info("running browser-use agent (max_steps=%d)", max_steps)
        history = asyncio.run(agent.run(max_steps=max_steps))

        if history.is_successful():  # None/False both count as not-success
            emit("ok", None)
            return 0
        errors = [str(e) for e in history.errors() if e is not None]
        emit("error", "; ".join(errors) or "agent did not report success")
        return 1
    except Exception as exc:  # noqa: BLE001 — protocol demands a JSON line, always
        log.exception("shim failed")
        emit("error", f"{type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
