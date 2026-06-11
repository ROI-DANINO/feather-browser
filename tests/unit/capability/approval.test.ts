import { describe, it, expect } from "vitest";
import { ApprovalStore } from "../../../src/capability/approval";

describe("ApprovalStore", () => {
  it("mints a humanToken and a csrf nonce bound to a grant, each unguessably long", () => {
    const store = new ApprovalStore();
    const { humanToken, csrfNonce } = store.mint("grant_1");

    expect(humanToken.length).toBeGreaterThanOrEqual(32);
    expect(csrfNonce.length).toBeGreaterThanOrEqual(32);
    expect(humanToken).not.toBe(csrfNonce);
    expect(store.peek(humanToken)?.grantId).toBe("grant_1");
  });

  it("peek exposes the csrf nonce for the page to embed, but not as the URL token", () => {
    const store = new ApprovalStore();
    const { humanToken, csrfNonce } = store.mint("grant_1");
    expect(store.peek(humanToken)?.csrfNonce).toBe(csrfNonce);
  });

  it("consume requires the matching csrf nonce and is single-use", () => {
    const store = new ApprovalStore();
    const { humanToken, csrfNonce } = store.mint("grant_1");

    expect(store.consume(humanToken, "wrong-nonce")).toEqual({ ok: false, reason: "bad-csrf" });
    const good = store.consume(humanToken, csrfNonce);
    expect(good).toEqual({ ok: true, grantId: "grant_1" });
    expect(store.consume(humanToken, csrfNonce)).toEqual({ ok: false, reason: "unknown-token" });
  });

  it("peek and consume on an unknown token report unknown-token without throwing", () => {
    const store = new ApprovalStore();
    expect(store.peek("nope")).toBeUndefined();
    expect(store.consume("nope", "x")).toEqual({ ok: false, reason: "unknown-token" });
  });

  it("discard drops a pending token (e.g. when its grant is revoked)", () => {
    const store = new ApprovalStore();
    const { humanToken, csrfNonce } = store.mint("grant_1");
    store.discard("grant_1");
    expect(store.peek(humanToken)).toBeUndefined();
    expect(store.consume(humanToken, csrfNonce)).toEqual({ ok: false, reason: "unknown-token" });
  });
});
