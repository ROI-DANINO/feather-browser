// tower/levels/runtime-enable/page.test.ts
import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import { runtimeEnablePage } from "./page";

/** Register the plugin on a bare Fastify instance (server.ts wiring is a separate step) and GET it. */
async function serve(nonce: string) {
  const app = Fastify();
  await app.register(runtimeEnablePage);
  const res = await app.inject({ method: "GET", url: "/levels/runtime-enable", query: { nonce } });
  await app.close();
  return res;
}

describe("runtime-enable page", () => {
  it("serves HTML (200) containing the injected nonce", async () => {
    const res = await serve("abc-123-nonce");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("abc-123-nonce");
  });

  it("inlines the vendored probe (its function text is present in the page)", async () => {
    const res = await serve("n1");
    // Load-bearing tokens from detector.js — the probe measurement, not just any script.
    expect(res.body).toContain("runtimeEnableLeakVars");
    expect(res.body).toContain("stackLookupCount");
    expect(res.body).toContain("Object.defineProperty");
    expect(res.body).toContain("console.debug");
    // The self-report contract to the sink.
    expect(res.body).toContain('detectorId');
    expect(res.body).toContain("/sink/");
    expect(res.body).toContain("sendBeacon");
  });

  it("HTML-escapes the nonce so a quote/angle-bracket cannot break out (no injection)", async () => {
    const evil = `"><script>alert(1)</script>`;
    const res = await serve(evil);
    // The raw dangerous sequence must NOT appear verbatim (that would be a real injection)...
    expect(res.body).not.toContain(`"><script>alert(1)`);
    expect(res.body).not.toContain("</script>alert");
    // ...it appears fully escaped instead, in both the attribute and the text contexts.
    expect(res.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(res.body).toContain("&quot;&gt;");
  });

  it("a nonce with an ampersand is escaped (attribute-safe), not doubled or dropped", async () => {
    const res = await serve("a&b");
    expect(res.body).toContain("a&amp;b");
    expect(res.body).not.toContain(">a&b<"); // raw & never survives into the HTML
  });
});
