import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { IdentityStore } from "../../../src/identity/store";
import { IdentityManager } from "../../../src/identity/manager";
import {
  IdentityAlreadyExistsError,
  IdentityNotFoundError,
  IdentityValidationError,
} from "../../../src/identity/types";
import { FeatherPaths } from "../../../src/fs-layout";
import { FeatherLogger } from "../../../src/logs/logger";
import { onBusEvent } from "../../../src/logs/bus";
import type { ISessionManager } from "../../../src/sessions/manager";
import type { ISession } from "../../../src/sessions/types";

function fakeSessions(capture: { lastLaunch?: unknown }): ISessionManager {
  return {
    launch: async (input: unknown) => {
      capture.lastLaunch = input;
      return { sessionId: "ses_fake123" } as unknown as ISession;
    },
  } as unknown as ISessionManager;
}

describe("IdentityManager", () => {
  let root: string;
  let paths: FeatherPaths;
  let manager: IdentityManager;
  let captured: { lastLaunch?: unknown };

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-idmgr-"));
    paths = new FeatherPaths(root);
    const store = new IdentityStore(paths.identitiesDir());
    captured = {};
    manager = new IdentityManager(store, paths, fakeSessions(captured), new FeatherLogger(paths));
  });
  afterEach(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  it("creates a record with defaults applied", async () => {
    const rec = await manager.create({ id: "roi-linkedin", name: "Roi – LinkedIn" });
    expect(rec.id).toBe("roi-linkedin");
    expect(rec.defaultWorkspaceId).toBe("roi-linkedin"); // S1: defaults to id
    expect(rec.defaultProfileId).toBe("roi-linkedin");
    expect(rec.stealthPolicy).toEqual({ v: 1, mode: "secure" }); // S3 opaque default
    expect(rec.mfaPolicy).toEqual({ v: 1 });
    expect(rec.sites).toEqual([]);
    expect(rec.warmStatus).toBe("cold");
    expect(rec.version).toBe(1);
    // round-trips through the store
    expect((await manager.get("roi-linkedin")).id).toBe("roi-linkedin");
  });

  it("keeps a defaultWorkspaceId distinct from id (S1 separable identifiers)", async () => {
    const rec = await manager.create({ id: "alias", name: "Alias", defaultWorkspaceId: "real-ws" });
    expect(rec.defaultWorkspaceId).toBe("real-ws");
    expect(rec.defaultProfileId).toBe("alias");
  });

  it("rejects an invalid id slug", async () => {
    await expect(manager.create({ id: "Bad ID!", name: "x" })).rejects.toBeInstanceOf(IdentityValidationError);
  });

  it("rejects an empty name", async () => {
    await expect(manager.create({ id: "ok", name: "  " })).rejects.toBeInstanceOf(IdentityValidationError);
  });

  it("throws on duplicate id", async () => {
    await manager.create({ id: "dup", name: "Dup" });
    await expect(manager.create({ id: "dup", name: "Dup" })).rejects.toBeInstanceOf(IdentityAlreadyExistsError);
  });

  it("disables the password manager on the identity's profile at create (S5)", async () => {
    await manager.create({ id: "warmjar", name: "Warm Jar" });
    const prefs = JSON.parse(
      await fs.promises.readFile(path.join(paths.profileDir("warmjar"), "Default", "Preferences"), "utf8"),
    );
    expect(prefs.credentials_enable_service).toBe(false);
  });

  it("get throws IdentityNotFoundError for an unknown id", async () => {
    await expect(manager.get("ghost")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("delete removes the identity", async () => {
    await manager.create({ id: "del", name: "Del" });
    await manager.delete("del");
    await expect(manager.get("del")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("warm launches a persistent headed session on the identity's workspace", async () => {
    await manager.create({ id: "wf", name: "WF", defaultWorkspaceId: "wf-ws" });
    const { sessionId } = await manager.warm("wf");
    expect(sessionId).toBe("ses_fake123");
    expect(captured.lastLaunch).toMatchObject({
      workspaceId: "wf-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
  });

  it("warm throws IdentityNotFoundError for an unknown id", async () => {
    await expect(manager.warm("nobody")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("markWarm flips status explicitly and bumps version + lastWarmAt (S2)", async () => {
    await manager.create({ id: "mw", name: "MW" });
    await manager.markWarm("mw");
    const rec = await manager.get("mw");
    expect(rec.warmStatus).toBe("warm");
    expect(rec.version).toBe(2);
    expect(rec.lastWarmAt).toBeTypeOf("string");
  });

  it("serializes concurrent markWarm calls without losing updates (S4 write mutex)", async () => {
    await manager.create({ id: "race", name: "Race" });
    await Promise.all([manager.markWarm("race"), manager.markWarm("race")]);
    // Two serialized read-modify-write cycles → version 1 → 2 → 3. A lost update would leave it at 2.
    expect((await manager.get("race")).version).toBe(3);
  });

  it("emits identity.created and identity.warmed on the bus", async () => {
    const seen: string[] = [];
    const unsub = onBusEvent((evt) => seen.push(evt.event));
    try {
      await manager.create({ id: "ev", name: "Ev" });
      await manager.markWarm("ev");
    } finally {
      unsub();
    }
    expect(seen).toContain("identity.created");
    expect(seen).toContain("identity.warmed");
  });
});
