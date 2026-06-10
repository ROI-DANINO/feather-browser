import { vi, describe, it, expect } from "vitest";
import { ListTabsHandler } from "../../../src/commands/list-tabs";

describe("ListTabsHandler", () => {
  it("returns the session's page list", async () => {
    const pages = [
      { pageId: "page_001", url: "https://a.example", title: "A", loadState: "load" },
      { pageId: "page_002", url: "https://b.example", title: "B", loadState: "load" },
    ];
    const manager = { listTabs: vi.fn().mockResolvedValue({ sessionId: "ses_x", pages }) };
    const handler = new ListTabsHandler(manager as any);
    const out = await handler.execute({ sessionId: "ses_x" }, { requestId: "req_1" });
    expect(manager.listTabs).toHaveBeenCalledWith("ses_x");
    expect(out.pages).toHaveLength(2);
    expect(out.pages[1].pageId).toBe("page_002");
  });
});
