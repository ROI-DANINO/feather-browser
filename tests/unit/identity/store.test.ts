import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { IdentityStore } from "../../../src/identity/store";
import { IdentityNotFoundError, type IdentityRecord } from "../../../src/identity/types";

function makeRecord(id: string): IdentityRecord {
  const now = "2026-06-15T00:00:00.000Z";
  return {
    id,
    name: `Name ${id}`,
    sites: ["https://example.com"],
    defaultWorkspaceId: id,
    defaultProfileId: id,
    stealthPolicy: { v: 1, mode: "secure" },
    mfaPolicy: { v: 1 },
    warmStatus: "cold",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

describe("IdentityStore", () => {
  let dir: string;
  let store: IdentityStore;

  beforeEach(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-identity-"));
    store = new IdentityStore(path.join(dir, "identities"));
  });
  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it("round-trips save → load", async () => {
    const rec = makeRecord("roi-linkedin");
    await store.save(rec);
    const loaded = await store.load("roi-linkedin");
    expect(loaded).toEqual(rec);
  });

  it("throws IdentityNotFoundError loading an unknown id", async () => {
    await expect(store.load("nope")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("lists all saved records", async () => {
    await store.save(makeRecord("a"));
    await store.save(makeRecord("b"));
    const ids = (await store.list()).map((r) => r.id).sort();
    expect(ids).toEqual(["a", "b"]);
  });

  it("skips corrupted files in list()", async () => {
    await store.save(makeRecord("good"));
    await fs.promises.writeFile(path.join(dir, "identities", "broken.json"), "{ not json", "utf8");
    const ids = (await store.list()).map((r) => r.id);
    expect(ids).toEqual(["good"]);
  });

  it("delete removes the file; double-delete throws IdentityNotFoundError", async () => {
    await store.save(makeRecord("x"));
    await store.delete("x");
    expect(await store.exists("x")).toBe(false);
    await expect(store.delete("x")).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("exists reflects presence", async () => {
    expect(await store.exists("y")).toBe(false);
    await store.save(makeRecord("y"));
    expect(await store.exists("y")).toBe(true);
  });

  it("writes the record file with owner-only permissions (council S5)", async () => {
    await store.save(makeRecord("perm"));
    const stat = await fs.promises.stat(path.join(dir, "identities", "perm.json"));
    // 0o600 — no group/other access to a file describing a warmed credential profile.
    expect(stat.mode & 0o077).toBe(0);
  });
});
