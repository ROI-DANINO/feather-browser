import { describe, it, expect } from "vitest";
import { CapabilityGrantRegistry } from "../../../src/capability/grants";

describe("CapabilityGrantRegistry", () => {
  it("request creates a record scoped to one session and one capability, status=requested", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cdp-attach");

    expect(grant.status).toBe("requested");
    expect(grant.sessionId).toBe("ses_1");
    expect(grant.capability).toBe("cdp-attach");
    expect(typeof grant.id).toBe("string");
    expect(reg.get(grant.id)?.status).toBe("requested");
  });

  it("approve mints a single-use nonce and flips the grant to granted", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cdp-attach");

    const { nonce } = reg.approve(grant.id);

    expect(typeof nonce).toBe("string");
    expect(nonce.length).toBeGreaterThanOrEqual(32);
    expect(reg.get(grant.id)?.status).toBe("granted");
  });

  it("redeem consumes the nonce, returns the grant, and marks it used", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "vault-unlock");
    const { nonce } = reg.approve(grant.id);

    const redeemed = reg.redeem(nonce);

    expect(redeemed.ok).toBe(true);
    if (redeemed.ok) {
      expect(redeemed.grant.id).toBe(grant.id);
      expect(redeemed.grant.sessionId).toBe("ses_1");
      expect(redeemed.grant.capability).toBe("vault-unlock");
    }
    expect(reg.get(grant.id)?.status).toBe("used");
  });

  it("deny flips a requested grant to denied; a denied grant cannot be approved", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cdp-attach");

    reg.deny(grant.id);

    expect(reg.get(grant.id)?.status).toBe("denied");
    expect(() => reg.approve(grant.id)).toThrow(/denied/);
  });

  it("approve only works on a requested grant — never twice, never on a spent grant", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cdp-attach");
    reg.approve(grant.id);

    expect(() => reg.approve(grant.id)).toThrow(/granted/);
  });

  it("a nonce is single-use — the second redeem fails", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cookie-export");
    const { nonce } = reg.approve(grant.id);

    expect(reg.redeem(nonce).ok).toBe(true);
    const second = reg.redeem(nonce);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("unknown-nonce");
  });

  it("redeem of an unknown nonce fails without leaking anything", () => {
    const reg = new CapabilityGrantRegistry();
    const result = reg.redeem("not-a-real-nonce");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unknown-nonce");
  });

  it("revoke kills a granted-but-unused grant — its nonce no longer redeems", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cdp-attach");
    const { nonce } = reg.approve(grant.id);

    reg.revoke(grant.id);

    expect(reg.get(grant.id)?.status).toBe("revoked");
    const result = reg.redeem(nonce);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("revoked");
  });

  it("revokeAllForSession is the session-close/MFA-open/shutdown hammer — terminal grants untouched", () => {
    const reg = new CapabilityGrantRegistry();
    const pending = reg.request("ses_1", "cdp-attach");
    const granted = reg.request("ses_1", "vault-unlock");
    reg.approve(granted.id);
    const spent = reg.request("ses_1", "cookie-export");
    const { nonce } = reg.approve(spent.id);
    reg.redeem(nonce);
    const otherSession = reg.request("ses_2", "cdp-attach");

    reg.revokeAllForSession("ses_1");

    expect(reg.get(pending.id)?.status).toBe("revoked");
    expect(reg.get(granted.id)?.status).toBe("revoked");
    expect(reg.get(spent.id)?.status).toBe("used");
    expect(reg.get(otherSession.id)?.status).toBe("requested");
  });

  it("a granted grant dies on its own after the TTL — get reports expired, redeem refuses", () => {
    let nowMs = 1_000_000;
    const reg = new CapabilityGrantRegistry({ now: () => nowMs });
    const grant = reg.request("ses_1", "cdp-attach", { ttlMs: 5_000 });
    const { nonce } = reg.approve(grant.id);

    nowMs += 5_001;

    expect(reg.get(grant.id)?.status).toBe("expired");
    const result = reg.redeem(nonce);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("a granted grant within its TTL still redeems", () => {
    let nowMs = 1_000_000;
    const reg = new CapabilityGrantRegistry({ now: () => nowMs });
    const grant = reg.request("ses_1", "cdp-attach", { ttlMs: 5_000 });
    const { nonce } = reg.approve(grant.id);

    nowMs += 4_999;

    expect(reg.redeem(nonce).ok).toBe(true);
  });

  it("emits a redacted event for every lifecycle transition — and never the nonce", () => {
    const events: { type: string; grant: { id: string; status: string } }[] = [];
    const reg = new CapabilityGrantRegistry({ onEvent: (e) => events.push(e) });

    const a = reg.request("ses_1", "cdp-attach");
    const { nonce } = reg.approve(a.id);
    reg.redeem(nonce);
    const b = reg.request("ses_1", "vault-unlock");
    reg.deny(b.id);
    const c = reg.request("ses_1", "cookie-export");
    reg.approve(c.id);
    reg.revoke(c.id);

    expect(events.map((e) => e.type)).toEqual([
      "grant.requested", "grant.granted", "grant.used",
      "grant.requested", "grant.denied",
      "grant.requested", "grant.granted", "grant.revoked",
    ]);
    for (const e of events) {
      expect(JSON.stringify(e)).not.toContain(nonce);
    }
  });

  it("consumeGranted spends the approved grant for (session, capability) without any external nonce", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cookie-export");
    reg.approve(grant.id);

    const result = reg.consumeGranted("ses_1", "cookie-export");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.grant.id).toBe(grant.id);
    expect(reg.get(grant.id)?.status).toBe("used");
  });

  it("consumeGranted is single-use and scope-exact", () => {
    const reg = new CapabilityGrantRegistry();
    const grant = reg.request("ses_1", "cookie-export");
    reg.approve(grant.id);

    expect(reg.consumeGranted("ses_1", "cdp-attach").ok).toBe(false);
    expect(reg.consumeGranted("ses_2", "cookie-export").ok).toBe(false);
    expect(reg.consumeGranted("ses_1", "cookie-export").ok).toBe(true);

    const second = reg.consumeGranted("ses_1", "cookie-export");
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("no-grant");
  });

  it("consumeGranted refuses an expired grant with reason expired, a pending one with no-grant", () => {
    let nowMs = 1_000_000;
    const reg = new CapabilityGrantRegistry({ now: () => nowMs });
    const pendingOnly = reg.request("ses_2", "cookie-export");
    expect(pendingOnly.status).toBe("requested");
    const noApproval = reg.consumeGranted("ses_2", "cookie-export");
    expect(noApproval.ok).toBe(false);
    if (!noApproval.ok) expect(noApproval.reason).toBe("no-grant");

    const grant = reg.request("ses_1", "cookie-export", { ttlMs: 1_000 });
    reg.approve(grant.id);
    nowMs += 2_000;
    const result = reg.consumeGranted("ses_1", "cookie-export");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("expiry is observable as an event exactly once, when first noticed", () => {
    let nowMs = 1_000_000;
    const events: { type: string }[] = [];
    const reg = new CapabilityGrantRegistry({ now: () => nowMs, onEvent: (e) => events.push(e) });
    const grant = reg.request("ses_1", "cdp-attach", { ttlMs: 1_000 });
    reg.approve(grant.id);

    nowMs += 2_000;
    reg.get(grant.id);
    reg.get(grant.id);

    expect(events.filter((e) => e.type === "grant.expired")).toHaveLength(1);
  });
});
