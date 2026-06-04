import { vi, describe, it, expect, beforeEach } from "vitest";
import { GetSessionHandler, ListSessionsHandler } from "../../../src/commands/status";

const mockRecord = {
  sessionId: "ses_test_001", workspaceId: "default", profileKind: "persistent" as const,
  browserMode: "chromium-new-headless" as const, state: "running" as const,
  profilePath: "/tmp", debugDir: "/tmp", proxy: null,
  startedAt: "2026-05-31T00:00:00.000Z", profileLocked: true,
};

const mockSession = {
  sessionId: "ses_test_001",
  getPageInfoList: vi.fn().mockResolvedValue([{ pageId: "page_001", url: "https://example.com", title: "Example", loadState: "complete" }]),
  toRecord: vi.fn().mockReturnValue(mockRecord),
};

const mockManager = {
  get: vi.fn().mockReturnValue(mockSession),
  list: vi.fn().mockReturnValue([mockSession]),
};

const ctx = { requestId: "req_test_001" };

describe("GetSessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.get.mockReturnValue(mockSession);
    mockSession.getPageInfoList.mockResolvedValue([{ pageId: "page_001", url: "https://example.com", title: "Example", loadState: "complete" }]);
    mockSession.toRecord.mockReturnValue(mockRecord);
  });

  it("calls manager.get with the correct sessionId", async () => {
    await new GetSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.get).toHaveBeenCalledWith("ses_test_001");
  });

  it("returns a full SessionRecord with pages populated", async () => {
    const result = await new GetSessionHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.pages).toEqual([{ pageId: "page_001", url: "https://example.com", title: "Example", loadState: "complete" }]);
  });
});

describe("ListSessionsHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.list.mockReturnValue([mockSession]);
    mockSession.getPageInfoList.mockResolvedValue([{ pageId: "page_001", url: "https://example.com", title: "Example", loadState: "complete" }]);
    mockSession.toRecord.mockReturnValue(mockRecord);
  });

  it("returns an array of SessionRecords", async () => {
    const result = await new ListSessionsHandler(mockManager as any).execute({}, ctx);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe("ses_test_001");
  });

  it("returns an empty array when no sessions are active", async () => {
    mockManager.list.mockReturnValue([]);
    const result = await new ListSessionsHandler(mockManager as any).execute({}, ctx);
    expect(result).toEqual([]);
  });
});
