import { vi, describe, it, expect, beforeEach } from "vitest";
import { LaunchSessionHandler } from "../../../src/commands/launch";

const mockSession = {
  sessionId: "ses_test_001",
  getPageInfoList: vi.fn().mockResolvedValue([{ pageId: "page_001", url: "about:blank", title: "" }]),
  toRecord: vi.fn().mockReturnValue({
    sessionId: "ses_test_001", workspaceId: "default", profileKind: "persistent",
    browserMode: "chromium-new-headless", state: "running",
    profilePath: "/tmp/.feather/profiles/default/profile",
    debugDir: "/tmp/.feather/debug/ses_test_001", proxy: null,
    startedAt: "2026-05-31T00:00:00.000Z", profileLocked: true,
  }),
};

const mockManager = { launch: vi.fn().mockResolvedValue(mockSession) };
const ctx = { requestId: "req_test_001" };

describe("LaunchSessionHandler", () => {
  beforeEach(() => { vi.clearAllMocks(); mockManager.launch.mockResolvedValue(mockSession); });

  it("calls manager.launch with the provided input", async () => {
    const input = { workspaceId: "default", profile: { kind: "persistent" as const }, browserMode: "chromium-new-headless" as const };
    await new LaunchSessionHandler(mockManager as any).execute(input, ctx);
    expect(mockManager.launch).toHaveBeenCalledWith(input);
  });

  it("returns a SessionRecord with pages populated from getPageInfoList", async () => {
    const result = await new LaunchSessionHandler(mockManager as any).execute({ profile: { kind: "persistent" } }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.pages).toEqual([{ pageId: "page_001", url: "about:blank", title: "" }]);
  });

  it("includes state from toRecord", async () => {
    const result = await new LaunchSessionHandler(mockManager as any).execute({ profile: { kind: "persistent" } }, ctx);
    expect(result.state).toBe("running");
  });
});
