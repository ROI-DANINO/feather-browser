import { vi, describe, it, expect } from "vitest";
import { HealthHandler } from "../../../src/commands/health";

function makeSession(state: string, titleImpl: () => Promise<string>) {
  return {
    getState: vi.fn().mockReturnValue(state),
    getPageCount: vi.fn().mockReturnValue(2),
    getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: { title: vi.fn(titleImpl) } }),
  };
}

const ctx = { requestId: "req_test" };

describe("HealthHandler", () => {
  it("reports alive when the page responds", async () => {
    const session = makeSession("running", async () => "OK");
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, ctx);
    expect(out).toEqual({ sessionId: "ses_x", state: "running", pages: 2, alive: true });
  });

  it("reports alive=false when the page call hangs past the deadline", async () => {
    const session = makeSession("running", () => new Promise<string>(() => {}));
    const handler = new HealthHandler({ get: () => session } as any, 100); // short deadline for the test
    const out = await handler.execute({ sessionId: "ses_x" }, ctx);
    expect(out.alive).toBe(false);
  });

  it("reports alive=false without probing when state is not running", async () => {
    const session = makeSession("closing", async () => "OK");
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, ctx);
    expect(out.alive).toBe(false);
    expect(session.getPage).not.toHaveBeenCalled();
  });

  it("reports alive=false when the page call rejects", async () => {
    const session = makeSession("running", async () => { throw new Error("Target closed"); });
    const handler = new HealthHandler({ get: () => session } as any);
    const out = await handler.execute({ sessionId: "ses_x" }, ctx);
    expect(out.alive).toBe(false);
  });
});
