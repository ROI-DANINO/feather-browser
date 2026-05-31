// tests/unit/fs-layout.test.ts
import { describe, it, expect } from "vitest";
import { FeatherPaths } from "../../src/fs-layout";

describe("FeatherPaths", () => {
  const paths = new FeatherPaths(".feather");

  it("builds profile path for workspace", () => {
    expect(paths.profileDir("ws1")).toBe(".feather/profiles/ws1/profile");
  });

  it("builds workspace json path", () => {
    expect(paths.workspaceJson("ws1")).toBe(".feather/profiles/ws1/workspace.json");
  });

  it("builds lock path for workspace", () => {
    expect(paths.lockFile("ws1")).toBe(".feather/profiles/ws1/lock");
  });

  it("builds disposable session dir", () => {
    expect(paths.disposableSessionDir("ses1")).toBe(".feather/tmp/sessions/ses1");
  });

  it("builds debug dir for session", () => {
    expect(paths.debugDir("ses1")).toBe(".feather/debug/ses1");
  });

  it("builds session log path", () => {
    expect(paths.sessionLog("ses1")).toBe(".feather/logs/sessions/ses1.jsonl");
  });

  it("builds run dir paths", () => {
    expect(paths.endpointFile()).toBe(".feather/run/endpoint.json");
    expect(paths.tokenFile()).toBe(".feather/run/control-token");
  });

  it("builds measurement dir for run", () => {
    expect(paths.measurementDir("run1")).toBe(".feather/measurements/run1");
  });
});
