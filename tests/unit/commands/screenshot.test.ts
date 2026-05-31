import { vi, describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, promises: { ...actual.promises, mkdir: vi.fn().mockResolvedValue(undefined) } };
});

import { ScreenshotHandler } from "../../../src/commands/screenshot";

const mockPage = {
  url: vi.fn().mockReturnValue("https://example.com"),
  screenshot: vi.fn().mockResolvedValue(undefined),
};

const mockSession = {
  sessionId: "ses_test_001",
  debugDir: "/tmp/.feather/debug/ses_test_001",
  getPage: vi.fn().mockReturnValue({ pageId: "page_001", page: mockPage }),
};

const mockManager = { get: vi.fn().mockReturnValue(mockSession) };
const ctx = { requestId: "req_test_001" };

describe("ScreenshotHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.screenshot.mockResolvedValue(undefined);
    mockSession.getPage.mockReturnValue({ pageId: "page_001", page: mockPage });
    mockManager.get.mockReturnValue(mockSession);
    (fs.promises.mkdir as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("creates the screenshots directory before taking the screenshot", async () => {
    await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(fs.promises.mkdir).toHaveBeenCalledWith(expect.stringContaining("screenshots"), { recursive: true });
  });

  it("calls page.screenshot with the correct path", async () => {
    await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining("/tmp/.feather/debug/ses_test_001/screenshots/") }));
  });

  it("returns an artifact with artifactId, path, and mimeType image/png", async () => {
    const result = await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(result.artifactId).toMatch(/^art_/);
    expect(result.path).toContain("/tmp/.feather/debug/ses_test_001/screenshots/");
    expect(result.mimeType).toBe("image/png");
  });

  it("passes fullPage option to page.screenshot when set to true", async () => {
    await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001", fullPage: true }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(expect.objectContaining({ fullPage: true }));
  });

  it("passes fullPage: false when fullPage is omitted", async () => {
    await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(expect.objectContaining({ fullPage: false }));
  });

  it("includes pageId in the screenshot filename", async () => {
    await new ScreenshotHandler(mockManager as any).execute({ sessionId: "ses_test_001" }, ctx);
    expect(mockPage.screenshot).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining("page_001") }));
  });
});
