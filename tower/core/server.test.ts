// tower/core/server.test.ts
import { describe, it, expect } from "vitest";
import { buildServer } from "./server";
import type { DetectorReport } from "./types";

describe("buildServer", () => {
  it("GET /health -> ok", async () => {
    const app = buildServer({ onReport: () => {} });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });

  it("POST /sink/:nonce with a matching nonce forwards the report", async () => {
    const seen: DetectorReport[] = [];
    const app = buildServer({ onReport: (r) => seen.push(r) });
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "n123", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].verdict).toBe("ok");
    await app.close();
  });

  it("POST /sink/:nonce rejects a nonce mismatch with 400 and does not forward", async () => {
    const seen: DetectorReport[] = [];
    const app = buildServer({ onReport: (r) => seen.push(r) });
    const res = await app.inject({
      method: "POST",
      url: "/sink/n123",
      payload: { nonce: "DIFFERENT", detectorId: "rebrowser", verdict: "ok" },
    });
    expect(res.statusCode).toBe(400);
    expect(seen).toHaveLength(0);
    await app.close();
  });

  it("GET /levels/placeholder serves an HTML page", async () => {
    const app = buildServer({ onReport: () => {} });
    const res = await app.inject({ method: "GET", url: "/levels/placeholder" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("Tower placeholder level");
    await app.close();
  });
});
