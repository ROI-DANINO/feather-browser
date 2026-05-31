# Feather Browser

Feather Browser is an exploratory project for a hyper-lightweight Chromium-compatible browser core for agentic automation first, and later a calm Zen-inspired visual browser for personal daily use.

The project is currently restarting its architecture research around a headless-first core. The browser should eventually feel seamless for both the user and agents, but the first technical proof should focus on resource use, profile/session isolation, internal automation APIs, scraping reliability, and practical integration of mature open-source tools where they beat rebuilding from scratch.

This project follows a phase-gated workflow:

1. Set up the workspace and session tracking.
2. Research the headless-core architecture options.
3. Plan the first build phase around the chosen core.
4. Build, test, review, and only then plan the next phase.

Only the current phase gets detailed tasks. Later phases stay as roadmap milestones until the previous phase is finished.

Fresh agent sessions should read `AGENTS.md`, understand the current project state, run `/init`, and only then begin research or planning.
