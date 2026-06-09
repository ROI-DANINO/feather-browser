#!/usr/bin/env bash
#
# Feather Browser — showcase/eval suite (DRY-RUN REHEARSAL STUB)
# Rehearsal scope: ONE task — example.com health + snapshot loop.
# This is a chain-dispatch rehearsal, NOT the full 10-task suite.
#
# Prereqs: Feather running (`npm run dev` in another terminal), node, curl.
# Usage:   ./examples/showcase.sh             # run the loop + record row
#          ./examples/showcase.sh __run       # same (helper for validators)
set -euo pipefail

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
  exit 1
fi

BASE_URL="$(node -e 'process.stdout.write(require(process.argv[1]).baseUrl)' "$ENDPOINT_FILE")"
TOKEN_FILE="$(node -e 'process.stdout.write(require(process.argv[1]).tokenFile)' "$ENDPOINT_FILE")"
TOKEN="$(cat "$TOKEN_FILE")"
echo "Feather at $BASE_URL"

# POST/DELETE helper — verbatim from quickstart.sh
api() {
  local method="$1" path="$2" body="${3:-}"
  local args=(-s -X "$method" "$BASE_URL$path" -H "X-Feather-Token: $TOKEN")
  if [ -n "$body" ]; then args+=(-H "Content-Type: application/json" -d "$body"); fi
  curl "${args[@]}"
}

# Envelope reader — verbatim from quickstart.sh
field() {
  node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let o; try{ o=JSON.parse(s); }catch(e){ console.error("  unexpected (non-JSON) response from server"); process.exit(1); }
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

# --- minimal framework: timing + one-row recorder (rehearsal only) ---
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

# --- the ONE rehearsal task: example.com health + snapshot loop ---
run_health_snapshot() {
  local sid t0; t0="$(now_ms)"

  # 1. health
  if ! curl -s "$BASE_URL/health" | node -e '
      let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
        const o=JSON.parse(s); if(!o.ok){process.exit(1)} });' ; then
    record E0 FAIL "$(fmt_elapsed "$t0")" "health not ok"
    return
  fi

  # 2. open disposable headless session
  local resp
  resp="$(api POST /v1/sessions \
    '{"profile":{"kind":"disposable"},"browserMode":"chromium-new-headless","viewport":{"width":1280,"height":800}}')"
  sid="$(printf '%s' "$resp" | field sessionId)"
  [ -n "$sid" ] || { record E0 FAIL "$(fmt_elapsed "$t0")" "no sessionId from /v1/sessions"; return; }

  # 3. navigate example.com
  api POST "/v1/sessions/$sid/navigate" \
    '{"url":"https://example.com","waitUntil":"load","timeoutMs":15000}' >/dev/null

  # 4. snapshot — assert title + body text
  local resp_title resp_text
  resp_title="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field title)"
  resp_text="$(api POST "/v1/sessions/$sid/snapshot" '{}' | field text | head -c 80)"

  # 5. close (best-effort)
  api DELETE "/v1/sessions/$sid" '{"force":false}' >/dev/null || true

  # 6. record
  if printf '%s' "$resp_title" | grep -qi 'example'; then
    record E0 PASS "$(fmt_elapsed "$t0")" "title='$resp_title' text='${resp_text}...'"
  elif [ -n "$resp_title" ]; then
    record E0 PARTIAL "$(fmt_elapsed "$t0")" "title non-empty but unexpected: '$resp_title'"
  else
    record E0 FAIL "$(fmt_elapsed "$t0")" "snapshot returned empty title"
  fi
}

# --- runner (minimal) ---
if [ "${1:-}" = "__run" ]; then
  run_health_snapshot
  echo
  echo "| Task | Status | Time  | Lesson |"
  echo "|------|--------|-------|--------|"
  while IFS='|' read -r t s ti l; do
    printf '| %s | %s | %s | %s |\n' "$t" "$s" "$ti" "$l"
  done < "$RESULTS_FILE"
else
  run_health_snapshot
fi
