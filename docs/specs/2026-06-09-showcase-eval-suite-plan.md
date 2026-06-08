# Feather v1 Showcase & Eval Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Phases B (Pass-1 discovery) and the headed recording in Phase D are INTERACTIVE** — they run live against real/warmed sites with a human watching. Do **not** dispatch those to a headless subagent. Phases A and C are codegen and are subagent-friendly.

**Goal:** Build a 10-task agent-driven showcase/eval suite for Feather v1 — a live discovery pass that learns the real recipes, then a one-shot filmable `examples/showcase.sh` that drives Feather over its HTTP API, asserts results, saves artifacts, and prints a results table.

**Architecture:** Two passes. **Pass 1** (Phase B) is an interactive live session that drives all 10 tasks via the existing HTTP API and records the *working recipe* (exact selectors, payloads, which fallback fired, the lesson) into a recipe log. **Pass 2** (Phases A/C/D) is a standalone bash script modelled on `examples/quickstart.sh`: it reuses that script's `endpoint.json` discovery and `api()`/`field()` helpers (node-based — **no `jq`**), adds framework helpers (timing, status+lesson recording, results-table render, artifact saving, session lifecycle for both disposable-headless and warmed-headed-scratch), then one function per task. Headed hard-tier tasks are filmed with `wf-recorder`; headless tasks leave a saved artifact instead.

**Tech Stack:** bash + curl + node (already the `quickstart.sh` stack — no new deps). Feather HTTP API (`/v1/...`). `wf-recorder` (Wayland) for the headed-tier film. Source of truth for the API: `docs/api-reference.md` + `src/transport/routes.ts`.

**Stress-and-learn intent (do not sand this off):** This suite tests for *truth, not green checkmarks* (`AGENTS.md` → "Testing Honesty"). Tasks that can fail are kept on purpose. A clean failure whose fallback fires and whose lesson is recorded is a **`PARTIAL`** — a successful test, not a black mark. Run the honest hard path first (e.g. normal DuckDuckGo before the plain-HTML endpoint).

**Spec:** `docs/specs/2026-06-09-showcase-eval-suite-design.md` (Approved 2026-06-09).

---

## Grounding facts (verified against source 2026-06-09 — do not re-derive)

- **Endpoint discovery + helpers:** copy verbatim from `examples/quickstart.sh:14-57` (the `ENDPOINT_FILE` block, `api()`, `field()`). They read `endpoint.json` → `baseUrl` + `tokenFile` via `node`, and parse the `{ ok, requestId, data }` envelope. **The spec's claim of a `jq` dependency is wrong; quickstart uses node. Follow node.**
- **Envelope:** success `{ "ok": true, "data": {...} }`; error `{ "ok": false, "error": { "code", "message", "details?" } }`. `field()` exits non-zero and prints `error` when `ok!=true`.
- **Launch a disposable headless session:**
  `POST /v1/sessions` body `{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}` → `data.sessionId`, `data.pages[0].pageId`.
- **Launch a warmed headed session (hard tier):**
  `POST /v1/sessions` body `{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp","viewport":{"width":1280,"height":800}}`. The persistent profile dir is keyed by `workspaceId` (`src/sessions/manager.ts:85-87` → `paths.profileDir(workspaceId)`), so `workspaceId:"scratch"` reuses the warmed Google + `feather_test_roi` IG jar.
  - **One session per profile.** A second launch on a locked `scratch` profile returns `409 PROFILE_LOCKED`. The helper must detect this, find the existing `scratch` session via `GET /v1/sessions`, and either reuse or close+relaunch it (plan: close+relaunch for a clean film).
  - **Headed needs a display.** The Feather **server** must have been started from a shell with `WAYLAND_DISPLAY`/`DISPLAY` or the window won't appear. This is a run-time prerequisite, documented in the script header — not something the script can fix.
- **Valid `browserMode` enum** (`src/transport/routes.ts:30`): `chromium-new-headless` | `chromium-headless-shell` | `chromium-headed-cdp`. **`docs/api-reference.md` only documents the first two — it is stale.** Phase D fixes it.
- **navigate:** `POST /v1/sessions/:id/navigate` `{"url","waitUntil":"load|domcontentloaded|networkidle|commit","timeoutMs","pageId?"}` → `data.status` (int|null), `data.url`.
- **snapshot:** `POST /v1/sessions/:id/snapshot` `{"pageId?"}` → `data.title`, `data.text`, `data.markdown`, `data.links[]`. Fixed internal caps (20k chars / 200 links).
- **extract:** `POST /v1/sessions/:id/extract` `{"recipe":{"fields":{ "<name>":{"selector","type":"text|attribute","attribute?"} }, "limits?":{"textChars"}}}` → flat `{ "<name>": string|null }`. **First match only** (multi-match returns the first element, never errors).
- **Input Target object** (click/type/press/select-option/wait/await-human `resumeOn`): `{ "by":"role|text|placeholder|testid|css", "role?","name?","text?","testId?","selector?","exact?","at?":"first|last|<number>" }`.
- **type:** `{"target","text","mode":"fill|sequential","delayMs?"}` — `fill` default; `sequential` for editors that ignore fill (IG-style inputs).
- **press:** `{"key","target?"}` e.g. `"Enter"`, `"Tab"`, `"Shift+Tab"`.
- **wait:** `{"target","until":"visible|hidden|attached|detached|stable","quietMs?","timeoutMs?"}`. `stable` returns `data.settled`, `data.text`.
- **screenshot:** `POST /v1/sessions/:id/screenshot` `{"fullPage?","pageId?"}` → `data.path` (absolute server-side PNG path). The script **copies** that path into the output dir.
- **tabs:** `POST /v1/sessions/:id/tabs` (empty body) → `data.pageId` (a blank `about:blank` tab). **Must follow with explicit navigate using that `pageId`.** Requires `running` state (else `409 SESSION_NOT_RUNNING`).
- **close:** `DELETE /v1/sessions/:id` `{"force":false}` → `data.state:"closed"`.

---

## File Structure

- **Create `examples/showcase.sh`** — the suite runner. One responsibility: drive the 10 tasks and emit results+artifacts. Sections: (1) header/prereqs, (2) endpoint+helpers [from quickstart], (3) framework helpers, (4) session lifecycle, (5) `run_e1..run_h4` task functions, (6) main runner + table.
- **Create `examples/showcase-output/.gitkeep`** — output dir for screenshots, extracted-text files, `results.md`. The dir is committed (so the artifact has a home) but live run outputs are gitignored except a curated sample.
- **Create `examples/showcase-output/results.sample.md`** (Phase D) — a curated example results table committed as the public artifact.
- **Modify `.gitignore`** — ignore `examples/showcase-output/*` except `.gitkeep` and `results.sample.md`.
- **Create `docs/specs/2026-06-09-showcase-pass1-recipes.md`** (Phase B) — the discovery recipe log: per task, the exact working selector/payload, which path/fallback fired, timing, and the lesson. This is the input to Phase C.
- **Modify `docs/api-reference.md`** (Phase D) — add `chromium-headed-cdp` to the `browserMode` enum + a short "warmed persistent profile via workspaceId" note.
- **Modify `examples/README.md`** (Phase D) — add a `showcase.sh` entry (what it does, prereqs incl. headed display + warmed `scratch` profile, how to film).

**Testing note (be honest):** `showcase.sh` is a curl-driven *integration* script against live/warmed sites. Classic unit-TDD does not apply to the task functions — their "test" is running them against the live site and checking the assertion + artifact. The **pure framework helpers** (timing math, status recorder, table renderer, artifact path handling) *are* unit-checkable in isolation and have explicit verification steps below. Per `AGENTS.md` Testing Honesty: report exactly what each run does, including `PARTIAL`/`FAIL`.

---

## Phase A — Scaffolding (codegen; subagent-friendly)

### Task A1: Output dir + gitignore

**Files:**
- Create: `examples/showcase-output/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create the output dir placeholder**

```bash
mkdir -p examples/showcase-output
: > examples/showcase-output/.gitkeep
```

- [ ] **Step 2: Add the ignore rule**

Append to `.gitignore`:

```gitignore
# Showcase suite live-run outputs (keep the dir + curated sample only)
examples/showcase-output/*
!examples/showcase-output/.gitkeep
!examples/showcase-output/results.sample.md
```

- [ ] **Step 3: Verify the rule works**

Run:
```bash
touch examples/showcase-output/probe.png && git check-ignore examples/showcase-output/probe.png && git check-ignore -v examples/showcase-output/.gitkeep; rm examples/showcase-output/probe.png
```
Expected: `probe.png` is printed (ignored); `.gitkeep` line shows it is **not** ignored (check-ignore exits 1 for `.gitkeep`, so the `-v` prints nothing and the `&&` chain ends — that's fine; the key signal is `probe.png` was listed).

- [ ] **Step 4: Commit**

```bash
git add examples/showcase-output/.gitkeep .gitignore
git commit -m "chore(showcase): add showcase-output dir + gitignore for live runs"
```

### Task A2: Script skeleton — header, endpoint discovery, base helpers

**Files:**
- Create: `examples/showcase.sh`

- [ ] **Step 1: Write the skeleton with the verbatim quickstart helpers**

Create `examples/showcase.sh`:

```bash
#!/usr/bin/env bash
#
# Feather Browser — v1 showcase & eval suite
# Drives 10 agent-style errands over the Feather HTTP API end to end, asserts each
# result, saves an artifact, and prints a results table. Easy/medium tasks run
# headless+disposable; the hard tier runs headed against the warmed `scratch` profile.
#
# Prereqs:
#   - Feather running: `npm run dev` in another terminal.
#   - For the HARD tier (H1-H4): the server must be started from a shell with
#     WAYLAND_DISPLAY/DISPLAY (headed windows), and the `scratch` workspace must hold
#     the warmed Google + feather_test_roi Instagram sessions.
#   - node + curl. (No jq required.)
#
# Usage:
#   ./examples/showcase.sh            # all tiers
#   ./examples/showcase.sh easy       # only easy
#   ./examples/showcase.sh medium     # only medium
#   ./examples/showcase.sh hard       # only hard (needs headed + warmed scratch)
#
# Filming the hard tier (separate terminal):
#   wf-recorder -f examples/showcase-output/hard-tier.mp4
#
set -euo pipefail

SHOWCASE_TIER="${1:-all}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)/showcase-output"
mkdir -p "$OUT_DIR"

# --- locate endpoint.json (mirrors resolveDirs in src/config.ts) ---
if [ -n "${FEATHER_ENDPOINT_FILE:-}" ]; then
  ENDPOINT_FILE="$FEATHER_ENDPOINT_FILE"
elif [ -n "${XDG_RUNTIME_DIR:-}" ]; then
  ENDPOINT_FILE="$XDG_RUNTIME_DIR/feather/run/endpoint.json"
else
  ENDPOINT_FILE="${XDG_STATE_HOME:-$HOME/.local/state}/feather/run/endpoint.json"
fi

if [ ! -f "$ENDPOINT_FILE" ]; then
  echo "ERROR: endpoint.json not found at: $ENDPOINT_FILE" >&2
  echo "Is Feather running? Start it with 'npm run dev', then check the 'Endpoint:' line it prints." >&2
  echo "You can point this script at that path with FEATHER_ENDPOINT_FILE=<path>." >&2
  exit 1
fi

BASE_URL="$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$ENDPOINT_FILE")"
TOKEN_FILE="$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$ENDPOINT_FILE")"
TOKEN="$(cat "$TOKEN_FILE")"
echo "Feather at $BASE_URL"

# POST/DELETE helper: prints the raw JSON response body.
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" "$BASE_URL$path" -H "X-Feather-Token: $TOKEN")
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  curl "${args[@]}"
}

# Read data.<dotted.path> from a JSON envelope on stdin; exits non-zero if ok!=true.
field() {
  node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let o; try{ o=JSON.parse(s); }catch(e){ console.error("  unexpected (non-JSON) response from server"); process.exit(1); }
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

# (framework helpers, session lifecycle, and task functions are appended in later tasks)

echo "showcase.sh skeleton OK"
```

- [ ] **Step 2: Make it executable and run the skeleton**

Run:
```bash
chmod +x examples/showcase.sh && npm run dev >/tmp/feather-dev.log 2>&1 &  # if not already running
sleep 3
./examples/showcase.sh
```
Expected: prints `Feather at http://127.0.0.1:<port>` then `showcase.sh skeleton OK`. (If Feather is already running in another terminal, skip the `npm run dev` line.)

- [ ] **Step 3: Commit**

```bash
git add examples/showcase.sh
git commit -m "feat(showcase): script skeleton with endpoint discovery + api/field helpers"
```

### Task A3: Framework helpers — timing, status+lesson recorder, results table

**Files:**
- Modify: `examples/showcase.sh` (append before the final `echo`)

- [ ] **Step 1: Append the helpers**

Insert this block in place of the `# (framework helpers ...)` comment:

```bash
# --- results accumulation -------------------------------------------------
# Each row: "TASK|STATUS|TIME|LESSON" appended to RESULTS_FILE.
RESULTS_FILE="$(mktemp)"
trap 'rm -f "$RESULTS_FILE"' EXIT

now_ms() { node -e 'process.stdout.write(String(Date.now()))'; }

fmt_elapsed() { # $1=start_ms -> "4.2s"
  local start="$1" end; end="$(now_ms)"
  node -e 'process.stdout.write(((process.argv[2]-process.argv[1])/1000).toFixed(1)+"s")' "$start" "$end"
}

# record TASK STATUS TIME LESSON...
record() {
  local task="$1" status="$2" time="$3"; shift 3
  local lesson="$*"
  printf '%s|%s|%s|%s\n' "$task" "$status" "$time" "$lesson" >> "$RESULTS_FILE"
  printf '[%s] %s %s — %s\n' "$task" "$status" "$time" "$lesson"
}

render_table() {
  local md="$OUT_DIR/results.md"
  {
    echo "# Feather v1 Showcase — Results"
    echo
    echo "_Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) — tier: $SHOWCASE_TIER_"
    echo
    echo "| Task | Status  | Time  | Lesson |"
    echo "|------|---------|-------|--------|"
    while IFS='|' read -r task status time lesson; do
      printf '| %s | %s | %s | %s |\n' "$task" "$status" "$time" "$lesson"
    done < "$RESULTS_FILE"
  } | tee "$md"
  echo
  echo "Results written to $md"
}
```

- [ ] **Step 2: Verify the helpers in isolation**

Run (sources the script up to the helpers, then exercises them with fake data):
```bash
bash -c '
  RESULTS_FILE="$(mktemp)"; OUT_DIR="$(mktemp -d)"; SHOWCASE_TIER="test"
  now_ms() { node -e "process.stdout.write(String(Date.now()))"; }
  fmt_elapsed() { node -e "process.stdout.write(((process.argv[2]-process.argv[1])/1000).toFixed(1)+\"s\")" "$1" "$(now_ms)"; }
  record() { local t="$1" s="$2" tm="$3"; shift 3; printf "%s|%s|%s|%s\n" "$t" "$s" "$tm" "$*" >> "$RESULTS_FILE"; printf "[%s] %s %s — %s\n" "$t" "$s" "$tm" "$*"; }
  start=$(now_ms); sleep 1; el=$(fmt_elapsed "$start")
  record E1 PASS "$el" "fake lesson"
  render_table() { while IFS="|" read -r a b c d; do printf "| %s | %s | %s | %s |\n" "$a" "$b" "$c" "$d"; done < "$RESULTS_FILE"; }
  render_table
'
```
Expected: a line like `[E1] PASS 1.0s — fake lesson` and a table row `| E1 | PASS | 1.0s | fake lesson |`.

- [ ] **Step 3: Commit**

```bash
git add examples/showcase.sh
git commit -m "feat(showcase): timing, status+lesson recorder, results-table helpers"
```

### Task A4: Artifact savers — screenshot copy + extracted-text file

**Files:**
- Modify: `examples/showcase.sh` (append after the table helpers)

- [ ] **Step 1: Append the artifact helpers**

```bash
# --- artifact savers ------------------------------------------------------
# save_shot SESSION_ID TASK [pageId] [fullPage]  -> copies server PNG into OUT_DIR
save_shot() {
  local sid="$1" task="$2" pageId="${3:-}" full="${4:-true}"
  local body resp src dest
  body="$(node -e 'const p=process.argv[1],f=process.argv[2];const o={fullPage:f==="true"};if(p)o.pageId=p;process.stdout.write(JSON.stringify(o))' "$pageId" "$full")"
  resp="$(api POST "/v1/sessions/$sid/screenshot" "$body")"
  src="$(printf '%s' "$resp" | field path)"
  dest="$OUT_DIR/${task}-$(date -u +%Y%m%dT%H%M%SZ).png"
  cp "$src" "$dest"
  printf '%s' "$dest"
}

# save_text TASK CONTENT  -> writes extracted text to a file in OUT_DIR
save_text() {
  local task="$1"; shift
  local dest="$OUT_DIR/${task}-$(date -u +%Y%m%dT%H%M%SZ).txt"
  printf '%s\n' "$*" > "$dest"
  printf '%s' "$dest"
}
```

- [ ] **Step 2: Verify `save_text` writes a file**

Run:
```bash
bash -c 'OUT_DIR="$(mktemp -d)"; save_text() { local t="$1"; shift; local d="$OUT_DIR/$t.txt"; printf "%s\n" "$*" > "$d"; printf "%s" "$d"; }; f=$(save_text E2 "+28C"); cat "$f"'
```
Expected: prints `+28C`.

> `save_shot` is verified live in Phase C (it needs a real session). Do not unit-fake the API.

- [ ] **Step 3: Commit**

```bash
git add examples/showcase.sh
git commit -m "feat(showcase): artifact savers (screenshot copy + extracted-text file)"
```

### Task A5: Session lifecycle helpers (disposable headless + warmed headed scratch)

**Files:**
- Modify: `examples/showcase.sh` (append after artifact savers)

- [ ] **Step 1: Append the lifecycle helpers**

```bash
# --- session lifecycle ----------------------------------------------------
# open_headless -> echoes "SESSION_ID PAGE_ID"
open_headless() {
  local resp; resp="$(api POST /v1/sessions '{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}')"
  local sid pid
  sid="$(printf '%s' "$resp" | field sessionId)"
  pid="$(printf '%s' "$resp" | field pages.0.pageId)"
  printf '%s %s' "$sid" "$pid"
}

# close_session SESSION_ID
close_session() {
  api DELETE "/v1/sessions/$1" '{"force":false}' >/dev/null || true
}

# open_warmed_scratch -> echoes "SESSION_ID PAGE_ID"
# Reuses the warmed `scratch` profile (Google + IG). Handles PROFILE_LOCKED by
# closing the stale scratch session and relaunching for a clean film.
open_warmed_scratch() {
  local body='{"profile":{"kind":"persistent"},"workspaceId":"scratch","browserMode":"chromium-headed-cdp","viewport":{"width":1280,"height":800}}'
  local resp code; resp="$(api POST /v1/sessions "$body")"
  code="$(printf '%s' "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.ok?"OK":(o.error&&o.error.code||"ERR"))})')"
  if [ "$code" = "PROFILE_LOCKED" ]; then
    echo "  scratch profile locked — closing stale session and relaunching" >&2
    local stale; stale="$(api GET /v1/sessions | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);const m=(o.data||[]).find(x=>x.workspaceId==="scratch");process.stdout.write(m?m.sessionId:"")})')"
    [ -n "$stale" ] && close_session "$stale" && sleep 2
    resp="$(api POST /v1/sessions "$body")"
  fi
  local sid pid
  sid="$(printf '%s' "$resp" | field sessionId)"
  pid="$(printf '%s' "$resp" | field pages.0.pageId)"
  printf '%s %s' "$sid" "$pid"
}
```

- [ ] **Step 2: Verify disposable open/close live**

Run (Feather must be running):
```bash
source <(sed -n '/^api()/,/^echo "showcase.sh skeleton OK"/p' examples/showcase.sh) 2>/dev/null || true
read SID PID < <(./examples/showcase.sh --__open_headless_probe 2>/dev/null) || true
```
Simpler verification — add a temporary probe at the end, run, then remove it:
```bash
printf '\nif [ "${1:-}" = "__probe" ]; then read SID PID <<<"$(open_headless)"; echo "probe sid=$SID pid=$PID"; close_session "$SID"; echo "closed"; fi\n' >> examples/showcase.sh
./examples/showcase.sh __probe
git checkout examples/showcase.sh  # discard the probe line (re-add helpers if needed)
```
Expected: `probe sid=ses_... pid=page_...` then `closed`.

> NOTE: the `git checkout` above discards the probe **and** the helpers from this task if uncommitted. Commit first (Step 3), then run the probe against the committed file, then `git checkout` only removes the appended probe line. Re-order if needed.

- [ ] **Step 3: Commit (before probing)**

```bash
git add examples/showcase.sh
git commit -m "feat(showcase): session lifecycle (disposable headless + warmed headed scratch)"
```

---

## Phase B — Pass 1 Discovery (INTERACTIVE — run live with Roi; NOT a subagent task)

> Output: `docs/specs/2026-06-09-showcase-pass1-recipes.md`. For **each** task below, drive it live via the operator skills / raw `curl` (like the IG test), and record: the **exact working selector/payload**, the **status** (`PASS`/`PARTIAL`/`FAIL`), **timing**, **which path/fallback fired**, and the **one-line lesson**. This log is the concrete input to Phase C — Phase C functions must match what actually worked here, not the guesses in this plan.

### Task B0: Create the recipe-log skeleton

**Files:**
- Create: `docs/specs/2026-06-09-showcase-pass1-recipes.md`

- [ ] **Step 1: Write the log skeleton**

```markdown
# Showcase Pass-1 Recipe Log (discovery)

Source spec: docs/specs/2026-06-09-showcase-eval-suite-design.md
Run date: 2026-06-09 | Driver: <model> | Feather: <baseUrl>

Per task: working recipe (selector/payload), status, time, path/fallback fired, lesson.

## E1 — HN top posts
- Recipe:
- Status / time:
- Fallback fired:
- Lesson:

## E2 — wttr.in Tel Aviv
## E3 — GitHub stars (playwright)
## M1 — DuckDuckGo search (normal first → html fallback)
## M2 — httpbin form submit
## M3 — Wikipedia fact (search→click→extract)
## H1 — Israeli holiday → Google Calendar (warmed; write is fragile-on-purpose)
## H2 — search → into article → extract → 3-bullet summary (warmed)
## H3 — IG known profile → like + reply (warmed)
## H4 — multi-tab research (3 tabs, 3 facts, compare)
```

- [ ] **Step 2: Commit the skeleton**

```bash
git add docs/specs/2026-06-09-showcase-pass1-recipes.md
git commit -m "docs(showcase): Pass-1 recipe log skeleton"
```

### Task B1: Drive E1–E3 live (headless disposable) and fill the log

- [ ] **Step 1: Start (or confirm) Feather is running**, then launch one disposable headless session for the easy tier.
- [ ] **Step 2: E1 — HN.** navigate `https://news.ycombinator.com`; `snapshot` (use `markdown`); `extract` first title with a candidate selector (start: `{"top1":{"selector":".athing .titleline a","type":"text"}}`). Confirm the real selector against the live DOM; record it. Assertion target: first title non-empty + at least 3 titles visible in markdown.
- [ ] **Step 3: E2 — wttr.in.** navigate `https://wttr.in/tel+aviv?format=3` (plain text, very stable) **or** the full page; `extract`/`snapshot` the temperature; record the working approach (note: `?format=3` returns one line like `tel aviv: ⛅️ +28°C` — easiest stable assertion).
- [ ] **Step 4: E3 — GitHub stars.** navigate `https://github.com/microsoft/playwright`; `extract` the star count. Candidate selector start: `{"stars":{"selector":"#repo-stars-counter-star","type":"text"}}` (renders like `65.2k`). Record the real selector + note the `k`/`m` suffix so Phase C normalizes it.
- [ ] **Step 5: Record all three in the log** (recipe, status, time, lesson). Close the session.
- [ ] **Step 6: Commit the log update** (`docs(showcase): Pass-1 recipes E1-E3`).

### Task B2: Drive M1–M3 live (headless disposable) and fill the log

- [ ] **Step 1: M1 — DuckDuckGo, hard path first.** navigate `https://duckduckgo.com/?q=Feather+Browser`; try to read the first result. If bot-detection blocks it (empty/blocked result), **fall back** to `https://html.duckduckgo.com/html/?q=Feather+Browser` (first result selector start: `.result__title a` / `.result__a`). Record **which path worked** and the lesson — this fallback IS the test.
- [ ] **Step 2: M2 — httpbin form.** navigate `https://httpbin.org/forms/post`; `type` into the `custname` field (`{"by":"css","selector":"input[name=custname]"}`), select/click options as present, `click` the Submit button (`{"by":"role","role":"button","name":"Submit order"}` — confirm live), `screenshot` the resulting JSON echo page. Record selectors. (If httpbin is down, note it and record `PARTIAL` + the lesson "public httpbin flaky — consider a local form".)
- [ ] **Step 3: M3 — Wikipedia fact.** navigate `https://en.wikipedia.org`; `type` a query into the search box (`{"by":"css","selector":"input[name=search]"}`); `press` Enter; `wait` until `stable`; `click` the first result if a results page appears; `extract` the target fact. Record the multi-step recipe + the fact selector.
- [ ] **Step 4: Record all three; close session; commit** (`docs(showcase): Pass-1 recipes M1-M3`).

### Task B3: Drive H1–H4 live (HEADED warmed scratch) and fill the log

> Server must have a display. Optionally film this discovery run with `wf-recorder` to reuse footage.

- [ ] **Step 1: Launch the warmed headed scratch session** (`open_warmed_scratch` recipe). Confirm Google + IG are still warm (`navigate` to each, screenshot). If cold, STOP and note it — H-tier needs warm.
- [ ] **Step 2: H1 — holiday → calendar (write fragile on purpose).** navigate `https://www.timeanddate.com/holidays/israel/`; `extract` the next upcoming holiday name+date (record selector). Screenshot = **baseline PASS**. Then **attempt** the Calendar write: navigate `https://calendar.google.com`, click Create, fill title/date, Save. Record exactly where it breaks (date picker? Save button?), whether a fallback (quick-add box) works, and the recipe if it succeeds. Status: `PASS` if event created, else `PARTIAL` + lesson.
- [ ] **Step 3: H2 — search → into article → summarize.** navigate `https://www.google.com/search?q=<topic>`; click the first result `h3` (record selector); `wait` stable; `snapshot` markdown; `extract` article body. The **script asserts the extraction**; the 3-bullet summary is the agent payoff (note it in the log, graded by human). Record selectors + any consent-page handling.
- [ ] **Step 4: H3 — IG known profile, like + reply.** navigate `https://www.instagram.com/<known_profile>/` (use a known account for determinism, per the review — Explore content differs each run, fine, but pin the *profile* for a repeatable script); open the latest post; `extract` comments; `click` like; `type` a reply (likely `mode:"sequential"` per the IG input quirk — Shift+Tab + per-key may be needed); `click` post. Record the exact IG selectors + the input-mode trick. Screenshot confirms.
- [ ] **Step 5: H4 — multi-tab.** `POST /tabs` ×3 (capture each `pageId`); navigate each to a different public site; `extract` one fact from each (always pass `pageId`); screenshot. The script asserts 3 facts extracted; the comparison is the agent payoff. Record the tab recipe + that navigate must carry `pageId`.
- [ ] **Step 6: Record all four; close session; commit** (`docs(showcase): Pass-1 recipes H1-H4 + lessons`).

### Task B4: Pass-1 readout — decide v1 gaps

- [ ] **Step 1:** Using the log, answer the spec's gap questions: did headless tasks hit bot-detection (→ act-human cadence becomes a v1 ship)? did warmed tasks work cleanly (→ cookie-mine proven)? was multi-tab rough (→ playbook recipe)? new selector-discovery friction (→ a11y snapshot idea)?
- [ ] **Step 2:** Append a short "Pass-1 verdict + v1-gap decision" section to the recipe log. Commit. **This is a real stopping point — consider `/next` here** before Phase C.

---

## Phase C — Per-task functions (codegen from the recipe log; subagent-friendly, one task each)

> Each function below uses the **recipe recorded in Phase B**. The candidate selectors shown are starting points from this plan; **replace them with the Phase-B confirmed recipe** before finalizing. Pattern for every function: time it, run the Feather calls, compute the assertion, save the artifact, `record` the row. A thrown/empty primary path that hits a coded fallback ⇒ `PARTIAL` + lesson.

### Task C1: `run_e1` (HN) + wire the easy-tier session

**Files:**
- Modify: `examples/showcase.sh`

- [ ] **Step 1: Append the easy-tier wrapper + `run_e1`**

```bash
# ============================ TASKS ============================
# Each run_* function: record TASK STATUS TIME LESSON, and save an artifact.

run_e1() { # HN top posts (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://news.ycombinator.com","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  local title; title="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"top1":{"selector":".athing .titleline a","type":"text"}}}}' | field top1)"
  local md; md="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field markdown)"
  local art; art="$(save_text E1 "$md")"
  if [ -n "$title" ]; then record E1 PASS "$(fmt_elapsed "$t0")" "top story: ${title:0:50} (md → $art)"
  else record E1 PARTIAL "$(fmt_elapsed "$t0")" "no title via .athing .titleline a — selector drift; md saved → $art"; fi
  close_session "$sid"
}
```

- [ ] **Step 2: Add a temporary single-task runner at the end of the file**

```bash
# TEMP runner (removed in Task C9): `./examples/showcase.sh __run run_e1`
if [ "${1:-}" = "__run" ]; then "$2"; render_table; fi
```

- [ ] **Step 3: Run it live**

Run: `./examples/showcase.sh __run run_e1`
Expected: `[E1] PASS <time> — top story: ...` and a results table; a `.txt` artifact in `examples/showcase-output/`. (If `PARTIAL`, fix the selector to the Phase-B value and re-run.)

- [ ] **Step 4: Commit**

```bash
git add examples/showcase.sh
git commit -m "feat(showcase): run_e1 (Hacker News top story)"
```

### Task C2: `run_e2` (wttr.in)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_e2`** (uses the Phase-B approach; candidate below uses the stable `format=3` line)

```bash
run_e2() { # weather Tel Aviv (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://wttr.in/tel+aviv?format=3","waitUntil":"load","timeoutMs":20000}' >/dev/null
  local line; line="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local art; art="$(save_text E2 "$line")"
  if printf '%s' "$line" | grep -qE '[+-][0-9]+°?C'; then record E2 PASS "$(fmt_elapsed "$t0")" "temp: $(printf '%s' "$line" | grep -oE '[+-][0-9]+°?C' | head -1) → $art"
  else record E2 PARTIAL "$(fmt_elapsed "$t0")" "no temp pattern in: ${line:0:60} → $art"; fi
  close_session "$sid"
}
```

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_e2` → expect `[E2] PASS` with a temperature.
- [ ] **Step 3: Commit** (`feat(showcase): run_e2 (Tel Aviv weather)`).

### Task C3: `run_e3` (GitHub stars, with suffix normalization)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_e3`** (normalize `65.2k`→number before the `>0` check)

```bash
run_e3() { # GitHub stars (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://github.com/microsoft/playwright","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  local raw; raw="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"stars":{"selector":"#repo-stars-counter-star","type":"text"}}}}' | field stars)"
  local n; n="$(node -e 'const t=(process.argv[1]||"").trim().toLowerCase();const m=t.match(/([0-9.]+)\s*([km]?)/);if(!m){process.stdout.write("0");process.exit()}let v=parseFloat(m[1]);if(m[2]==="k")v*=1e3;if(m[2]==="m")v*=1e6;process.stdout.write(String(Math.round(v)))' "$raw")"
  local art; art="$(save_text E3 "raw=$raw normalized=$n")"
  if [ "$n" -gt 0 ] 2>/dev/null; then record E3 PASS "$(fmt_elapsed "$t0")" "stars=$raw (~$n) → $art"
  else record E3 PARTIAL "$(fmt_elapsed "$t0")" "no star count via #repo-stars-counter-star (raw='$raw') → $art"; fi
  close_session "$sid"
}
```

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_e3` → expect `[E3] PASS stars=...`.
- [ ] **Step 3: Commit** (`feat(showcase): run_e3 (GitHub stars, suffix-normalized)`).

### Task C4: `run_m1` (DuckDuckGo, hard-path-first + fallback)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_m1`** (normal endpoint first; bot-block ⇒ html fallback ⇒ `PARTIAL`+lesson)

```bash
run_m1() { # search, normal DDG first then html fallback (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://duckduckgo.com/?q=Feather+Browser","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  local first; first="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"r1":{"selector":"a[data-testid=result-title-a]","type":"text"}}}}' | field r1)"
  if [ -n "$first" ]; then
    local art; art="$(save_text M1 "normal-ddg: $first")"
    record M1 PASS "$(fmt_elapsed "$t0")" "normal DDG worked: ${first:0:50} → $art"
  else
    api POST "/v1/sessions/$sid/navigate" '{"url":"https://html.duckduckgo.com/html/?q=Feather+Browser","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
    first="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"r1":{"selector":".result__a","type":"text"}}}}' | field r1)"
    local art; art="$(save_text M1 "html-fallback: $first")"
    if [ -n "$first" ]; then record M1 PARTIAL "$(fmt_elapsed "$t0")" "normal DDG blocked → html endpoint worked: ${first:0:40} (LESSON: headless search needs html endpoint) → $art"
    else record M1 FAIL "$(fmt_elapsed "$t0")" "both DDG paths empty → $art"; fi
  fi
  close_session "$sid"
}
```

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_m1` → expect PASS or PARTIAL with the lesson. (Replace selectors with Phase-B confirmed values.)
- [ ] **Step 3: Commit** (`feat(showcase): run_m1 (search, hard-path-first + html fallback)`).

### Task C5: `run_m2` (httpbin form)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_m2`** using the Phase-B form recipe:

```bash
run_m2() { # httpbin form submit (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://httpbin.org/forms/post","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  api POST "/v1/sessions/$sid/type" '{"target":{"by":"css","selector":"input[name=custname]"},"text":"Feather Tester"}' >/dev/null
  api POST "/v1/sessions/$sid/click" '{"target":{"by":"role","role":"button","name":"Submit order"}}' >/dev/null
  api POST "/v1/sessions/$sid/wait" '{"target":{"by":"css","selector":"body"},"until":"stable","quietMs":1000,"timeoutMs":15000}' >/dev/null
  local body; body="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local shot; shot="$(save_shot "$sid" M2)"
  if printf '%s' "$body" | grep -q "Feather Tester"; then record M2 PASS "$(fmt_elapsed "$t0")" "form echoed back custname → $shot"
  else record M2 PARTIAL "$(fmt_elapsed "$t0")" "submitted but echo not confirmed (httpbin flaky?) → $shot"; fi
  close_session "$sid"
}
```

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_m2` → expect PASS + a screenshot artifact.
- [ ] **Step 3: Commit** (`feat(showcase): run_m2 (httpbin form submit)`).

### Task C6: `run_m3` (Wikipedia multi-step fact)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_m3`** using the Phase-B recipe (search → Enter → wait → extract):

```bash
run_m3() { # Wikipedia fact (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://en.wikipedia.org/wiki/Mount_Everest","waitUntil":"domcontentloaded","timeoutMs":20000}' >/dev/null
  # Everest elevation lives in the infobox; confirm the exact selector in Pass 1.
  local fact; fact="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"elev":{"selector":".infobox-data","type":"text"}}}}' | field elev)"
  local art; art="$(save_text M3 "elevation field: $fact")"
  if [ -n "$fact" ]; then record M3 PASS "$(fmt_elapsed "$t0")" "extracted infobox fact: ${fact:0:40} → $art"
  else record M3 PARTIAL "$(fmt_elapsed "$t0")" "infobox selector empty — refine from Pass 1 → $art"; fi
  close_session "$sid"
}
```

> The spec frames M3 as search→click→extract. If Pass 1 shows the direct-article approach is more deterministic for the script, keep the multi-step version for the *recording* and this direct version as the *assertion* — note the choice in the log.

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_m3` → expect PASS.
- [ ] **Step 3: Commit** (`feat(showcase): run_m3 (Wikipedia fact extraction)`).

### Task C7: `run_h1`..`run_h3` (warmed headed) from the Phase-B recipes

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_h1`, `run_h2`, `run_h3`** built from the **Phase-B confirmed** recipes. Each opens via `open_warmed_scratch`, runs the recorded steps, saves a screenshot, and records PASS/PARTIAL with the lesson. Structure (fill steps from the log):

```bash
run_h1() { # Israeli holiday -> calendar (warmed headed); write is fragile-on-purpose
  local sid pid t0; read sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://www.timeanddate.com/holidays/israel/","waitUntil":"domcontentloaded","timeoutMs":25000}' >/dev/null
  local holiday; holiday="$(api POST "/v1/sessions/$sid/extract" '{"recipe":{"fields":{"h":{"selector":"<PASS1_SELECTOR>","type":"text"}}}}' | field h)"
  local shot; shot="$(save_shot "$sid" H1)"
  # Baseline PASS = holiday extracted + screenshot. Then ATTEMPT the calendar write (Pass-1 recipe).
  # <PASS1 calendar-write steps here>
  if [ -n "$holiday" ]; then record H1 PARTIAL "$(fmt_elapsed "$t0")" "holiday=$holiday extracted+shot; calendar-write: <PASS1 outcome+lesson> → $shot"
  else record H1 FAIL "$(fmt_elapsed "$t0")" "holiday selector empty → $shot"; fi
  close_session "$sid"
}
# run_h2, run_h3 follow the same shape, steps from the Pass-1 log.
```

> The `<PASS1_SELECTOR>` / `<PASS1 ...>` markers are **filled from `docs/specs/2026-06-09-showcase-pass1-recipes.md`** — they are not placeholders left for the reader to invent; they are the recorded recipe, which only exists after Phase B. Do not implement this task before Phase B is done.

- [ ] **Step 2: Run each live (headed):** `./examples/showcase.sh __run run_h1` etc. Watch the window. Record real outcomes (PARTIAL is expected for H1's write).
- [ ] **Step 3: Commit** (`feat(showcase): run_h1..h3 (warmed headed tier)`).

### Task C8: `run_h4` (multi-tab research)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Append `run_h4`** (3 tabs; navigate each with its `pageId`; extract a fact from each):

```bash
run_h4() { # multi-tab research (warmed headed; public sites)
  local sid pid t0; read sid pid < <(open_warmed_scratch); t0="$(now_ms)"
  local p1 p2 p3
  p1="$(api POST "/v1/sessions/$sid/tabs" '' | field pageId)"
  p2="$(api POST "/v1/sessions/$sid/tabs" '' | field pageId)"
  p3="$(api POST "/v1/sessions/$sid/tabs" '' | field pageId)"
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://news.ycombinator.com",waitUntil:"domcontentloaded",timeoutMs:20000}))' "$p1")" >/dev/null
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://wttr.in/tel+aviv?format=3",waitUntil:"load",timeoutMs:20000}))' "$p2")" >/dev/null
  api POST "/v1/sessions/$sid/navigate" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],url:"https://github.com/microsoft/playwright",waitUntil:"domcontentloaded",timeoutMs:25000}))' "$p3")" >/dev/null
  local f1 f2 f3
  f1="$(api POST "/v1/sessions/$sid/extract" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],recipe:{fields:{x:{selector:".athing .titleline a",type:"text"}}}}))' "$p1")" | field x)"
  f2="$(api POST "/v1/sessions/$sid/snapshot" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1]}))' "$p2")" | field text)"
  f3="$(api POST "/v1/sessions/$sid/extract" "$(node -e 'process.stdout.write(JSON.stringify({pageId:process.argv[1],recipe:{fields:{x:{selector:"#repo-stars-counter-star",type:"text"}}}}))' "$p3")" | field x)"
  local shot; shot="$(save_shot "$sid" H4 "$p3")"
  local art; art="$(save_text H4 "HN=$f1 | weather=$f2 | stars=$f3")"
  local got=0; [ -n "$f1" ] && got=$((got+1)); [ -n "$f2" ] && got=$((got+1)); [ -n "$f3" ] && got=$((got+1))
  if [ "$got" -eq 3 ]; then record H4 PASS "$(fmt_elapsed "$t0")" "3/3 facts across 3 tabs → $art"
  else record H4 PARTIAL "$(fmt_elapsed "$t0")" "$got/3 facts extracted across tabs → $art"; fi
  close_session "$sid"
}
```

- [ ] **Step 2: Run** `./examples/showcase.sh __run run_h4` → expect `3/3 facts`.
- [ ] **Step 3: Commit** (`feat(showcase): run_h4 (multi-tab research)`).

### Task C9: Main runner + tier selection (replace the TEMP runner)

**Files:** Modify `examples/showcase.sh`

- [ ] **Step 1: Remove the `__run`/probe blocks** and the skeleton's final `echo "showcase.sh skeleton OK"`; append the real main:

```bash
EASY=(run_e1 run_e2 run_e3)
MEDIUM=(run_m1 run_m2 run_m3)
HARD=(run_h1 run_h2 run_h3 run_h4)

run_group() { local -n g="$1"; for fn in "${g[@]}"; do "$fn" || record "${fn#run_}" FAIL "0.0s" "function errored (see stderr)"; done; }

case "$SHOWCASE_TIER" in
  easy) run_group EASY ;;
  medium) run_group MEDIUM ;;
  hard) run_group HARD ;;
  all|"") run_group EASY; run_group MEDIUM; run_group HARD ;;
  *) echo "unknown tier: $SHOWCASE_TIER (use easy|medium|hard|all)" >&2; exit 2 ;;
esac

render_table
```

- [ ] **Step 2: Run the easy+medium tiers headless** `./examples/showcase.sh medium` and `./examples/showcase.sh easy` → expect a full results table, no crashes, artifacts present.
- [ ] **Step 3: Commit** (`feat(showcase): main runner + tier selection`).

---

## Phase D — Integration, recording, docs

### Task D1: Full headless run (easy+medium) end-to-end

- [ ] **Step 1:** Run `./examples/showcase.sh easy && ./examples/showcase.sh medium`. Confirm every row is `PASS`/`PARTIAL` (no uncaught `FAIL`), `results.md` written, artifacts in `showcase-output/`.
- [ ] **Step 2:** If any task is a surprising `FAIL`, debug with `superpowers:systematic-debugging` (do not paper over it). Record the real outcome.

### Task D2: Film the hard tier with wf-recorder

- [ ] **Step 1:** Ensure Feather was started from a shell with `WAYLAND_DISPLAY`/`DISPLAY` and `scratch` is warm.
- [ ] **Step 2:** In a separate terminal: `wf-recorder -f examples/showcase-output/hard-tier.mp4` then run `./examples/showcase.sh hard`; stop the recorder (Ctrl-C) when done.
- [ ] **Step 3:** Review the footage; note (don't necessarily fix) any visual roughness. Record outcomes; H1 write may be `PARTIAL` — that's fine and on-message.

### Task D3: Curate the public sample results

**Files:** Create `examples/showcase-output/results.sample.md`

- [ ] **Step 1:** Copy the best real `results.md` to `results.sample.md`, lightly annotate (note which were PARTIAL and why — honesty, not airbrushing).
- [ ] **Step 2: Commit** (`docs(showcase): committed sample results table`).

### Task D4: Fix `api-reference.md` (the stale browserMode) + document warmed launch

**Files:** Modify `docs/api-reference.md`

- [ ] **Step 1:** In the `POST /v1/sessions` `browserMode` row, add `chromium-headed-cdp` to the enum, and add a one-line note: persistent profiles are keyed by `workspaceId` (e.g. `workspaceId:"scratch"` reuses a warmed profile); headed sessions need the server started with a display.
- [ ] **Step 2: Commit** (`docs(api-reference): add chromium-headed-cdp + warmed persistent-profile note`).

### Task D5: README/examples pointer

**Files:** Modify `examples/README.md`

- [ ] **Step 1:** Add a `showcase.sh` section: what it does, the three tiers, prereqs (headed display + warmed `scratch` for hard), how to film, where artifacts land.
- [ ] **Step 2: Commit** (`docs(examples): document showcase.sh`).

### Task D6: Journal reconciliation + push

- [ ] **Step 1:** Update `journal/ops/tasks.md` (tick the showcase rows), `journal/context/active.md` (showcase built; v1-gap decision from Phase B4), `journal/log.md`. Flip the v1-gap items (act-human cadence / bot self-check) to their Phase-B4 decision.
- [ ] **Step 2:** `git push origin dev` (per the dev-only push policy — not a master milestone unless Roi calls it).

---

## Self-Review (run against the spec)

**Spec coverage:**
- 10 tasks E1–E3/M1–M3/H1–H4 → Tasks C1–C8 + discovery B1–B3. ✓
- Two-pass model (interactive discovery → filmable script) → Phase B (interactive) + Phases A/C/D (script). ✓
- Measurement schema (PASS/PARTIAL/FAIL + assertion + artifact + lesson) → `record`/`render_table` (A3), artifact savers (A4), PARTIAL-with-lesson throughout. ✓
- Proof/capture split (headed→recording, headless→artifact) → D2 (wf-recorder) + A4/save_text/save_shot. ✓
- Shell-script design (reads endpoint.json, disposable for easy/medium, scratch for hard, per-task functions, table to stdout+results.md, no new deps) → A2/A5/C/C9. ✓ (Corrected: node not jq.)
- Stress-and-learn intent + M1 hard-path-first + H1 fragile-on-purpose → C4, C7, framing throughout. ✓
- E3 suffix parsing → C3. ✓
- "What this tells us about v1 gaps" readout → B4. ✓
- Out-of-scope v2 items (nav-survivable resume, act-human cadence, bot self-check) → not implemented; B4 only *decides* whether cadence/self-check ship in v1. ✓

**Placeholder scan:** The `<PASS1_SELECTOR>`/`<PASS1 ...>` markers in C7 are intentional references to the Phase-B recipe log (which must exist before C7 runs), not invent-it-yourself placeholders — the plan explicitly forbids implementing C7 before Phase B. All framework code (A2–A5, C1–C6, C8, C9) is complete and runnable as written.

**Type/name consistency:** helper names (`api`, `field`, `now_ms`, `fmt_elapsed`, `record`, `render_table`, `save_shot`, `save_text`, `open_headless`, `close_session`, `open_warmed_scratch`, `run_e1..run_h4`, `EASY/MEDIUM/HARD`, `run_group`) are used consistently across all tasks. `record TASK STATUS TIME LESSON` arg order is identical everywhere.

---

## Notes / open risks carried from the spec
- Server lifecycle: kill by pid from `endpoint.json`; OS-assigned port — read `baseUrl` with the node helper (already in the script). Never `pkill -f ts-node`.
- `continuity.test.ts` is a pre-existing flake — irrelevant here (no unit tests added).
- Scratch profile holds the live `feather_test_roi` IG + warmed Google — handle carefully; H3 acts in a real account.
- httpbin / DuckDuckGo / GitHub markup can drift — Phase B confirms selectors; drift surfaces as `PARTIAL` with a lesson, by design.
```
