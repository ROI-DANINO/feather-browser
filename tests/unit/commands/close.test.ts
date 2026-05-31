import { vi, describe, it, expect, beforeEach } from "vitest";
import { CloseSessionHandler } from "../../../src/commands/close";

const mockManager = { close: vi.fn().mockResolvedValue(undefined) };
const ctx = { requestId: "req_test_001" };

describe("CloseSessionHandler", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls manager.close with the correct sessionId", async () => {
    await new CloseSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.close).toHaveBeenCalledWith("ses_test_001", expect.objectContaining({ force: undefined, quarantineDisposableProfile: undefined }));
  });

  it("passes force: true when specified", async () => {
    await new CloseSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001", force: true }, ctx);
    expect(mockManager.close).toHaveBeenCalledWith("ses_test_001", expect.objectContaining({ force: true }));
  });

  it("passes quarantineDisposableProfile: true when specified", async () => {
    await new CloseSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001", quarantineDisposableProfile: true }, ctx);
    expect(mockManager.close).toHaveBeenCalledWith("ses_test_001", expect.objectContaining({ quarantineDisposableProfile: true }));
  });

  it("returns sessionId and state: 'closed'", async () => {
    const result = await new CloseSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.state).toBe("closed");
  });
});
