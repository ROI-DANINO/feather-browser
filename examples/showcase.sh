#!/usr/bin/env bash
#
# Feather Browser — v1 showcase & eval suite
# Drives agent-style errands over the Feather HTTP API end to end, asserts each
# result, saves an artifact, and prints a results table.
#
# Prereqs:
#   - Feather running: `npm run dev` in another terminal.
#   - node + curl. (No jq required.)
#   - For the HARD tier (not in this build): the server must be started from a
#     shell with WAYLAND_DISPLAY/DISPLAY (headed windows), and the `scratch`
#     workspace must hold warmed Google + Instagram sessions.
#
# Usage:
#   ./examples/showcase.sh            # easy tier (default)
#   ./examples/showcase.sh easy       # only easy
#   ./examples/showcase.sh all        # same as easy in this build
#   ./examples/showcase.sh medium     # not implemented yet
#   ./examples/showcase.sh hard       # not implemented yet
#   ./examples/showcase.sh __run run_e2  # run a single task (debug hook)
#
set -euo pipefail

SHOWCASE_TIER="${1:-easy}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)/showcase-output"
mkdir -p "$OUT_DIR"

# --- locate endpoint.json (verbatim from quickstart.sh) ---
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

# --- POST/DELETE helper (verbatim from quickstart.sh) ---
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" "$BASE_URL$path" -H "X-Feather-Token: $TOKEN")
  if [ -n "$body" ]; then args+=(-H "Content-Type: application/json" -d "$body"); fi
  curl "${args[@]}"
}

# --- Envelope reader (verbatim from quickstart.sh) ---
field() {
  node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let o; try{ o=JSON.parse(s); }catch(e){ console.error("  unexpected (non-JSON) response from server"); process.exit(1); }
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

# --- results accumulation -------------------------------------------------
RESULTS_FILE="$(mktemp)"; trap 'rm -f "$RESULTS_FILE"' EXIT

now_ms() { node -e 'process.stdout.write(String(Date.now()))'; }

fmt_elapsed() {
  local s="$1" e; e="$(now_ms)"
  node -e 'process.stdout.write(((process.argv[2]-process.argv[1])/1000).toFixed(1)+"s")' "$s" "$e"
}

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
    echo "_Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) — tier: ${SHOWCASE_TIER}_"
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

# --- session lifecycle (headless/disposable only) -------------------------
open_headless() {
  local resp; resp="$(api POST /v1/sessions '{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}')"
  local sid pid
  sid="$(printf '%s' "$resp" | field sessionId)"
  pid="$(printf '%s' "$resp" | field pages.0.pageId)"
  printf '%s %s' "$sid" "$pid"
}

close_session() {
  api DELETE "/v1/sessions/$1" '{"force":false}' >/dev/null || true
}

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

run_e2() { # weather Tel Aviv (headless)
  local sid pid t0; read sid pid < <(open_headless); t0="$(now_ms)"
  api POST "/v1/sessions/$sid/navigate" '{"url":"https://wttr.in/tel+aviv?format=3","waitUntil":"load","timeoutMs":20000}' >/dev/null
  local line; line="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text)"
  local art; art="$(save_text E2 "$line")"
  if printf '%s' "$line" | grep -qE '[+-][0-9]+°?C'; then record E2 PASS "$(fmt_elapsed "$t0")" "temp: $(printf '%s' "$line" | grep -oE '[+-][0-9]+°?C' | head -1) → $art"
  else record E2 PARTIAL "$(fmt_elapsed "$t0")" "no temp pattern in: ${line:0:60} → $art"; fi
  close_session "$sid"
}

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

# ============================ RUNNER ============================

# Debug hook: ./examples/showcase.sh __run run_e2
if [ "${1:-}" = "__run" ] && [ -n "${2:-}" ]; then "$2"; render_table; exit $?; fi

EASY=(run_e1 run_e2 run_e3)

run_group() {
  local -n g="$1"
  for fn in "${g[@]}"; do
    "$fn" || record "${fn#run_}" FAIL "0.0s" "function errored (see stderr)"
  done
}

case "$SHOWCASE_TIER" in
  easy|"") run_group EASY ;;
  all) run_group EASY ;;
  medium|hard) echo "tier '$SHOWCASE_TIER' is not implemented in this build (easy tier only)" >&2; exit 2 ;;
  *) echo "unknown tier: $SHOWCASE_TIER (use easy|all)" >&2; exit 2 ;;
esac

render_table
