import { describe, it, expect, vi } from "vitest";
import { createTokenAuth, injectRequestId } from "../../../src/transport/middleware";

describe("createTokenAuth", () => {
  it("calls reply.status(401).send() when token is wrong", async () => {
    const tokenAuth = createTokenAuth("correct-token");
    const sendMock = vi.fn().mockResolvedValue(undefined);
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const request = { headers: { "x-feather-token": "wrong-token" }, requestId: "test" } as any;
    const reply = { status: statusMock } as any;

    await tokenAuth(request, reply);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }) })
    );
  });

  it("does not call reply when token is correct", async () => {
    const tokenAuth = createTokenAuth("correct-token");
    const sendMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const request = { headers: { "x-feather-token": "correct-token" }, requestId: "test" } as any;
    const reply = { status: statusMock } as any;

    await tokenAuth(request, reply);

    expect(statusMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("injectRequestId", () => {
  it("attaches a requestId string starting with req_ to the request object", () => {
    const request = { headers: {} } as any;
    injectRequestId(request);
    expect(typeof request.requestId).toBe("string");
    expect(request.requestId.startsWith("req_")).toBe(true);
  });
});
