import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { GrantAuditSink } from "../../../src/capability/audit";
import type { GrantEvent } from "../../../src/capability/grants";

function event(type: GrantEvent["type"], id: string): GrantEvent {
  return {
    type,
    grant: {
      id,
      sessionId: "ses_1",
      capability: "cookie-export",
      status: "granted",
      ttlMs: 60_000,
      requestedAt: "2026-06-11T00:00:00.000Z",
    },
  };
}

describe("GrantAuditSink", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "feather-audit-"));
    file = path.join(dir, "grants.jsonl");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("appends one JSONL line per event, each with a timestamp, type, and the grant record", () => {
    const sink = new GrantAuditSink(file);
    sink.record(event("grant.requested", "grant_a"));
    sink.record(event("grant.granted", "grant_a"));

    const lines = fs.readFileSync(file, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0]);
    expect(first.type).toBe("grant.requested");
    expect(first.grant.id).toBe("grant_a");
    expect(typeof first.ts).toBe("string");
  });

  it("is append-only — a second sink on the same file does not truncate prior history", () => {
    new GrantAuditSink(file).record(event("grant.requested", "grant_a"));
    new GrantAuditSink(file).record(event("grant.used", "grant_a"));

    const lines = fs.readFileSync(file, "utf8").trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1]).type).toBe("grant.used");
  });

  it("never writes a nonce — the event shape carries none, and the line proves it", () => {
    const sink = new GrantAuditSink(file);
    sink.record(event("grant.granted", "grant_a"));
    expect(fs.readFileSync(file, "utf8")).not.toMatch(/nonce/i);
  });
});
