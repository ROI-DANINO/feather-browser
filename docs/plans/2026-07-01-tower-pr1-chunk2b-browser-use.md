# Tower PR-1 Chunk 2b — `adapter.browser-use` (implementation plan)

**Spec:** `docs/specs/2026-06-28-tower-pr1-chunk2-adapters-design.md` §6/§9.
**API ground truth:** `tower/research/2026-07-01-browser-use-api-groundtruth.md` (locally probed
browser-use **0.13.1** on Python 3.14.5 — Agent/ChatAnthropic/AgentHistoryList/headless/telemetry/stderr
all verified against the installed package, not docs-from-memory).
**Branch:** `tower-browser-use-adapter` (off `dev`). **D10 answered 2026-07-01: stay in feather-browser.**

## The contract (the whole coupling surface)

```
Tower(TS) ──spawn python3 shim.py──▶ stdin: {"url":…,"goal":…}\n
          ◀── stdout: {"status":"ok"|"error","error":string|null}\n  · exit 0|1
```

TS knows nothing about browser-use; Python knows nothing about the Tower. Env set by TS on spawn:
`ANONYMIZED_TELEMETRY=false`, `BROWSER_USE_CLOUD_SYNC=false` (+ pass-through `ANTHROPIC_API_KEY`).

## Tasks (TDD; impl + independent review per task; final whole-branch review)

- **A — `tower/core/adapters/browser-use.ts` + `browser-use.test.ts`** (mocked child process; no
  Python, no network). `browserUseAdapter(cfg): Adapter` with injectable `spawnImpl` (mirror of
  feather-client's injectable `fetchImpl`). Behavior: write task line → read stdout →
  `status:"ok"` + exit 0 ⇒ resolve; `status:"error"` / non-zero exit / unreadable-or-missing result
  line / spawn failure ⇒ throw with cause; **wall-clock timeout ⇒ SIGKILL + throw**. Drives-never-grades;
  `Adapter` interface unchanged.
- **B — `tower/adapters/browser-use/shim.py` + `requirements.txt` + `README.md`** (venv recipe).
  Pin `browser-use==0.13.1`. Shim: one stdin JSON line → `ChatAnthropic` + `Agent(task, llm,
  browser_session=BrowserSession(headless=True))` → `asyncio.run(agent.run(max_steps))` → ONE stdout
  JSON line → exit 0/1. All shim logging → stderr. Malformed stdin / import failure / any exception ⇒
  `{"status":"error",…}` + exit 1 (never a traceback on stdout).
- **C — `tower/smoke/browser-use.ts` + `npm run tower:smoke:browser-use`** (opt-in live, NOT CI;
  mirrors `tower/smoke/feather.ts`: example.com trivial goal, prints outcome honestly).
- **D — venv protocol probe (no API key, no LLM cost):** run the real shim in the scratch venv with
  (1) malformed stdin, (2) missing `ANTHROPIC_API_KEY` — assert both yield a clean one-line
  `status:"error"` on stdout + exit 1. Proves the protocol against real Python without spending money.
- **E — final whole-branch review + fix loop → merge FF to `dev` → push.**

## Honest blocks (deferred to Roi)

- Live `tower:smoke:browser-use` (real Chromium + `ANTHROPIC_API_KEY`, costs money, agent may wander —
  first-class outcome either way). Same standing block as 2a's live feather smoke.

## Out of scope

Real levels (Chunk 3), scoring/report (Chunk 4), nodriver/Stagehand adapters (PR-2), repo split (D10: stay).
