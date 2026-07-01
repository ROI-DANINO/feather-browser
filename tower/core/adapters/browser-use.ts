// tower/core/adapters/browser-use.ts
import { spawn as nodeSpawn } from "node:child_process";
import { join } from "node:path";
import { z } from "zod";
import type { Adapter, TowerTask } from "../types";

/** The one stdout line the shim must emit — the whole protocol contract. */
const ShimResult = z.object({ status: z.enum(["ok", "error"]), error: z.string().nullable() });
type ShimResult = z.infer<typeof ShimResult>;

/** The slice of ChildProcess the adapter needs — injectable so unit tests never touch a real process. */
export interface SpawnedProcess {
  stdin: { write(chunk: string): void; end(): void };
  stdout: { on(event: "data", cb: (chunk: Buffer | string) => void): void };
  stderr: { on(event: "data", cb: (chunk: Buffer | string) => void): void };
  on(event: "close", cb: (code: number | null) => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  kill(signal?: NodeJS.Signals): void;
}

export type SpawnImpl = (
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv },
) => SpawnedProcess;

export interface BrowserUseAdapterConfig {
  /** Full command line for the shim; defaults to python3 + the in-repo shim path. */
  shimCommand?: string[];
  maxSteps?: number;
  /** Wall-clock budget for the whole subprocess run; on expiry the process is SIGKILLed. */
  timeoutMs?: number;
  /** Extra env merged over process.env (telemetry/cloud-sync opt-outs always win). */
  env?: NodeJS.ProcessEnv;
  /** Injectable spawn (mirror of feather-client's injectable fetchImpl) — tests use a fake. */
  spawnImpl?: SpawnImpl;
}

// Resolved from this module's location so cwd never matters: tower/core/adapters → tower/adapters.
const DEFAULT_SHIM_COMMAND = ["python3", join(__dirname, "..", "..", "adapters", "browser-use", "shim.py")];
const DEFAULT_MAX_STEPS = 25;
const DEFAULT_TIMEOUT_MS = 180_000;
const STDERR_TAIL_CHARS = 800;

/** The last parseable {status,error} line wins; framework noise lines are ignored. */
function lastResultLine(stdout: string): ShimResult | null {
  let result: ShimResult | null = null;
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const parsed = ShimResult.safeParse(JSON.parse(trimmed));
      if (parsed.success) result = parsed.data;
    } catch {
      // not JSON — noise, skip
    }
  }
  return result;
}

/** Diagnostics only — stderr is never parsed for protocol. */
function stderrTail(stderr: string): string {
  const tail = stderr.trim().slice(-STDERR_TAIL_CHARS);
  return tail === "" ? "" : `; stderr tail: ${tail}`;
}

/**
 * adapter.browser-use — drives the real browser-use framework through a Python subprocess shim.
 * The stdin/stdout JSON line protocol is the whole coupling surface: one task line in,
 * one {status,error} result line out. Resolves iff status "ok" AND exit 0; throws on
 * status "error", non-zero exit, unreadable output, spawn failure, or wall-clock timeout
 * (SIGKILL). Drives, never grades.
 */
export function browserUseAdapter(cfg: BrowserUseAdapterConfig = {}): Adapter {
  const spawnImpl: SpawnImpl =
    cfg.spawnImpl ?? ((command, args, options) => nodeSpawn(command, args, options));
  const [command, ...args] = cfg.shimCommand ?? DEFAULT_SHIM_COMMAND;
  const timeoutMs = cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return {
    id: "adapter.browser-use",
    run(task: TowerTask): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const child = spawnImpl(command, args, {
          env: {
            ...process.env,
            ...cfg.env,
            ANONYMIZED_TELEMETRY: "false",
            BROWSER_USE_CLOUD_SYNC: "false",
          },
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          child.kill("SIGKILL");
          reject(new Error(`browser-use shim timed out after ${timeoutMs}ms${stderrTail(stderr)}`));
        }, timeoutMs);
        const settle = (outcome: () => void) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          outcome();
        };
        child.stdout.on("data", (chunk) => { stdout += String(chunk); });
        child.stderr.on("data", (chunk) => { stderr += String(chunk); });
        child.on("error", (err) =>
          settle(() => reject(new Error(`browser-use shim failed to spawn: ${err.message}`))));
        child.on("close", (code) =>
          settle(() => {
            const result = lastResultLine(stdout);
            if (result === null) {
              return reject(new Error(
                `browser-use shim produced no parseable result line (exit ${code})${stderrTail(stderr)}`));
            }
            if (result.status === "error") {
              return reject(new Error(
                `browser-use shim reported error: ${result.error ?? "unknown"}${stderrTail(stderr)}`));
            }
            if (code !== 0) {
              return reject(new Error(`browser-use shim exited ${code}${stderrTail(stderr)}`));
            }
            resolve();
          }));
        const line = JSON.stringify({
          url: task.url,
          goal: task.goal,
          maxSteps: cfg.maxSteps ?? DEFAULT_MAX_STEPS,
        });
        child.stdin.write(`${line}\n`);
        child.stdin.end();
      });
    },
  };
}
