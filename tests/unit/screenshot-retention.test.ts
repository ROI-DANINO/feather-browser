// tests/unit/screenshot-retention.test.ts
import { describe, it, expect } from "vitest";
import { pruneScreenshots } from "../../src/commands/screenshot";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("pruneScreenshots", () => {
  it("keeps only the newest N files", async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "shots-"));
    for (let i = 0; i < 5; i++) {
      const p = path.join(dir, `page_x-2026010100000${i}.png`);
      await fs.promises.writeFile(p, "x");
      await new Promise((r) => setTimeout(r, 5));
    }
    await pruneScreenshots(dir, 2);
    const left = (await fs.promises.readdir(dir)).sort();
    expect(left.length).toBe(2);
    expect(left).toContain("page_x-20260101000003.png");
    expect(left).toContain("page_x-20260101000004.png");
  });

  it("is a no-op on a missing dir", async () => {
    await expect(pruneScreenshots("/no/such/dir", 2)).resolves.toBeUndefined();
  });
});
