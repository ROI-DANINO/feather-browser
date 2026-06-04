import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assertNoSecretLeak, scanForSecret } from "../helpers/leak-scan";

const SECRET = "FEATHER-LEAK-CANARY-test123";
let dir: string;

beforeEach(async () => {
  dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "leak-scan-"));
});

afterEach(async () => {
  await fs.promises.rm(dir, { recursive: true, force: true });
});

describe("assertNoSecretLeak", () => {
  it("throws when the secret is in a clean-tier file", async () => {
    await fs.promises.writeFile(path.join(dir, "session.jsonl"), `{"url":"${SECRET}"}\n`);
    expect(() => assertNoSecretLeak(SECRET, [dir])).toThrow(/SECRET LEAK/);
  });

  it("passes on a clean tree", async () => {
    await fs.promises.writeFile(path.join(dir, "session.jsonl"), `{"url":"http://ok"}\n`);
    expect(() => assertNoSecretLeak(SECRET, [dir])).not.toThrow();
  });

  it("reports capture-tier hits without throwing", async () => {
    await fs.promises.writeFile(path.join(dir, "trace.zip"), `binary ${SECRET}`);
    const sub = path.join(dir, "screenshots");
    await fs.promises.mkdir(sub);
    await fs.promises.writeFile(path.join(sub, "a.png"), `pixels ${SECRET}`);
    const report = scanForSecret(SECRET, [dir]);
    expect(report.cleanTierHits).toHaveLength(0);
    expect(report.captureFindings.length).toBeGreaterThanOrEqual(2);
    expect(() => assertNoSecretLeak(SECRET, [dir])).not.toThrow();
  });

  it("tolerates a missing root without crashing", () => {
    const report = scanForSecret(SECRET, [path.join(dir, "nope")]);
    expect(report.cleanTierHits).toHaveLength(0);
  });
});
