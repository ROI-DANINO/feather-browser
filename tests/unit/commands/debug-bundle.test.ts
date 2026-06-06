import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../src/debug/bundle", () => ({
  // vitest 4 requires a mock used with `new` to be implemented with `function`/`class`,
  // not an arrow returning an object (arrows are not constructors).
  DebugBundle: vi.fn().mockImplementation(function () {
    return { finalize: vi.fn().mockResolvedValue("/tmp/.feather/debug/ses_test_001/manifest.json") };
  }),
}));

import { DebugBundleHandler } from "../../../src/commands/debug-bundle";
import { DebugBundle } from "../../../src/debug/bundle";

const mockSession = {
  sessionId: "ses_test_001",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  getPageInfoList: vi.fn().mockResolvedValue([]),
  getState: vi.fn().mockReturnValue("running"),
  toRecord: vi.fn().mockReturnValue({ sessionId: "ses_test_001", state: "running" }),
};
const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const mockPaths = { debugDir: vi.fn().mockReturnValue("/tmp/.feather/debug/ses_test_001") };
const ctx = { requestId: "req_test_001" };

describe("DebugBundleHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.get.mockReturnValue(mockSession);
    (DebugBundle as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { finalize: vi.fn().mockResolvedValue("/tmp/.feather/debug/ses_test_001/manifest.json") };
    });
  });

  it("calls manager.get with the correct sessionId", async () => {
    await new DebugBundleHandler(mockManager as any, mockPaths as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockManager.get).toHaveBeenCalledWith("ses_test_001");
  });

  it("constructs a DebugBundle with session and paths", async () => {
    await new DebugBundleHandler(mockManager as any, mockPaths as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(DebugBundle).toHaveBeenCalledWith(mockSession, mockPaths);
  });

  it("calls finalize with reason 'requested'", async () => {
    const mockFinalize = vi.fn().mockResolvedValue("/tmp/.feather/debug/ses_test_001/manifest.json");
    (DebugBundle as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { finalize: mockFinalize };
    });
    await new DebugBundleHandler(mockManager as any, mockPaths as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockFinalize).toHaveBeenCalledWith("requested");
  });

  it("returns sessionId, path, and manifest", async () => {
    const result = await new DebugBundleHandler(mockManager as any, mockPaths as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.sessionId).toBe("ses_test_001");
    expect(result.path).toBe("/tmp/.feather/debug/ses_test_001");
    expect(result.manifest).toBe("/tmp/.feather/debug/ses_test_001/manifest.json");
  });
});
