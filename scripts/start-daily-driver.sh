#!/usr/bin/env bash
# Launch Feather's persistent daily-driver profile in a real headed Chromium
# window, detached from this terminal.
#
#   - Returns your shell immediately (runs in the background; logs to a file).
#   - Closing the Chromium window stops the background process and saves the
#     session cleanly (warm-session's own exit hook).
#   - Force-stop anytime with: npm run daily:stop  (sends SIGTERM → clean save).
set -euo pipefail

workspace="${1:-primary}"
start_url="${2:-https://www.google.com}"

case "$workspace" in
  primary|scratch) ;;
  *)
    echo "Usage: $0 [primary|scratch] [start-url]" >&2
    exit 2
    ;;
esac

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

run_dir="${XDG_RUNTIME_DIR:-/tmp}/feather"
mkdir -p "$run_dir"
log_file="$run_dir/daily-$workspace.log"
pid_file="$run_dir/daily-$workspace.pid"

# Refuse a second launch of the same profile. The profile lock would reject it
# anyway; this fails faster with a clearer message. A stale pidfile (dead PID)
# is treated as not-running.
if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file" 2>/dev/null)" 2>/dev/null; then
  echo "Feather '$workspace' is already running (PID $(cat "$pid_file"))." >&2
  echo "Close its window, or force-stop with: npm run daily:stop -- $workspace" >&2
  exit 1
fi

tsnode="$root/node_modules/.bin/ts-node"
if [ ! -x "$tsnode" ]; then
  echo "ts-node not found at $tsnode — run 'npm install' first." >&2
  exit 1
fi

# nohup + </dev/null + redirected stdio + disown → fully detached from this
# terminal (survives closing it; never touches the tty). We exec ts-node
# directly (not via npm) so the PID we record is warm-session itself, letting a
# later SIGTERM reach its clean-finalize handler.
FEATHER_WARM_WORKSPACE="$workspace" FEATHER_WARM_URL="$start_url" \
  nohup "$tsnode" src/tools/warm-session.ts </dev/null >"$log_file" 2>&1 &
pid=$!
echo "$pid" > "$pid_file"
disown 2>/dev/null || true

echo "Feather daily-driver: launching '$workspace' in the background."
echo "  pid    : $pid  ($pid_file)"
echo "  logs   : $log_file"
echo "  window : opening $start_url (give it a few seconds)"
echo "  stop   : close the Chromium window — it saves + exits automatically"
echo "           or force-stop with: npm run daily:stop -- $workspace"
