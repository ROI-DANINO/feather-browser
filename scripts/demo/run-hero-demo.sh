#!/usr/bin/env bash
# Starts a RAM-backed Feather server and runs the hero demo in one command.
# The session profile lives in /run/user/<uid>/feather-demo (tmpfs, wiped on reboot).
# The first run works end-to-end: log in when prompted and Feather continues automatically.
# Re-running before reboot reuses the warmed profile — it skips the login and Chromium's
# first-run popups, which makes for a cleaner screen recording.
set -uo pipefail

FEATHER_DEMO_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/feather-demo"
export FEATHER_DIR="$FEATHER_DEMO_DIR"
export FEATHER_WARM_WORKSPACE="demo"

ENDPOINT_FILE="$FEATHER_DIR/run/endpoint.json"
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    echo ""
    echo "[demo] Stopping Feather server..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

rm -f "$ENDPOINT_FILE"

echo "[demo] Starting Feather server (burner profile: $FEATHER_DIR)..."
npm run dev &
SERVER_PID=$!

echo "[demo] Waiting for server to be ready..."
WAITED=0
while [ "$WAITED" -lt 30 ]; do
  if [ -f "$ENDPOINT_FILE" ]; then
    echo "[demo] Server ready."
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "[demo] Server process exited prematurely — check the output above."
    exit 1
  fi
  sleep 1
  WAITED=$((WAITED + 1))
done

if [ ! -f "$ENDPOINT_FILE" ]; then
  echo "[demo] Timed out waiting for server to start (30s)."
  exit 1
fi

echo "[demo] Running hero demo..."
npx ts-node scripts/demo/hero-chatgpt-gmail.ts
