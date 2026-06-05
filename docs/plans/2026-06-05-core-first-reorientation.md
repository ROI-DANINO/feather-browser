# Core-First Reorientation + Public Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Feather Core legible and runnable for a stranger (launch-grade README + one verified runnable demo) and resequence the internal steering files to Core-first (Phase 4a) ahead of the shell (Phase 4b).

**Architecture:** Documentation + one demo script. No `src/` feature work, no journal restructuring, no shell work. The demo is built and run *first* because it audits the docs against reality (it already surfaced two doc bugs: the server does not bind `:3000`, and the token file is not `.feather/token`).

**Tech Stack:** Bash + `curl` + `node` (no `jq`). Markdown. The live Feather server (`npm run dev`).

**Spec:** `docs/specs/2026-06-05-core-first-reorientation-design.md`

**Verified facts (from `src/`):**
- Startup prints three lines: `Feather Browser service running at http://127.0.0.1:<port>`, `Token file: <path>`, `Endpoint: <path>`.
- Default `port` is `0` (OS-assigned random) unless `FEATHER_PORT` is set.
- `endpoint.json` lives at `<runtime>/feather/run/endpoint.json` and contains: `{ transport, baseUrl, tokenFile, pid, startedAt }`.
- Token file is `<runtime>/feather/run/control-token`.
- `<runtime>` = `$XDG_RUNTIME_DIR/feather` if `XDG_RUNTIME_DIR` is set, else `${XDG_STATE_HOME:-$HOME/.local/state}/feather` (see `resolveDirs` in `src/config.ts`).
- Page-action endpoints default to the first page when `pageId` is omitted — the demo omits it.

---

## Task 1: The runnable demo (`examples/quickstart.sh`)

Built first: it is the acceptance gate and it audits the docs.

**Files:**
- Create: `examples/quickstart.sh`
- Create: `examples/README.md`

- [ ] **Step 1: Write `examples/quickstart.sh`**

```bash
#!/usr/bin/env bash
#
# Feather Browser — quickstart demo
# Runs the full session loop against a live Feather server, end to end:
#   health -> launch -> navigate -> snapshot -> extract -> screenshot -> debug-bundle -> close
#
# Prereqs: Feather running (`npm run dev` in another terminal), Node.js, and curl.
# Usage:   ./examples/quickstart.sh
#
# Discovery: reads endpoint.json (written at startup) for baseUrl + tokenFile,
# then reads the token. Override the endpoint path with FEATHER_ENDPOINT_FILE
# (use the "Endpoint:" path printed when the server starts).

set -euo pipefail

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

# --- read baseUrl + tokenFile from endpoint.json (node, no jq dependency) ---
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
      const o=JSON.parse(s);
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

echo "1/8  health"
curl -s "$BASE_URL/health" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{if(!JSON.parse(s).ok){console.error("  health not ok");process.exit(1)}console.log("     ok")})'

echo "2/8  launch disposable session"
RESP="$(api POST /v1/sessions '{"profile":{"kind":"disposable"},"viewport":{"width":1280,"height":800}}')"
SESSION_ID="$(printf '%s' "$RESP" | field sessionId)"
echo "     sessionId=$SESSION_ID"

echo "3/8  navigate -> https://example.com"
RESP="$(api POST "/v1/sessions/$SESSION_ID/navigate" '{"url":"https://example.com","waitUntil":"load","timeoutMs":15000}')"
echo "     http status=$(printf '%s' "$RESP" | field status)"

echo "4/8  snapshot"
RESP="$(api POST "/v1/sessions/$SESSION_ID/snapshot" '{}')"
echo "     title=$(printf '%s' "$RESP" | field title)"
echo "     text=$(printf '%s' "$RESP" | field text | head -c 120)..."

echo "5/8  extract (h1)"
RESP="$(api POST "/v1/sessions/$SESSION_ID/extract" '{"recipe":{"fields":{"heading":{"selector":"h1","type":"text"}}}}')"
echo "     heading=$(printf '%s' "$RESP" | field heading)"

echo "6/8  screenshot"
RESP="$(api POST "/v1/sessions/$SESSION_ID/screenshot" '{"fullPage":true}')"
echo "     saved=$(printf '%s' "$RESP" | field path)"

echo "7/8  debug-bundle"
RESP="$(api POST "/v1/sessions/$SESSION_ID/debug-bundle" '')"
echo "     manifest=$(printf '%s' "$RESP" | field manifest)"

echo "8/8  close"
RESP="$(api DELETE "/v1/sessions/$SESSION_ID" '{"force":false}')"
echo "     state=$(printf '%s' "$RESP" | field state)"

echo "Done — full loop succeeded."
```

> Note on `field`: extract responses are a flat `data` object (e.g. `data.heading`), and snapshot/navigate fields (`data.title`, `data.status`, `data.path`, `data.manifest`, `data.state`, `data.sessionId`) are all single-level, so the dotted-path walk resolves correctly for every call above.

- [ ] **Step 2: Write `examples/README.md`**

```markdown
# Examples

## `quickstart.sh` — the 60-second demo

Runs the full Feather session loop against a live server:
**health → launch → navigate → snapshot → extract → screenshot → debug-bundle → close.**

### Prerequisites

- Node.js 20+ and `curl`
- Feather running in another terminal:

  ```bash
  npm run dev
  ```

  Leave it running. It prints an `Endpoint:` line — the demo finds it automatically.

### Run

```bash
./examples/quickstart.sh
```

If it can't find the server, set the endpoint path explicitly to the `Endpoint:` line the
server printed:

```bash
FEATHER_ENDPOINT_FILE=/path/to/feather/run/endpoint.json ./examples/quickstart.sh
```

The script exits non-zero and prints the failing step if anything goes wrong. It uses a
disposable profile against a public page, so it is safe to re-run.
```

- [ ] **Step 3: Make the script executable**

Run: `chmod +x examples/quickstart.sh`
Expected: no output, exit 0.

- [ ] **Step 4: Start the server in the background**

Run:
```bash
npm run dev > /tmp/feather-dev.log 2>&1 &
echo $! > /tmp/feather-dev.pid
sleep 4
cat /tmp/feather-dev.log
```
Expected: log shows `Feather Browser service running at http://127.0.0.1:<port>`, a `Token file:` line, and an `Endpoint:` line.

- [ ] **Step 5: Run the demo and verify it succeeds end-to-end**

Run: `./examples/quickstart.sh`
Expected: lines `1/8` … `8/8` each print a value, `8/8` prints `state=closed`, final line is `Done — full loop succeeded.`, exit 0. If any step fails the script stops with a non-zero exit and an `API error:` line — fix the doc/script mismatch it reveals before continuing.

- [ ] **Step 6: Stop the server**

Run: `kill "$(cat /tmp/feather-dev.pid)" && rm -f /tmp/feather-dev.pid`
Expected: server process exits.

- [ ] **Step 7: Commit**

```bash
git add examples/quickstart.sh examples/README.md
git commit -m "feat(examples): add verified quickstart.sh demo (full session loop)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: README rewrite (artifact-forward, launch-grade)

**Files:**
- Modify: `README.md` (full rewrite of the top; corrects the `:3000` and `.feather/token` bugs; demotes the internal status line)

- [ ] **Step 1: Replace `README.md` with the artifact-forward version**

Write this exact content:

```markdown
# Feather Browser

**Feather is a local Chromium runtime for AI agents.**

It gives agents (and you) controlled, real Chromium sessions over a small local HTTP API —
persistent or disposable profiles, page snapshots, structured extraction, screenshots, and
debug bundles. It is infrastructure for when a plain API isn't enough: sites with no useful
API, visual state that matters, logins and cookies that must persist, or automation you need
to reproduce and debug.

> Linux-first, developed on Fedora (Wayland). Cross-platform support is not promised yet.
> This is an early, developer-focused open-source project — see the honest limits below.

## Who it's for

Developers building local AI agents and browser automation: MCP and Playwright users, people
wiring up personal AI workflows, and researchers working on browser agents who need
persistent, authenticated sessions an agent can drive.

## See it work (~60 seconds)

**Prerequisites:** Node.js 20+, `curl`.

```bash
npm install
npm run dev          # starts the server; prints its address + token/endpoint file paths
```

In another terminal, run the demo — it drives a full session loop end to end
(launch → navigate → snapshot → extract → screenshot → debug-bundle → close):

```bash
./examples/quickstart.sh
```

The server binds to `127.0.0.1` on an **OS-assigned port** (set `FEATHER_PORT` to pin one).
The exact address and the auth token path are written to `endpoint.json` at startup and
printed on the `Endpoint:` / `Token file:` lines — the demo reads them automatically. See
`examples/README.md`.

## What works today

- Launch and control isolated Chromium sessions over a local HTTP API
- Persistent **and** disposable profiles, with profile locks to prevent collisions
- Page snapshots, structured (CSS-recipe) extraction, screenshots
- On-demand debug bundles (trace, console, network, screenshots) + a read-only event stream
- Structured JSONL logs with automatic credential redaction
- Per-session proxy configuration; resource measurement
- Transport-separated handlers, so the same core can later expose MCP/other protocols

## What it doesn't do yet

Stated plainly so the scope is honest:

- Not a Chrome replacement or a general consumer browser
- Not an Arc / Zen / Dia / Comet competitor
- Not a polished cross-platform GUI product
- Not a complete agent framework, and not a broad integration/connector platform

## Architecture

A headless-first Chromium core: Playwright-managed sessions behind a Fastify local control
service, with transport-separated command handlers. Full walkthrough in
[`docs/architecture.md`](docs/architecture.md).

## For AI agents

The machine-readable contract is [`docs/api-reference.md`](docs/api-reference.md). In short:
discover the base URL from `endpoint.json` (`baseUrl` field), send the token from its
`tokenFile` in the `X-Feather-Token` header, and every response uses the envelope
`{ ok, requestId, data | error }`.

## Testing

```bash
npm test                   # unit tests
npm run test:integration   # integration tests against real Chromium
npm run test:measurement   # resource measurement scenarios
```

## Status — built in the open

Phases 0–3 complete; the core is stable and merged to `master`. Current focus is **Feather
Core open-source readiness** (Phase 4a) ahead of the visual desktop shell (Phase 4b) — see
[`ROADMAP.md`](ROADMAP.md). This project is built in the open: the full design history,
decisions, and session-by-session log live under [`journal/`](journal/) and
[`docs/specs/`](docs/specs/) for anyone who likes to read how it's made.
```

- [ ] **Step 2: Verify the referenced files exist and the claims hold**

Run:
```bash
ls README.md examples/README.md examples/quickstart.sh docs/architecture.md docs/api-reference.md ROADMAP.md journal docs/specs
grep -n "3000\|\.feather/token" README.md || echo "OK: no stale :3000 / .feather/token claims"
```
Expected: all paths listed exist; the grep prints `OK: no stale ...` (the rewrite removed both bugs).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): artifact-forward Core-first rewrite; fix port + token-file claims

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: ROADMAP — Core-vs-Shell split + 4a/4b sequencing

**Files:**
- Modify: `ROADMAP.md` (add a public Core-vs-Shell section; split Phase 4 into 4a/4b)

- [ ] **Step 1: Add the Core-vs-Shell split after the Destination section**

In `ROADMAP.md`, immediately after the `## Destination` block (before `## Roadmap Model`), insert:

```markdown
## Public Surface: Feather Core vs. Feather Shell

The roadmap is split so the adoptable part is legible on its own (see
`docs/public-positioning.md`).

**Feather Core** — the near-term open-source surface: the local browser runtime, sessions and
profiles, snapshots/extraction/screenshots, debug bundles, and the local API (future MCP tool
interface). This is what another developer can pick up and use today. **Lead with Core.**

**Feather Shell** — the larger, more platform-specific vision: the Zen-inspired visual browser
shell, the long-running human browsing context ("Cookie Mine"), and later agent-facing
workflows. Harder to adopt and to explain; it comes after Core is adoptable.
```

- [ ] **Step 2: Split the Phase 4 heading into 4a/4b**

In `ROADMAP.md`, replace the line:

```markdown
## Phase 4: Visual Desktop Shell Prototype
```

with:

```markdown
## Phase 4: Core Open-Source Readiness, then Visual Desktop Shell

Phase 4 runs in two parts. **4a (now): Feather Core open-source readiness** — an
artifact-forward README, a runnable public demo (`examples/quickstart.sh`), the public
Core-vs-Shell split above, and honest docs — so a stranger can understand and run Core. **4b
(after): the Visual Desktop Shell** — unchanged in substance, resequenced behind 4a.

### Phase 4b: Visual Desktop Shell Prototype
```

- [ ] **Step 3: Verify and commit**

Run: `grep -n "Phase 4a\|4a (now)\|Feather Core vs. Feather Shell\|Phase 4b" ROADMAP.md`
Expected: matches for the new Core-vs-Shell heading and the 4a/4b split.

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): public Core-vs-Shell split; sequence Phase 4a (Core) before 4b (shell)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Steering files — point at Core-first

**Files:**
- Modify: `journal/ops/tasks.md` (swap the active track)
- Modify: `journal/context/active.md` (update "Now" + "Recommend next")
- Modify: `journal/ops/phase.md` (update `sub_phase`)

- [ ] **Step 1: Swap the active track in `journal/ops/tasks.md`**

Replace the `Active track:` paragraph and the `## Next — Phase-4 GUI: shell-stack joint call (immediate)` section (lines describing the shell-stack call as the immediate next) with:

```markdown
Active track: **Phase 4a — Feather Core open-source readiness** (Roi, 2026-06-05). The
"Core first, Shell later" positioning is now the work order: make Core legible + runnable for
a stranger before resuming the shell. Spec `docs/specs/2026-06-05-core-first-reorientation-design.md`;
plan `docs/plans/2026-06-05-core-first-reorientation.md`.

## Next — Phase 4a: Core open-source readiness (immediate)
- [ ] **Runnable public demo** — `examples/quickstart.sh` runs the full session loop green
  against a live server (the verification gate; audits the docs).
- [ ] **Artifact-forward README** — lead with what Feather is / who it's for / see it work /
  honest limits; corrected port + token-file facts; internal status demoted to a linked
  "built in the open" section.
- [ ] **ROADMAP Core-vs-Shell split** + Phase 4a→4b sequencing.

## Next — Phase 4b: Visual Desktop Shell (after 4a)
- [ ] **Shell-stack joint call** — review ADR-0009 (GTK4-native + Casilda + headed-Chromium
  stopgap; Tauri a genuine trade); gate on a Casilda+Chromium latency/input spike; then start
  the GUI from `research/2026-06-05-phase4-gui-architecture-sketch.md`. (Resequenced behind 4a;
  unchanged in substance.)
- [ ] (Open, not focus) **Cookie-isolation for the real `primary`** — measure DBSC binding
  read-only first, never blind-clone. JOINT CALL.
- [ ] (Open, not focus) **Vault/behavioral storage backend** — unfreeze ADR-0008 when ready.
- [ ] (Minor, Roi) **sudo Xvfb install** → finish the 3-way anti-detection WebGL table.
```

- [ ] **Step 2: Update "Now" and "Recommend next" in `journal/context/active.md`**

At the top of the `## Now` section, insert this block (above the existing `🧹 Housekeeping` line, which stays as history):

```markdown
**▶ ACTIVE FOCUS (Roi, 2026-06-05): Phase 4a — Feather Core open-source readiness.** Promoted
the "Core first, Shell later" positioning (`docs/public-positioning.md`) from messaging to the
actual work order, for an imminent public/LinkedIn debut. Building, in order: a **verified
runnable demo** (`examples/quickstart.sh`), an **artifact-forward README**, and the **ROADMAP
Core-vs-Shell split**. The shell-stack joint call is **resequenced to Phase 4b** (behind 4a),
not cancelled. Journal untouched (building-in-the-open stays). Spec/plan:
`docs/specs/2026-06-05-core-first-reorientation-design.md` /
`docs/plans/2026-06-05-core-first-reorientation.md`. Doc bugs the demo caught: server does NOT
bind `:3000` (port is OS-assigned via `endpoint.json`); token file is
`<runtime>/feather/run/control-token`, not `.feather/token`.
```

Then replace the first line of the `## Recommend next` section (`**Pre-shell infrastructure sequence (locked 2026-06-04) ...**`) heading with a line noting Core-readiness precedes the (already-complete) pre-shell sequence's GUI handoff:

```markdown
**Phase 4a (Core open-source readiness) is the active line — precedes resuming the shell.** The
pre-shell infrastructure sequence below is DONE; the GUI it unblocked is now Phase 4b, behind 4a.
```

- [ ] **Step 3: Update `sub_phase` in `journal/ops/phase.md`**

Replace the `sub_phase:` line value with:

```yaml
sub_phase: phase-4a-core-open-source-readiness-active-shell-resequenced-to-4b
```

- [ ] **Step 4: Verify and commit**

Run: `grep -n "Phase 4a\|Core open-source readiness" journal/ops/tasks.md journal/context/active.md journal/ops/phase.md`
Expected: matches in all three files.

```bash
git add journal/ops/tasks.md journal/context/active.md journal/ops/phase.md
git commit -m "ops: resequence active track to Phase 4a (Core open-source readiness)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Final verification + journal log

**Files:**
- Modify: `journal/log.md` (append one event line)

- [ ] **Step 1: Run the existing suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: unit suite green; `tsc --noEmit` exits 0. (No `src/` was changed, so this confirms no incidental breakage.)

- [ ] **Step 2: Re-run the demo against a fresh server (final gate)**

Run:
```bash
npm run dev > /tmp/feather-dev.log 2>&1 & echo $! > /tmp/feather-dev.pid; sleep 4
./examples/quickstart.sh
kill "$(cat /tmp/feather-dev.pid)" && rm -f /tmp/feather-dev.pid
```
Expected: demo prints `8/8 ... state=closed` and `Done — full loop succeeded.`, exit 0.

- [ ] **Step 3: Append the event-log line**

Add to the bottom of `journal/log.md`:

```markdown
2026-06-05 | SHIP | dev -> README + examples/quickstart.sh + ROADMAP + steering | Phase 4a Core open-source readiness: artifact-forward README (fixed :3000 + .feather/token doc bugs), verified runnable demo (full session loop), Core-vs-Shell roadmap split; shell-stack resequenced to 4b. Spec+plan landed.
```

- [ ] **Step 4: Commit**

```bash
git add journal/log.md
git commit -m "ops(log): Phase 4a Core open-source readiness shipped (README + demo + roadmap)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- README launch-grade rewrite → Task 2. ✓
- Demo `examples/quickstart.sh` (verified, full loop) → Task 1. ✓
- ROADMAP Core-vs-Shell split + 4a/4b → Task 3. ✓
- Steering files (tasks/active/phase) → Task 4. ✓
- Testing gate (demo green + npm test + typecheck) → Task 1 step 5, Task 5 steps 1–2. ✓
- Port/token doc-drift fix → Task 2 step 1 (content) + step 2 (grep guard). ✓
- "For AI agents" pointer + envelope → Task 2 README. ✓
- Non-goals (journal untouched, no shell, no C items, no src feature work) → honored; no task touches `journal/` structure, `src/` features, CONTRIBUTING, llms.txt, or media. ✓

**Placeholder scan:** No TBD/TODO; the demo script and README are given in full; ROADMAP and steering edits give exact insert/replace blocks. ✓

**Type/name consistency:** Demo uses `field` for single-level `data.*` reads consistently; endpoint fields (`baseUrl`, `tokenFile`) match `src/transport/http.ts`; response fields (`sessionId`, `status`, `title`, `text`, `heading`, `path`, `manifest`, `state`) match `docs/api-reference.md`. ✓
