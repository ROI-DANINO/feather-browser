// tests/unit/observe-cache.test.ts
import { describe, it, expect } from "vitest";
import { FeatherSession } from "../../src/sessions/session";

function newSession() {
  return new FeatherSession({
    workspaceId: "w", profileKind: "disposable", browserMode: "chromium-new-headless",
    profilePath: "/tmp/x", debugDir: "/tmp/x", proxy: null,
  });
}

describe("observe cache", () => {
  it("stores and reads back per page, disposing replaced handles", async () => {
    const s = newSession();
    let disposed = 0;
    const fakeHandle = () => ({ dispose: async () => { disposed++; } } as any);
    s.setObserveCache("page_1", { observeId: "o1", rows: [], refs: new Map([["e0", fakeHandle()]]) });
    expect(s.getObserveCache("page_1")?.observeId).toBe("o1");
    s.setObserveCache("page_1", { observeId: "o2", rows: [], refs: new Map() });
    expect(disposed).toBe(1);                       // old handle disposed
    expect(s.getObserveCache("page_1")?.observeId).toBe("o2");
  });

  it("clears on clearObserveCache", () => {
    const s = newSession();
    s.setObserveCache("page_1", { observeId: "o1", rows: [], refs: new Map() });
    s.clearObserveCache("page_1");
    expect(s.getObserveCache("page_1")).toBeUndefined();
  });
});
