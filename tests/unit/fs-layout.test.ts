// tests/unit/fs-layout.test.ts
import { describe, it, expect } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";

describe("FeatherPaths (single-root string — backward compat)", () => {
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

  it("builds disposable profile dir", () => {
    expect(paths.disposableProfileDir("ses1")).toBe(".feather/tmp/sessions/ses1/profile");
  });

  it("builds quarantined profile dir", () => {
    expect(paths.quarantinedProfileDir("ses1")).toBe(".feather/debug/ses1/quarantined-profile");
  });

  it("builds identities dir + per-identity file", () => {
    expect(paths.identitiesDir()).toBe(".feather/identities");
    expect(paths.identityFile("roi-linkedin")).toBe(".feather/identities/roi-linkedin.json");
  });
});

describe("FeatherPaths (split roots)", () => {
  const paths = new FeatherPaths({
    data: "/D",
    state: "/S",
    cache: "/C",
    runtime: "/R",
  });

  it("routes profiles + workspace + lock to the data root", () => {
    expect(paths.profileDir("ws1")).toBe("/D/profiles/ws1/profile");
    expect(paths.workspaceJson("ws1")).toBe("/D/profiles/ws1/workspace.json");
    expect(paths.lockFile("ws1")).toBe("/D/profiles/ws1/lock");
  });

  it("routes disposable sessions to the cache root", () => {
    expect(paths.disposableSessionDir("s")).toBe("/C/tmp/sessions/s");
    expect(paths.disposableProfileDir("s")).toBe("/C/tmp/sessions/s/profile");
  });

  it("routes debug + logs + measurements to the state root", () => {
    expect(paths.debugDir("s")).toBe("/S/debug/s");
    expect(paths.quarantinedProfileDir("s")).toBe("/S/debug/s/quarantined-profile");
    expect(paths.sessionLog("s")).toBe("/S/logs/sessions/s.jsonl");
    expect(paths.measurementDir("r")).toBe("/S/measurements/r");
  });

  it("routes run files (token + endpoint) to the runtime root", () => {
    expect(paths.tokenFile()).toBe("/R/run/control-token");
    expect(paths.endpointFile()).toBe("/R/run/endpoint.json");
  });

  it("routes identities to the data root", () => {
    expect(paths.identitiesDir()).toBe("/D/identities");
    expect(paths.identityFile("x")).toBe("/D/identities/x.json");
  });
});

describe("ensureDirs", () => {
  it("creates all subdirs given a string root", async () => {
    const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-test-"));
    await ensureDirs(tmp);
    const check = (rel: string) => fs.existsSync(path.join(tmp, rel));
    expect(check("profiles")).toBe(true);
    expect(check("tmp/sessions")).toBe(true);
    expect(check("debug")).toBe(true);
    expect(check("logs/sessions")).toBe(true);
    expect(check("run")).toBe(true);
    expect(check("measurements")).toBe(true);
    expect(check("identities")).toBe(true);
    await fs.promises.rm(tmp, { recursive: true });
  });

  it("creates subdirs across split roots given a FeatherDirs object", async () => {
    const mkTmp = () => fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-test-"));
    const [data, state, cache, runtime] = await Promise.all([mkTmp(), mkTmp(), mkTmp(), mkTmp()]);
    await ensureDirs({ data, state, cache, runtime });
    expect(fs.existsSync(path.join(data, "profiles"))).toBe(true);
    expect(fs.existsSync(path.join(cache, "tmp/sessions"))).toBe(true);
    expect(fs.existsSync(path.join(state, "debug"))).toBe(true);
    expect(fs.existsSync(path.join(state, "logs/sessions"))).toBe(true);
    expect(fs.existsSync(path.join(runtime, "run"))).toBe(true);
    expect(fs.existsSync(path.join(state, "measurements"))).toBe(true);
    await Promise.all([data, state, cache, runtime].map(d => fs.promises.rm(d, { recursive: true })));
  });
});
