import { vi, describe, it, expect } from "vitest";
import { generateMarkdown } from "../../../src/commands/markdown-generator";

describe("generateMarkdown", () => {
  it("returns the evaluated markdown from the page", async () => {
    const mockPage = { evaluate: vi.fn().mockResolvedValue("# Hello\n\nWorld") };
    const result = await generateMarkdown(mockPage as any);
    expect(result).toBe("# Hello\n\nWorld");
  });

  it("caps output at 20000 characters", async () => {
    const mockPage = { evaluate: vi.fn().mockResolvedValue("x".repeat(25000)) };
    const result = await generateMarkdown(mockPage as any);
    expect(result.length).toBe(20000);
  });

  it("returns empty string when page.evaluate returns empty string", async () => {
    const mockPage = { evaluate: vi.fn().mockResolvedValue("") };
    const result = await generateMarkdown(mockPage as any);
    expect(result).toBe("");
  });

  it("calls page.evaluate exactly once", async () => {
    const mockPage = { evaluate: vi.fn().mockResolvedValue("# Test") };
    await generateMarkdown(mockPage as any);
    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
  });
});
