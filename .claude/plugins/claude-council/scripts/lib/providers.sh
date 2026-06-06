#!/bin/bash

# Central configuration for provider meta-data
provider_emoji() {
    case "$1" in
        gemini) echo "🟦" ;;
        openai) echo "🔳" ;;
        grok) echo "🟥" ;;
        perplexity) echo "🟩" ;;
        codex|claude) echo "🔳" ;;
        gemini-cli) echo "🟦" ;;
        *) echo "⬜" ;;
    esac
}

provider_color() {
    case "$1" in
        gemini) echo "\033[34m" ;;
        openai) echo "\033[37m" ;;
        grok) echo "\033[31m" ;;
        perplexity) echo "\033[32m" ;;
        codex|claude) echo "\033[37m" ;;
        gemini-cli) echo "\033[34m" ;;
        *) echo "\033[37m" ;;
    esac
}

get_model() {
    case "$1" in
        gemini) echo "${GEMINI_MODEL:-gemini-3.1-pro-preview}" ;;
        openai) echo "${OPENAI_MODEL:-gpt-5.5-pro}" ;;
        grok) echo "${GROK_MODEL:-grok-4.20-reasoning}" ;;
        perplexity) echo "${PERPLEXITY_MODEL:-sonar-reasoning-pro}" ;;
        codex) echo "${CODEX_MODEL:-gpt-4o}" ;;
        claude) echo "${CLAUDE_MODEL:-claude-3-7-sonnet-20250219}" ;;
        gemini-cli) echo "${GEMINI_CLI_MODEL:-gemini-3.1-pro-preview}" ;;
        *) echo "unknown" ;;
    esac
}

# The single source of truth for base system instruction across all models
BASE_SYSTEM_PROMPT="You are a senior software architect on the Feather Browser team advising on tradeoffs. Provide clear, technical, well-reasoned answers focusing on architecture, maintainability, and Linux desktop context. Return Markdown format only."
