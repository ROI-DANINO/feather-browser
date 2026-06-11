import { describe, it, expect, vi } from "vitest";
import { createOriginHostGuard } from "../../../src/transport/middleware";

const PORT = 44197;

function makeReqReply(opts: {
  method?: string;
  host?: string;
  origin?: string;
  referer?: string;
  localPort?: number;
}) {
  const headers: Record<string, string> = {};
  if (opts.host !== undefined) headers.host = opts.host;
  if (opts.origin !== undefined) headers.origin = opts.origin;
  if (opts.referer !== undefined) headers.referer = opts.referer;

  const request = {
    method: opts.method ?? "GET",
    headers,
    requestId: "req_test",
    socket: { localPort: opts.localPort ?? PORT },
  } as any;

  const sendMock = vi.fn().mockResolvedValue(undefined);
  const statusMock = vi.fn().mockReturnValue({ send: sendMock });
  const reply = { status: statusMock } as any;

  return { request, reply, statusMock, sendMock };
}

function expectPass(statusMock: ReturnType<typeof vi.fn>) {
  expect(statusMock).not.toHaveBeenCalled();
}

function expectReject(statusMock: ReturnType<typeof vi.fn>, sendMock: ReturnType<typeof vi.fn>, code: string) {
  expect(statusMock).toHaveBeenCalledWith(403);
  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({ ok: false, error: expect.objectContaining({ code }) }),
  );
}

describe("createOriginHostGuard — Host check (all methods)", () => {
  const guard = createOriginHostGuard();

  it("1. passes 127.0.0.1 with matching port, no Origin", async () => {
    const { request, reply, statusMock } = makeReqReply({ host: `127.0.0.1:${PORT}` });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("2. passes localhost with matching port", async () => {
    const { request, reply, statusMock } = makeReqReply({ host: `localhost:${PORT}` });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("3. passes [::1] (IPv6 loopback) with matching port", async () => {
    const { request, reply, statusMock } = makeReqReply({ host: `[::1]:${PORT}` });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("4. rejects a foreign Host (DNS-rebind)", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({ host: `evil.com:${PORT}` });
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_HOST");
  });

  it("9. rejects a missing Host header", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({});
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_HOST");
  });

  it("10. rejects a loopback Host with a non-matching port", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({ host: `127.0.0.1:${PORT + 1}` });
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_HOST");
  });

  it("allows a loopback Host with no port (lenient when absent)", async () => {
    const { request, reply, statusMock } = makeReqReply({ host: "127.0.0.1" });
    await guard(request, reply);
    expectPass(statusMock);
  });
});

describe("createOriginHostGuard — Origin/Referer check (state-changing methods only)", () => {
  const guard = createOriginHostGuard();

  it("5. passes a same-origin POST", async () => {
    const { request, reply, statusMock } = makeReqReply({
      method: "POST",
      host: `127.0.0.1:${PORT}`,
      origin: `http://127.0.0.1:${PORT}`,
    });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("6. rejects a foreign-Origin POST (CSRF drive-by)", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({
      method: "POST",
      host: `127.0.0.1:${PORT}`,
      origin: "https://evil.com",
    });
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_ORIGIN");
  });

  it("7. rejects a foreign Referer when Origin is absent (POST)", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({
      method: "POST",
      host: `127.0.0.1:${PORT}`,
      referer: "https://evil.com/page",
    });
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_ORIGIN");
  });

  it("8. passes a same-origin Referer (POST, Origin absent)", async () => {
    const { request, reply, statusMock } = makeReqReply({
      method: "POST",
      host: `127.0.0.1:${PORT}`,
      referer: `http://127.0.0.1:${PORT}/v1/sessions/x/resume`,
    });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("passes a POST with neither Origin nor Referer (non-browser caller)", async () => {
    const { request, reply, statusMock } = makeReqReply({ method: "POST", host: `127.0.0.1:${PORT}` });
    await guard(request, reply);
    expectPass(statusMock);
  });

  it("DELETE with a foreign Origin is rejected (unsafe method)", async () => {
    const { request, reply, statusMock, sendMock } = makeReqReply({
      method: "DELETE",
      host: `127.0.0.1:${PORT}`,
      origin: "https://evil.com",
    });
    await guard(request, reply);
    expectReject(statusMock, sendMock, "FORBIDDEN_ORIGIN");
  });

  it("does NOT enforce Origin on a cross-origin GET (human opens resume link from another origin)", async () => {
    const { request, reply, statusMock } = makeReqReply({
      method: "GET",
      host: `127.0.0.1:${PORT}`,
      origin: "https://some-agent-ui.example",
      referer: "https://some-agent-ui.example/dashboard",
    });
    await guard(request, reply);
    expectPass(statusMock);
  });
});
