// tower/core/timing.test.ts
import { describe, it, expect } from "vitest";
import { stopwatch } from "./timing";

describe("stopwatch", () => {
  it("records per-part and total ms using the injected clock", async () => {
    let t = 0;
    const clock = () => t;
    const sw = stopwatch(clock);

    await sw.part("a", async () => { t += 10; });
    await sw.part("b", async () => { t += 25; });

    expect(sw.parts()).toEqual([{ part: "a", ms: 10 }, { part: "b", ms: 25 }]);
    expect(sw.totalMs()).toBe(35);
  });

  it("times a part even when the fn throws, then re-throws", async () => {
    let t = 0;
    const sw = stopwatch(() => t);
    await expect(
      sw.part("boom", async () => { t += 5; throw new Error("x"); }),
    ).rejects.toThrow("x");
    expect(sw.parts()).toEqual([{ part: "boom", ms: 5 }]);
  });
});
