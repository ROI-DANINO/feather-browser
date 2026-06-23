import { describe, it, expect } from "vitest";
import { LaunchSchema } from "../../../src/transport/routes";

// Finding #1 (2026-06-23): LaunchSchema must carry identityId through to the handler.
// 5a wired identityId into SessionManager.launch but not the transport schema, so Zod
// stripped it and launch-by-identity was unreachable over the API.
describe("LaunchSchema", () => {
  it("preserves identityId so launch-by-identity reaches the manager", () => {
    const parsed = LaunchSchema.parse({ identityId: "gh-spine-test", profile: { kind: "persistent" } });
    expect(parsed.identityId).toBe("gh-spine-test");
  });

  it("still accepts a plain workspace launch without identityId", () => {
    const parsed = LaunchSchema.parse({ workspaceId: "default", profile: { kind: "disposable" } });
    expect(parsed.identityId).toBeUndefined();
    expect(parsed.workspaceId).toBe("default");
  });
});
