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

  // The constant-time rewrite must preserve every one of these header-shape rejections. The array and
  // missing cases also guard against a naive timingSafeEqual port that would throw on a non-string or
  // mismatched-length input instead of cleanly returning 401.
  const reject = (headers: Record<string, unknown>) => async () => {
    const tokenAuth = createTokenAuth("correct-token");
    const sendMock = vi.fn().mockResolvedValue(undefined);
    const statusMock = vi.fn().mockReturnValue({ send: sendMock });
    const request = { headers, requestId: "test" } as any;
    const reply = { status: statusMock } as any;

    await tokenAuth(request, reply);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.objectContaining({ code: "UNAUTHORIZED" }) })
    );
  };

  it("returns 401 when the X-Feather-Token header is missing", reject({}));
  it("returns 401 when the header is an empty string", reject({ "x-feather-token": "" }));
  it("returns 401 when the header is sent more than once (array)", reject({ "x-feather-token": ["correct-token", "correct-token"] }));
  it("returns 401 (no throw) for a wrong token of a different length", reject({ "x-feather-token": "short" }));
});

describe("injectRequestId", () => {
  it("attaches a requestId string starting with req_ to the request object", () => {
    const request = { headers: {} } as any;
    injectRequestId(request);
    expect(typeof request.requestId).toBe("string");
    expect(request.requestId.startsWith("req_")).toBe(true);
  });
});
