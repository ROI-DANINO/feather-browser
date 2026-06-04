# Storage Isolation — XDG Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all of Feather's runtime files out of the repo-relative `.feather` directory into the standard XDG base directories under the user's home, so secrets (profiles, vault, token) never live inside the workspace.

**Architecture:** `loadConfig()` resolves four roots — `data`, `state`, `cache`, `runtime` — from XDG env vars with home-directory fallbacks (and a `FEATHER_DIR` single-root override). `FeatherPaths` routes each path category to the correct root. `FeatherPaths` and `ensureDirs` also accept a bare string for single-root convenience (used by `FEATHER_DIR` mode and the existing test suite), normalized in one place via `singleRootDirs()`.

**Tech Stack:** TypeScript, Node (`os`, `path`, `fs`), Vitest.

**Spec:** `docs/specs/2026-06-04-storage-isolation-xdg-design.md`

**Deliberate refinement of the spec:** the spec says `FeatherPaths`/`ensureDirs` take `FeatherDirs`. To avoid churning 14 stabilized test files that pass a single `tmpDir` string, both ALSO accept a `string` (treated as single-root). This is the same single-root concept the `FEATHER_DIR` override uses, normalized once. Production code (`index.ts`) passes the real `FeatherDirs`.

---

### Task 1: `.gitignore` safety net

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.feather/` to `.gitignore`**

Add this line after the `.browser-profile/` line (group with other local-state ignores):

```
.feather/
```

- [ ] **Step 2: Verify Git now ignores it**

Run: `git check-ignore .feather/anything`
Expected: prints `.feather/anything` (a match → ignored). Exit code 0.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore(gitignore): ignore repo-relative .feather safety net (storage isolation)"
```

---

### Task 2: Config layer — `FeatherDirs`, `singleRootDirs`, XDG resolution

Add the new dirs vocabulary to `config.ts` WITHOUT yet changing `loadConfig()`'s return shape (keeps the build compiling and `index.ts`/`fs-layout.ts` untouched until later tasks). `resolveDirs()` is exported so its XDG logic is directly unit-testable.

**Files:**
- Modify: `src/config.ts`
- Test: `tests/unit/config.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the entire body of `tests/unit/config.test.ts` with:

```typescript
// tests/unit/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as path from "path";
import { loadConfig, resolveDirs, singleRootDirs } from "../../src/config";

const XDG_VARS = [
  "FEATHER_DIR",
  "XDG_DATA_HOME",
  "XDG_STATE_HOME",
  "XDG_CACHE_HOME",
  "XDG_RUNTIME_DIR",
];

describe("config", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of XDG_VARS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    delete process.env.FEATHER_PORT;
  });

  afterEach(() => {
    for (const k of XDG_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns default port 0 when FEATHER_PORT is unset", () => {
    const cfg = loadConfig();
    expect(cfg.port).toBe(0);
  });

  it("reads FEATHER_PORT from env", () => {
    process.env.FEATHER_PORT = "17321";
    const cfg = loadConfig();
    expect(cfg.port).toBe(17321);
  });

  it("singleRootDirs collapses all four roots to one path", () => {
    expect(singleRootDirs("/x")).toEqual({
      data: "/x",
      state: "/x",
      cache: "/x",
      runtime: "/x",
    });
  });

  it("resolveDirs uses XDG home fallbacks when no env vars set", () => {
    const dirs = resolveDirs();
    const home = os.homedir();
    expect(dirs.data).toBe(path.join(home, ".local/share", "feather"));
    expect(dirs.state).toBe(path.join(home, ".local/state", "feather"));
    expect(dirs.cache).toBe(path.join(home, ".cache", "feather"));
    // runtime has no home fallback → falls back to the state root
    expect(dirs.runtime).toBe(dirs.state);
  });

  it("resolveDirs honors XDG_*_HOME env vars", () => {
    process.env.XDG_DATA_HOME = "/custom/data";
    process.env.XDG_STATE_HOME = "/custom/state";
    process.env.XDG_CACHE_HOME = "/custom/cache";
    process.env.XDG_RUNTIME_DIR = "/run/user/1000";
    const dirs = resolveDirs();
    expect(dirs.data).toBe(path.join("/custom/data", "feather"));
    expect(dirs.state).toBe(path.join("/custom/state", "feather"));
    expect(dirs.cache).toBe(path.join("/custom/cache", "feather"));
    expect(dirs.runtime).toBe(path.join("/run/user/1000", "feather"));
  });

  it("resolveDirs collapses all roots when FEATHER_DIR is set", () => {
    process.env.FEATHER_DIR = "/tmp/feather-test";
    expect(resolveDirs()).toEqual(singleRootDirs("/tmp/feather-test"));
  });

  it("loadConfig wires dirs from resolveDirs", () => {
    const cfg = loadConfig();
    expect(cfg.dirs).toEqual(resolveDirs());
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/config.test.ts`
Expected: FAIL — `resolveDirs` / `singleRootDirs` are not exported; `cfg.dirs` undefined.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `src/config.ts` with:

```typescript
import * as os from "os";
import * as path from "path";

export interface FeatherDirs {
  data: string;
  state: string;
  cache: string;
  runtime: string;
}

export interface FeatherConfig {
  port: number;
  host: string;
  dirs: FeatherDirs;
}

/** Collapse all four roots to a single directory (FEATHER_DIR / test mode). */
export function singleRootDirs(base: string): FeatherDirs {
  return { data: base, state: base, cache: base, runtime: base };
}

function xdgRoot(envVar: string, homeFallback: string): string {
  const env = process.env[envVar];
  const base = env && env.trim() !== "" ? env : path.join(os.homedir(), homeFallback);
  return path.join(base, "feather");
}

/** Resolve the four XDG roots (or a single FEATHER_DIR override). */
export function resolveDirs(): FeatherDirs {
  const override = process.env.FEATHER_DIR;
  if (override && override.trim() !== "") {
    return singleRootDirs(override);
  }
  const state = xdgRoot("XDG_STATE_HOME", ".local/state");
  const runtimeEnv = process.env.XDG_RUNTIME_DIR;
  const runtime =
    runtimeEnv && runtimeEnv.trim() !== ""
      ? path.join(runtimeEnv, "feather")
      : state; // XDG_RUNTIME_DIR not guaranteed; never fall back into the workspace
  return {
    data: xdgRoot("XDG_DATA_HOME", ".local/share"),
    state,
    cache: xdgRoot("XDG_CACHE_HOME", ".cache"),
    runtime,
  };
}

export function loadConfig(): FeatherConfig {
  return {
    port: process.env.FEATHER_PORT ? parseInt(process.env.FEATHER_PORT, 10) : 0,
    host: process.env.FEATHER_HOST ?? "127.0.0.1",
    dirs: resolveDirs(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/config.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Verify the rest of the build still type-checks except known consumers**

Run: `npx tsc --noEmit`
Expected: errors ONLY in `src/index.ts` (`config.featherDir` no longer exists) and `src/fs-layout.ts` is unaffected yet. These are fixed in Tasks 3–4. (If errors appear elsewhere, stop and investigate.)

- [ ] **Step 6: Commit**

```bash
git add src/config.ts tests/unit/config.test.ts
git commit -m "feat(config): resolve XDG data/state/cache/runtime roots (storage isolation)"
```

---

### Task 3: `FeatherPaths` + `ensureDirs` route each category to its root

`FeatherPaths` and `ensureDirs` accept `FeatherDirs | string`. A string is normalized to single-root via `singleRootDirs`, so every existing test that passes `tmpDir` / `".feather"` keeps working unchanged.

**Files:**
- Modify: `src/fs-layout.ts`
- Test: `tests/unit/fs-layout.test.ts`

- [ ] **Step 1: Write the failing test (add split-routing coverage; keep existing single-root tests)**

Replace the entire contents of `tests/unit/fs-layout.test.ts` with:

```typescript
// tests/unit/fs-layout.test.ts
import { describe, it, expect } from "vitest";
import { FeatherPaths } from "../../src/fs-layout";

describe("FeatherPaths (single-root string — backward compat)", () => {
  const paths = new FeatherPaths(".feather");

  it("builds profile path for workspace", () => {
    expect(paths.profileDir("ws1")).toBe(".feather/profiles/ws1/profile");
  });

  it("builds workspace json path", () => {
    expect(paths.workspaceJson("ws1")).toBe(".feather/profiles/ws1/workspace.json");
  });

  it("builds lock path for workspace", () => {
    expect(paths.lockFile("ws1")).toBe(".feather/profiles/ws1/lock");
  });

  it("builds disposable session dir", () => {
    expect(paths.disposableSessionDir("ses1")).toBe(".feather/tmp/sessions/ses1");
  });

  it("builds debug dir for session", () => {
    expect(paths.debugDir("ses1")).toBe(".feather/debug/ses1");
  });

  it("builds session log path", () => {
    expect(paths.sessionLog("ses1")).toBe(".feather/logs/sessions/ses1.jsonl");
  });

  it("builds run dir paths", () => {
    expect(paths.endpointFile()).toBe(".feather/run/endpoint.json");
    expect(paths.tokenFile()).toBe(".feather/run/control-token");
  });

  it("builds measurement dir for run", () => {
    expect(paths.measurementDir("run1")).toBe(".feather/measurements/run1");
  });
});

describe("FeatherPaths (split roots)", () => {
  const paths = new FeatherPaths({
    data: "/D",
    state: "/S",
    cache: "/C",
    runtime: "/R",
  });

  it("routes profiles + workspace + lock to the data root", () => {
    expect(paths.profileDir("ws1")).toBe("/D/profiles/ws1/profile");
    expect(paths.workspaceJson("ws1")).toBe("/D/profiles/ws1/workspace.json");
    expect(paths.lockFile("ws1")).toBe("/D/profiles/ws1/lock");
  });

  it("routes disposable sessions to the cache root", () => {
    expect(paths.disposableSessionDir("s")).toBe("/C/tmp/sessions/s");
    expect(paths.disposableProfileDir("s")).toBe("/C/tmp/sessions/s/profile");
  });

  it("routes debug + logs + measurements to the state root", () => {
    expect(paths.debugDir("s")).toBe("/S/debug/s");
    expect(paths.quarantinedProfileDir("s")).toBe("/S/debug/s/quarantined-profile");
    expect(paths.sessionLog("s")).toBe("/S/logs/sessions/s.jsonl");
    expect(paths.measurementDir("r")).toBe("/S/measurements/r");
  });

  it("routes run files (token + endpoint) to the runtime root", () => {
    expect(paths.tokenFile()).toBe("/R/run/control-token");
    expect(paths.endpointFile()).toBe("/R/run/endpoint.json");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/fs-layout.test.ts`
Expected: FAIL — the "split roots" suite fails (current `FeatherPaths` ignores roots / takes a string base); TypeScript also rejects the object argument.

- [ ] **Step 3: Write the implementation**

Replace the entire contents of `src/fs-layout.ts` with:

```typescript
import * as path from "path";
import * as fs from "fs";
import { FeatherDirs, singleRootDirs } from "./config";

function toDirs(dirs: FeatherDirs | string): FeatherDirs {
  return typeof dirs === "string" ? singleRootDirs(dirs) : dirs;
}

export class FeatherPaths {
  private readonly dirs: FeatherDirs;

  constructor(dirs: FeatherDirs | string) {
    this.dirs = toDirs(dirs);
  }

  profileDir(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "profile");
  }

  workspaceJson(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "workspace.json");
  }

  lockFile(workspaceId: string): string {
    return path.join(this.dirs.data, "profiles", workspaceId, "lock");
  }

  disposableSessionDir(sessionId: string): string {
    return path.join(this.dirs.cache, "tmp", "sessions", sessionId);
  }

  disposableProfileDir(sessionId: string): string {
    return path.join(this.disposableSessionDir(sessionId), "profile");
  }

  debugDir(sessionId: string): string {
    return path.join(this.dirs.state, "debug", sessionId);
  }

  sessionLog(sessionId: string): string {
    return path.join(this.dirs.state, "logs", "sessions", `${sessionId}.jsonl`);
  }

  endpointFile(): string {
    return path.join(this.dirs.runtime, "run", "endpoint.json");
  }

  tokenFile(): string {
    return path.join(this.dirs.runtime, "run", "control-token");
  }

  measurementDir(runId: string): string {
    return path.join(this.dirs.state, "measurements", runId);
  }

  quarantinedProfileDir(sessionId: string): string {
    return path.join(this.dirs.state, "debug", sessionId, "quarantined-profile");
  }
}

export async function ensureDirs(dirs: FeatherDirs | string): Promise<void> {
  const d = toDirs(dirs);
  const toCreate = [
    path.join(d.data, "profiles"),
    path.join(d.cache, "tmp", "sessions"),
    path.join(d.state, "debug"),
    path.join(d.state, "logs", "sessions"),
    path.join(d.runtime, "run"),
    path.join(d.state, "measurements"),
  ];
  for (const dir of toCreate) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/fs-layout.test.ts`
Expected: PASS (both suites — single-root and split).

- [ ] **Step 5: Commit**

```bash
git add src/fs-layout.ts tests/unit/fs-layout.test.ts
git commit -m "feat(fs-layout): route each path category to its XDG root (storage isolation)"
```

---

### Task 4: Wire `index.ts` to the resolved dirs

**Files:**
- Modify: `src/index.ts:11-13`

- [ ] **Step 1: Update the wiring**

In `src/index.ts`, replace lines 11-13:

```typescript
  const config = loadConfig();
  const paths = new FeatherPaths(config.featherDir);
  await ensureDirs(config.featherDir);
```

with:

```typescript
  const config = loadConfig();
  const paths = new FeatherPaths(config.dirs);
  await ensureDirs(config.dirs);
```

- [ ] **Step 2: Verify the whole project type-checks**

Run: `npx tsc --noEmit`
Expected: PASS — no errors anywhere (the Task 2 known errors are now resolved).

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(index): wire FeatherPaths/ensureDirs to resolved XDG dirs"
```

---

### Task 5: Full verification — suite green + no writes in the workspace

`measurement/runner.ts` needs no change: it is constructed only in `tests/measurement/scenario.measurement.test.ts` with a single absolute `tmpDir`, and the launch API now returns absolute paths, so its `resolveFeatherPath` `isAbsolute` branch is taken and the legacy `.feather/`-strip is a harmless no-op.

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: PASS — all unit tests (≈137+ plus the new split-routing tests) green.

- [ ] **Step 2: Run the integration suite**

Run: `npm run test:integration`
Expected: PASS — all 33 integration tests green (they pass single-root `tmpDir` strings, still supported).

- [ ] **Step 3: Manual check — nothing is written inside the workspace**

Run:
```bash
git stash --include-untracked >/dev/null 2>&1 || true
rm -rf "$HOME/.local/share/feather" "$HOME/.local/state/feather" "$HOME/.cache/feather"
( npm run dev >/tmp/feather-dev.log 2>&1 & echo $! > /tmp/feather-dev.pid )
sleep 4
echo "=== workspace pollution check (expect NO .feather) ==="; ls -la .feather 2>&1 || echo "OK: no .feather in workspace"
echo "=== XDG dirs created? ==="; ls -d "$HOME/.local/share/feather" "$HOME/.local/state/feather" 2>&1
echo "=== token file location (printed at startup) ==="; grep -i "Token file" /tmp/feather-dev.log
kill "$(cat /tmp/feather-dev.pid)" 2>/dev/null || true
git stash pop >/dev/null 2>&1 || true
```
Expected: `OK: no .feather in workspace`; `~/.local/share/feather` and `~/.local/state/feather` exist; the "Token file:" line points under `$XDG_RUNTIME_DIR/feather/run` (or `~/.local/state/feather/run` if `XDG_RUNTIME_DIR` is unset).

- [ ] **Step 4: Confirm Git sees no new workspace files**

Run: `git status --porcelain`
Expected: empty (no `.feather/` or other runtime files appear in the working tree).

---

## Success Criteria (from spec)

1. ✅ Fresh `npm run dev` writes nothing inside the workspace (Task 5 Step 3-4).
2. ✅ XDG env vars + `FEATHER_DIR` overrides behave as specified (Task 2 tests).
3. ✅ `.feather/` is gitignored (Task 1).
4. ✅ Full unit + integration suites pass (Task 5).
</content>
