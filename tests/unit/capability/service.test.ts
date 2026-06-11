import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { CapabilityService } from "../../../src/capability/service";
import { DangerousModePolicy } from "../../../src/capability/policy";

function makeService(enabled: string, auditFile: string): CapabilityService {
  return new CapabilityService({
    policy: DangerousModePolicy.fromEnv({ FEATHER_DANGEROUS_CAPABILITIES: enabled }),
    auditFile,
  });
}

describe("CapabilityService", () => {
  let dir: string;
  let auditFile: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "feather-capsvc-"));
    auditFile = path.join(dir, "grants.jsonl");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("refuses a request for a capability that is not enabled", () => {
    const svc = makeService("", auditFile);
    const result = svc.requestGrant("ses_1", "cookie-export");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("disabled");
  });

  it("an enabled request returns a grant + an approval URL carrying the humanToken, and audits it", () => {
    const svc = makeService("cookie-export", auditFile);
    const result = svc.requestGrant("ses_1", "cookie-export");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.grant.status).toBe("requested");
      expect(result.approvalPath).toContain(result.humanToken);
    }
    const audit = fs.readFileSync(auditFile, "utf8");
    expect(audit).toContain("grant.requested");
  });

  it("approve → consume: the door opens exactly once", () => {
    const svc = makeService("cookie-export", auditFile);
    const req = svc.requestGrant("ses_1", "cookie-export");
    if (!req.ok) throw new Error("request refused");
    const view = svc.peekApproval(req.humanToken);
    if (!view) throw new Error("no approval view");

    const resolved = svc.resolveApproval(req.humanToken, view.csrfNonce, "approve");
    expect(resolved).toEqual({ ok: true, outcome: "approved" });

    expect(svc.consume("ses_1", "cookie-export").ok).toBe(true);
    expect(svc.consume("ses_1", "cookie-export").ok).toBe(false);
  });

  it("deny → consume fails; nothing is granted", () => {
    const svc = makeService("cookie-export", auditFile);
    const req = svc.requestGrant("ses_1", "cookie-export");
    if (!req.ok) throw new Error("request refused");
    const view = svc.peekApproval(req.humanToken)!;

    expect(svc.resolveApproval(req.humanToken, view.csrfNonce, "deny")).toEqual({ ok: true, outcome: "denied" });
    expect(svc.consume("ses_1", "cookie-export").ok).toBe(false);
  });

  it("a foreign/wrong CSRF nonce is rejected at resolve", () => {
    const svc = makeService("cookie-export", auditFile);
    const req = svc.requestGrant("ses_1", "cookie-export");
    if (!req.ok) throw new Error("request refused");

    const bad = svc.resolveApproval(req.humanToken, "not-the-nonce", "approve");
    expect(bad.ok).toBe(false);
  });

  it("revokeSession kills an approved-but-unused grant and discards its approval page", () => {
    const svc = makeService("cookie-export", auditFile);
    const req = svc.requestGrant("ses_1", "cookie-export");
    if (!req.ok) throw new Error("request refused");
    const view = svc.peekApproval(req.humanToken)!;
    svc.resolveApproval(req.humanToken, view.csrfNonce, "approve");

    svc.revokeSession("ses_1");

    expect(svc.consume("ses_1", "cookie-export").ok).toBe(false);
    expect(svc.peekApproval(req.humanToken)).toBeUndefined();
    expect(fs.readFileSync(auditFile, "utf8")).toContain("grant.revoked");
  });
});
