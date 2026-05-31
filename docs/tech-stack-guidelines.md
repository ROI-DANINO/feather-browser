# Tech Stack Guidelines

## Purpose

This document is a **flexible architectural guide**, not a rulebook. Its goal is to help future agents and contributors make pragmatic, well-informed decisions about tools and languages — optimizing for strength, speed, stability, and efficiency.

Do not follow these guidelines blindly. Treat them as a starting point, then research the current state of the ecosystem before committing to an approach.

---

## Current Stack (as of Phase 3)

| Layer | Technology |
|---|---|
| Language | TypeScript 5.4 / Node.js 20+ |
| HTTP server | Fastify 4.x |
| Browser automation | Playwright 1.50 (Chromium headless shell) |
| Validation | Zod 3.x |
| Testing | Vitest (unit, integration, measurement) |
| Native / desktop | None yet |

---

## General Heuristics

These are starting-point heuristics, not fixed rules. Override them when research or evidence justifies it.

### Use TypeScript + Playwright as the default
For anything touching the HTTP API, browser sessions, or request/response handling, TypeScript is the natural fit. It is already established in this codebase, type-safe, and Playwright's first-class language.

### Reach for a compiled language when it earns its place
If a task involves heavy file I/O, sustained CPU work, memory-tight resource management, or native OS access, consider a compiled language — Rust, Go, C, or similar. The bar: the benefit must clearly outweigh the added complexity of a cross-language boundary.

### Keep the system lean
Avoid introducing a new runtime, language, or major dependency for a job that existing tools can handle well. A well-written TypeScript function is better than an under-justified Rust FFI call.

### Tauri is a bridge pattern, not an assumption
If the project evolves into a desktop application, Tauri's `invoke()` is a clean way to call Rust from the frontend. But this is not assumed — evaluate it only when a desktop shell is actually needed.

---

## Research-Driven Execution (Critical)

Before implementing any non-trivial feature, **search for current information**. Ecosystems move fast.

Before writing code:
1. **Check the official docs** for the relevant library/tool (Playwright, Fastify, Vitest, etc.) — APIs change between major versions.
2. **Search for known issues or breaking changes** that affect your specific use case.
3. **Look for established patterns** in the community for the problem you're solving.
4. **Verify version compatibility** between dependencies involved.

Based on that research, you have full autonomy to choose the best tool for the job — including languages or libraries not listed in this document. The measure of a good choice is: does it make the system more correct, faster, or easier to maintain without unnecessary complexity?

---

## Decision Checklist

When choosing a tool, language, or approach for a feature, ask:

- What does this task actually require — I/O, CPU, memory, concurrency, browser interaction?
- What do the **current** official docs say about the best way to do this?
- Does an existing utility or pattern in this codebase already solve it? (Check `src/` before adding dependencies.)
- Will this choice make the system harder to test, debug, or extend?
- Is the complexity cost worth the benefit, or is there a simpler path?

When in doubt, start simple and native to the existing stack. Introduce new technology only when research and evidence make the case clear.
