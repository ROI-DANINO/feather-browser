// tower/core/adapters/feather-client.test.ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FeatherClient, readFeatherEndpoint, type FeatherEndpoint } from "./feather-client";

const EP: FeatherEndpoint = { baseUrl: "http://127.0.0.1:4000", token: "tok123" };

/** A fake fetch that records the last request and returns a scripted envelope. */
function fakeFetch(envelope: unknown) {
  const seen: { url: string; init: any }[] = [];
  const fn = (async (url: string, init: any) => {
    seen.push({ url, init });
    return { json: async () => envelope } as any;
  }) as unknown as typeof fetch;
  return { fn, seen };
}

describe("readFeatherEndpoint", () => {
  it("reads baseUrl + the token file referenced by endpoint.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "feather-ep-"));
    const tokenFile = join(dir, "token");
    writeFileSync(tokenFile, "secret-token\n");
    writeFileSync(join(dir, "endpoint.json"), JSON.stringify({ baseUrl: "http://127.0.0.1:9", tokenFile }));
    expect(readFeatherEndpoint(join(dir, "endpoint.json"))).toEqual({ baseUrl: "http://127.0.0.1:9", token: "secret-token" });
  });
});

describe("FeatherClient", () => {
  it("createSession POSTs /v1/sessions with the token header and returns sessionId", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { sessionId: "ses_1" } });
    const id = await new FeatherClient(EP, fn).createSession();
    expect(id).toBe("ses_1");
    expect(seen[0].url).toBe("http://127.0.0.1:4000/v1/sessions");
    expect(seen[0].init.method).toBe("POST");
    expect(seen[0].init.headers["X-Feather-Token"]).toBe("tok123");
  });

  it("observe maps actions[] to an Observation", async () => {
    const { fn } = fakeFetch({ ok: true, data: {
      url: "https://x.test", title: "X",
      actions: [{ ref: "obs.e0", role: "button", name: "Go", tag: "BUTTON", state: "actionable", box: {} }],
    }});
    const obs = await new FeatherClient(EP, fn).observe("ses_1");
    expect(obs).toEqual({ url: "https://x.test", title: "X",
      elements: [{ ref: "obs.e0", role: "button", name: "Go", tag: "BUTTON", state: "actionable" }] });
  });

  it("click POSTs a ref target", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { clicked: true } });
    await new FeatherClient(EP, fn).click("ses_1", "obs.e0");
    expect(seen[0].url).toBe("http://127.0.0.1:4000/v1/sessions/ses_1/click");
    expect(JSON.parse(seen[0].init.body)).toEqual({ target: { by: "ref", ref: "obs.e0" } });
  });

  it("type POSTs a ref target + text", async () => {
    const { fn, seen } = fakeFetch({ ok: true, data: { typed: true } });
    await new FeatherClient(EP, fn).type("ses_1", "obs.e0", "hello");
    expect(JSON.parse(seen[0].init.body)).toEqual({ target: { by: "ref", ref: "obs.e0" }, text: "hello" });
  });

  it("throws on a non-ok envelope", async () => {
    const { fn } = fakeFetch({ ok: false, error: { code: "SESSION_NOT_FOUND" } });
    await expect(new FeatherClient(EP, fn).navigate("ses_x", "https://x.test")).rejects.toThrow(/SESSION_NOT_FOUND/);
  });
});
