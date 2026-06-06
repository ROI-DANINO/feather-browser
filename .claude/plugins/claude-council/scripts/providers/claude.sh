#!/bin/bash
# ABOUTME: Queries the Claude Code CLI in headless mode
# ABOUTME: Availability is gated on the claude binary being on PATH

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/verbosity.sh"
source "$SCRIPT_DIR/../lib/providers.sh"

verbosity_prefix VERBOSITY_PREFIX "${COUNCIL_VERBOSITY:-standard}"

PROMPT="${1:-}"

if [[ -z "$PROMPT" ]]; then
    echo "Error: No prompt provided" >&2
    exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
    echo "Error: claude CLI not found on PATH" >&2
    exit 1
fi

SYSTEM="${VERBOSITY_PREFIX:+$VERBOSITY_PREFIX }$BASE_SYSTEM_PROMPT"
FULL_PROMPT="${SYSTEM}

${PROMPT}"

ERR_TMP=$(mktemp)
trap 'rm -f "$ERR_TMP"' EXIT

# Run Claude in print mode (headless single prompt output) using standard flags
if RESPONSE=$(claude -p "$FULL_PROMPT" 2>"$ERR_TMP"); then
    # Output the result clean
    echo "$RESPONSE"
else
    ERR_MSG=$(tr '\n' ' ' < "$ERR_TMP" | head -c 500)
    echo "Error from claude CLI: ${ERR_MSG:-non-zero exit}" >&2
    exit 1
fi
