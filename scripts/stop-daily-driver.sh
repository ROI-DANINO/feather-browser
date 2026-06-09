#!/usr/bin/env bash
# Force-stop a backgrounded Feather daily-driver session (the escape hatch when
# you don't want to click the window closed). Sends SIGTERM so warm-session
# saves the profile and releases its lock before exiting.
#
#   npm run daily:stop            # stops 'primary'
#   npm run daily:stop -- scratch # stops 'scratch'
set -euo pipefail

workspace="${1:-primary}"
run_dir="${XDG_RUNTIME_DIR:-/tmp}/feather"
pid_file="$run_dir/daily-$workspace.pid"

if [ ! -f "$pid_file" ]; then
  echo "No daily-driver pidfile for '$workspace' ($pid_file) — nothing to stop."
  exit 0
fi

pid="$(cat "$pid_file" 2>/dev/null || true)"

if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
  # Guard against PID reuse: only signal if this PID is really our warm-session.
  if tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | grep -q "warm-session"; then
    kill -TERM "$pid" 2>/dev/null || true
    echo "Sent stop signal to Feather '$workspace' (PID $pid) — saving + exiting."
  else
    echo "PID $pid is no longer a Feather warm-session (reused) — not killing." >&2
  fi
else
  echo "Feather '$workspace' is not running (stale pidfile)."
fi

rm -f "$pid_file"
