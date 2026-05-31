# Phase 2 Manual Verification Checklist

Run this checklist against a fresh `.feather/` directory. Use `chromium-headless-shell` mode unless
testing the new headless comparison. Check each item as you verify it.

## Prerequisites

- [ ] `npm install` completed without errors
- [ ] `npx playwright install chromium-headless-shell` completed
- [ ] For `chromium-new-headless` tests: system Chrome or Chromium is installed and accessible on PATH
- [ ] No existing `.feather/` directory in the working directory (or it has been deleted/moved)

---

## Service Startup

- [ ] `npm run dev` starts without error and prints the endpoint URL to stdout
- [ ] `.feather/run/endpoint.json` exists and contains valid JSON with `baseUrl`, `tokenFile`, `pid`, and `startedAt` fields
- [ ] `.feather/run/control-token` exists and contains a non-empty hex token string
- [ ] `GET http://127.0.0.1:<port>/health` returns `{ "ok": true }` (no auth token required)
- [ ] A request to a protected endpoint without the `X-Feather-Token` header returns 401

---

## Persistent Session

- [ ] `POST /v1/sessions` with `profile.kind: "persistent"` and `workspaceId: "default"` returns 200 with `sessionId` and `state: "running"`
- [ ] `GET /v1/sessions/:id` returns a `pages` array with at least one entry
- [ ] `.feather/profiles/default/profile/` directory exists on disk after launch
- [ ] `.feather/profiles/default/lock` file exists on disk after launch
- [ ] `POST /v1/sessions/:id/navigate` to `https://example.com` returns 200 with `url` and numeric `status`
- [ ] `POST /v1/sessions/:id/snapshot` returns 200 with non-empty `text`, a `links` array, and a non-empty `title`
- [ ] `POST /v1/sessions/:id/extract` with recipe `{ fields: { heading: { selector: "h1", type: "text" } } }` returns `{ heading: "Example Domain" }`
- [ ] `POST /v1/sessions/:id/screenshot` returns 200 with `artifactId` and `path`; the PNG file exists at that path on disk
- [ ] `POST /v1/sessions/:id/debug-bundle` returns 200 with `manifest` path; `manifest.json` exists on disk
- [ ] `DELETE /v1/sessions/:id` returns `{ state: "closed" }` and `.feather/profiles/default/lock` is removed
- [ ] Restart service and launch same `workspaceId: "default"` again — browser storage from previous session persists (navigate to a page that set cookies/localStorage, restart, relaunch, navigate back, and confirm data is present)

---

## Disposable Session

- [ ] `POST /v1/sessions` with `profile.kind: "disposable"` returns 200 with a `sessionId`
- [ ] `.feather/tmp/sessions/<id>/profile/` directory exists on disk while the session is running
- [ ] `DELETE /v1/sessions/:id` returns `{ state: "closed" }` and the entire `.feather/tmp/sessions/<id>/` directory is removed from disk

---

## Profile Lock Enforcement

- [ ] Launch a persistent session with `workspaceId: "test-lock"` — succeeds
- [ ] Without closing it, attempt a second `POST /v1/sessions` with the same `workspaceId: "test-lock"` — response is 409 with `error.code: "PROFILE_LOCKED"`
- [ ] Close the first session — `DELETE` returns `{ state: "closed" }`
- [ ] Launch a new persistent session with the same `workspaceId: "test-lock"` — succeeds (returns 200)

---

## Proxy Configuration

- [ ] Launch a session with `proxy: { server: "http://127.0.0.1:9999", username: "user", password: "secret" }` — session launches (proxy failure at navigation time is acceptable)
- [ ] `GET /v1/sessions/:id` response shows `proxy.hasCredentials: true` and `proxy.server: "http://127.0.0.1:9999"` but does NOT include `username` or `password` fields
- [ ] The JSONL log file at `.feather/logs/sessions/<id>.jsonl` does not contain the string `"secret"` anywhere (check with `grep secret .feather/logs/sessions/<id>.jsonl` — should print nothing)

---

## JSONL Logs

- [ ] `.feather/logs/sessions/<id>.jsonl` exists after launching and using a session
- [ ] Each line of the file is valid JSON (check with `cat .feather/logs/sessions/<id>.jsonl | python3 -c "import sys,json; [json.loads(l) for l in sys.stdin]"` — should not raise)
- [ ] Each log line has the fields: `ts`, `level`, `event`, `sessionId`
- [ ] The following events are present (one per line):
  - `session.launch.completed`
  - `page.navigate.completed`
  - `session.close.completed`

---

## Debug Bundle

- [ ] `.feather/debug/<id>/manifest.json` exists after calling `POST /v1/sessions/:id/debug-bundle`
- [ ] `manifest.json` contains: `sessionId`, `workspaceId`, `startedAt`, `endedAt`, `closeReason`, `featherVersion`, `playwrightVersion`, `artifacts`
- [ ] `.feather/debug/<id>/commands.jsonl` exists
- [ ] `.feather/debug/<id>/network-summary.jsonl` exists
- [ ] `.feather/debug/<id>/screenshots/` directory contains the screenshot PNG captured during the session

---

## Resource Measurement

- [ ] Run `npm run test:measurement` — all tests pass
- [ ] `.feather/measurements/<runId>/summary.json` exists (find the runId in test output or check `ls .feather/measurements/`)
- [ ] `summary.json` contains a `results` array with at least one entry, each having `timings.launchMs`, `timings.navigateMs`, `timings.snapshotMs`, `timings.screenshotMs`, `timings.extractMs`, `timings.closeMs`, `timings.totalMs`
- [ ] `.feather/measurements/<runId>/samples.jsonl` exists and has at least 1 line
- [ ] `.feather/measurements/<runId>/scenario.json` exists

**Manual comparison (requires system Chrome for chromium-new-headless):**
- [ ] Edit `tests/measurement/scenario.measurement.test.ts` to also call `runner.run("chromium-new-headless")` and add results to the array before calling `writeArtifacts`
- [ ] Run `npm run test:measurement` again
- [ ] `summary.json` has `comparison.launchMsDiff` showing the difference between the two browser modes

---

## yt-dlp Boundary

- [ ] Confirm no real yt-dlp execution exists in the codebase: `grep -r "yt-dlp\|ytdlp\|youtube-dl" src/` returns no matches with actual subprocess calls
- [ ] `docs/specs/phase-2-headless-core-prototype-plan.md` section "yt-dlp Decision" documents the adapter boundary with the command shape and deferred implementation rationale

---

## Exit Criteria Sign-off

All of the following must be true before Phase 2 is considered complete:

- [ ] The local service launches and closes a persistent headless Chromium session
- [ ] A persistent workspace keeps browser storage across relaunch
- [ ] A disposable session runs and cleans up its temporary profile on close
- [ ] A concurrent launch against the same persistent profile is rejected with PROFILE_LOCKED
- [ ] A session launched with proxy configuration reports only redacted proxy metadata in API responses and logs
- [ ] The HTTP API completes the full sequence: launch → status → navigate → snapshot → extract → screenshot → debug-bundle → close
- [ ] JSONL logs and a debug bundle are written for the session
- [ ] Resource measurement artifacts are written for the chromium-headless-shell scenario
- [ ] The yt-dlp adapter remains deferred with a documented boundary in the spec
