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
      let o; try{ o=JSON.parse(s); }catch(e){ console.error("  unexpected (non-JSON) response from server"); process.exit(1); }
      if(!o.ok){ console.error("  API error:", JSON.stringify(o.error)); process.exit(1); }
      let v=o.data; for(const k of process.argv[1].split(".").filter(Boolean)) v=v==null?v:v[k];
      process.stdout.write(v==null?"":String(v));
    });' "$1"
}

echo "1/8  health"
curl -s "$BASE_URL/health" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    let o; try{ o=JSON.parse(s); }catch(e){ console.error("  health: unexpected response (is Feather running?)"); process.exit(1); }
    if(!o.ok){ console.error("  health not ok"); process.exit(1); }
    console.log("     ok");
  });'

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
