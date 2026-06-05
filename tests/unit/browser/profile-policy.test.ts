import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { disablePasswordManager } from "../../../src/browser/profile-policy";

let dir: string;
beforeEach(async () => { dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-pol-")); });
afterEach(async () => { await fs.promises.rm(dir, { recursive: true, force: true }); });

describe("disablePasswordManager", () => {
  it("creates Default/Preferences with the password-manager keys off when none exists", async () => {
    await disablePasswordManager(dir);
    const prefs = JSON.parse(await fs.promises.readFile(path.join(dir, "Default", "Preferences"), "utf8"));
    expect(prefs.credentials_enable_service).toBe(false);
    expect(prefs.profile.password_manager_enabled).toBe(false);
  });

  it("merges into existing Preferences without clobbering other keys", async () => {
    const def = path.join(dir, "Default");
    await fs.promises.mkdir(def, { recursive: true });
    await fs.promises.writeFile(path.join(def, "Preferences"),
      JSON.stringify({ profile: { name: "keep-me" }, other: 1 }));
    await disablePasswordManager(dir);
    const prefs = JSON.parse(await fs.promises.readFile(path.join(def, "Preferences"), "utf8"));
    expect(prefs.other).toBe(1);
    expect(prefs.profile.name).toBe("keep-me");
    expect(prefs.profile.password_manager_enabled).toBe(false);
    expect(prefs.credentials_enable_service).toBe(false);
  });
});
