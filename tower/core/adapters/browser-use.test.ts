// tower/core/adapters/browser-use.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { browserUseAdapter, type SpawnedProcess, type SpawnImpl } from "./browser-use";
import type { TowerTask } from "../types";

const TASK: TowerTask = { levelId: "lvl-1", url: "https://x.test/page", goal: "click the button" };

/** A scriptable fake ChildProcess — no real process is ever spawned. */
class FakeChild {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdinWrites: string[] = [];
  stdinEnded = false;
  killedWith: string | null = null;
  private events = new EventEmitter();
  stdin = {
    write: (chunk: string) => { this.stdinWrites.push(chunk); },
    end: () => { this.stdinEnded = true; },
  };
  on(event: string, cb: (...args: unknown[]) => void): void { this.events.on(event, cb); }
  emit(event: string, ...args: unknown[]): void { this.events.emit(event, ...args); }
  kill(signal?: string): void { this.killedWith = signal ?? "SIGTERM"; }
}

/** A fake spawnImpl that records the spawn call and runs the script once listeners are attached. */
function fakeSpawn(script: (child: FakeChild) => void = () => {}) {
  const seen: { command: string; args: string[]; env: NodeJS.ProcessEnv }[] = [];
  const children: FakeChild[] = [];
  const spawnImpl: SpawnImpl = (command, args, options) => {
    const child = new FakeChild();
    seen.push({ command, args, env: options.env });
    children.push(child);
    queueMicrotask(() => script(child));
    return child as unknown as SpawnedProcess;
  };
  return { spawnImpl, seen, children };
}

const OK_LINE = '{"status":"ok","error":null}\n';

afterEach(() => {
  vi.useRealTimers();
});

describe("browserUseAdapter", () => {
  it("has id adapter.browser-use", () => {
    expect(browserUseAdapter({ spawnImpl: fakeSpawn().spawnImpl }).id).toBe("adapter.browser-use");
  });

  it("resolves on status ok + exit 0", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).resolves.toBeUndefined();
  });

  it("throws on status error, including the shim's error message + stderr tail", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stderr.emit("data", "shim log: agent exploded\n");
      child.stdout.emit("data", '{"status":"error","error":"agent exploded"}\n');
      child.emit("close", 1);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK))
      .rejects.toThrow(/agent exploded[\s\S]*shim log/);
  });

  it("throws on a status:error result line even when the process exits 0", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", '{"status":"error","error":"task failed"}\n');
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/task failed/);
  });

  it("throws on non-zero exit even when the result line says ok", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 1);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/exit(ed)? .*1/);
  });

  it("throws when stdout has no parseable result line", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", "totally not json\n");
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/no parseable result/i);
  });

  it("throws when stdout is empty", async () => {
    const { spawnImpl } = fakeSpawn((child) => child.emit("close", 0));
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/no parseable result/i);
  });

  it("throws on a spawn error", async () => {
    const { spawnImpl } = fakeSpawn((child) => child.emit("error", new Error("ENOENT: python3 not found")));
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/ENOENT/);
  });

  it("kills the process with SIGKILL and throws on wall-clock timeout", async () => {
    vi.useFakeTimers();
    const { spawnImpl, children } = fakeSpawn(); // never emits close — hangs forever
    const p = browserUseAdapter({ spawnImpl, timeoutMs: 5_000 }).run(TASK);
    const assertion = expect(p).rejects.toThrow(/timed out after 5000ms/);
    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
    expect(children[0].killedWith).toBe("SIGKILL");
  });

  it("does not time out when the shim finishes in time", async () => {
    vi.useFakeTimers();
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    const p = browserUseAdapter({ spawnImpl, timeoutMs: 5_000 }).run(TASK);
    await vi.advanceTimersByTimeAsync(0); // let the queued script run
    await expect(p).resolves.toBeUndefined();
  });

  it("spawns with telemetry/cloud-sync off, process.env passed through, and cfg.env merged", async () => {
    const { spawnImpl, seen } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await browserUseAdapter({ spawnImpl, env: { EXTRA_KEY: "extra-value" } }).run(TASK);
    const env = seen[0].env;
    expect(env.ANONYMIZED_TELEMETRY).toBe("false");
    expect(env.BROWSER_USE_CLOUD_SYNC).toBe("false");
    expect(env.EXTRA_KEY).toBe("extra-value");
    expect(env.PATH).toBe(process.env.PATH); // passthrough
  });

  it("spawns the default shim command (python3 + repo-rooted shim.py)", async () => {
    const { spawnImpl, seen } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await browserUseAdapter({ spawnImpl }).run(TASK);
    expect(seen[0].command).toBe("python3");
    expect(seen[0].args).toHaveLength(1);
    expect(seen[0].args[0]).toMatch(/tower[/\\]adapters[/\\]browser-use[/\\]shim\.py$/);
  });

  it("honors a custom shimCommand", async () => {
    const { spawnImpl, seen } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await browserUseAdapter({ spawnImpl, shimCommand: ["/venv/bin/python", "shim.py", "--flag"] }).run(TASK);
    expect(seen[0].command).toBe("/venv/bin/python");
    expect(seen[0].args).toEqual(["shim.py", "--flag"]);
  });

  it("writes exactly one JSON task line to stdin, then closes stdin", async () => {
    const { spawnImpl, children } = fakeSpawn((child) => {
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await browserUseAdapter({ spawnImpl, maxSteps: 7 }).run(TASK);
    const child = children[0];
    const written = child.stdinWrites.join("");
    expect(written.endsWith("\n")).toBe(true);
    expect(written.slice(0, -1)).not.toContain("\n"); // one line
    expect(JSON.parse(written)).toEqual({ url: TASK.url, goal: TASK.goal, maxSteps: 7 });
    expect(child.stdinEnded).toBe(true);
  });

  it("ignores non-JSON noise lines and takes the LAST parseable status line", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", "INFO some framework noise\n");
      child.stdout.emit("data", '{"unrelated":"json"}\n');
      child.stdout.emit("data", '{"status":"error","error":"stale earlier line"}\n');
      child.stdout.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).resolves.toBeUndefined();
  });

  it("handles a result line split across stdout chunks", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stdout.emit("data", '{"status":"ok",');
      child.stdout.emit("data", '"error":null}\n');
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).resolves.toBeUndefined();
  });

  it("never parses stderr for protocol — an ok-looking line on stderr does not rescue a bad run", async () => {
    const { spawnImpl } = fakeSpawn((child) => {
      child.stderr.emit("data", OK_LINE);
      child.emit("close", 0);
    });
    await expect(browserUseAdapter({ spawnImpl }).run(TASK)).rejects.toThrow(/no parseable result/i);
  });
});
