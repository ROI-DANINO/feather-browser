// tests/integration/observe.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser } from "playwright";
import { ObserveHandler } from "../../src/commands/observe";
import { FeatherSession } from "../../src/sessions/session";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser.close(); });

// Minimal manager exposing get(sessionId) -> session, with a live page.
async function setup(html: string) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.setContent(html);
  const session = new FeatherSession({
    workspaceId: "w", profileKind: "disposable", browserMode: "chromium-new-headless",
    profilePath: "/tmp/x", debugDir: "/tmp/x", proxy: null,
  });
  session.setContext(ctx);                       // registers the page; gives it a pageId
  const { pageId } = session.getPage();
  const manager = { get: () => session } as any;
  return { handler: new ObserveHandler(manager), session, pageId, ctx };
}

describe("ObserveHandler", () => {
  it("returns numbered refs, flags the overlay, and diff is null on first observe", async () => {
    const { handler, ctx } = await setup(`
      <button>Real</button>
      <div style="position:fixed;inset:0;z-index:9999"><button>Accept all</button></div>`);
    const r = await handler.execute({ sessionId: "s" }, { requestId: "r" });
    expect(r.actions[0].ref).toBe(`${r.observeId}.e0`);   // refs are observe-scoped
    expect(r.actions.find((a) => a.name === "Accept all")).toBeTruthy();
    expect(r.overlays.length).toBeGreaterThan(0);
    expect(r.diff).toBeNull();
    await ctx.close();
  });

  it("second observe yields a diff after the page changes", async () => {
    const { handler, session, pageId, ctx } = await setup(`<button>One</button>`);
    await handler.execute({ sessionId: "s" }, { requestId: "r" });
    const { page } = session.getPage(pageId);
    await page.evaluate(() => { const b = document.createElement("button"); b.textContent = "Two"; document.body.appendChild(b); });
    const r2 = await handler.execute({ sessionId: "s" }, { requestId: "r" });
    expect(r2.diff!.added.some((a) => a.desc?.includes("Two"))).toBe(true);
    await ctx.close();
  });
});
