import { describe, it, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ensureDirs, FeatherPaths } from "../../src/fs-layout";
import { GrantAuditSink } from "../../src/capability/audit";
import { FeatherLogger } from "../../src/logs/logger";
import { DebugCapture } from "../../src/debug/capture";

// At-rest hygiene: credential-adjacent dirs/files must be owner-only. 0700/0600 have no group/other
// bits, so they survive any umask — these assertions are deterministic regardless of the runner.
const permOf = (p: string): number => fs.statSync(p).mode & 0o777;

describe("at-rest file/dir permissions", () => {
  const made: string[] = [];
  const tmp = (): string => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "feather-perms-"));
    made.push(d);
    return d;
  };
  afterEach(() => {
    for (const d of made.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  });

  it("ensureDirs creates run/log/state dirs as 0700 (owner-only)", async () => {
    const base = tmp();
    await ensureDirs(base);
    for (const sub of ["logs/audit", "logs/sessions", "run", "debug", "identities", "profiles", "measurements"]) {
      expect(permOf(path.join(base, sub))).toBe(0o700);
    }
  });

  it("GrantAuditSink writes the grant audit log as 0600", () => {
    const base = tmp();
    const file = path.join(base, "logs", "audit", "grants.jsonl");
    new GrantAuditSink(file).record({ type: "granted", grant: { id: "g1" } } as any);
    expect(permOf(file)).toBe(0o600);
  });

  it("FeatherLogger writes the session JSONL log as 0600", async () => {
    const base = tmp();
    const paths = new FeatherPaths(base);
    await new FeatherLogger(paths).log({ ts: "t", level: "info", event: "session.launched" as any, sessionId: "ses_x" });
    expect(permOf(paths.sessionLog("ses_x"))).toBe(0o600);
  });

  it("DebugCapture writes its dir 0700 and jsonl artifacts 0600 (network/console can carry secrets)", async () => {
    const base = tmp();
    const debugDir = path.join(base, "debug", "ses_x");
    await new DebugCapture(null as any, debugDir, { trace: false, screenshots: false }).finalize();
    expect(permOf(debugDir)).toBe(0o700);
    expect(permOf(path.join(debugDir, "network-summary.jsonl"))).toBe(0o600);
  });
});
