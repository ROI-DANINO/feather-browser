// tests/integration/perception-walk.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { walkAllFrames } from "../../src/commands/perception/walk";

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser.close(); });

async function pageWith(html: string): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.setContent(html);
  return page;
}

describe("walkAllFrames", () => {
  it("flags a button covered by a fixed overlay, and not the overlay's own button", async () => {
    const page = await pageWith(`
      <button id="real">Real</button>
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
        <button id="accept">Accept all</button>
      </div>`);
    const { actions, overlays } = await walkAllFrames(page);
    const real = actions.find((a) => a.meta.name === "Real");
    const accept = actions.find((a) => a.meta.name === "Accept all");
    expect(real!.meta.state).toBe("covered");
    expect(accept!.meta.state).toBe("actionable");
    expect(overlays.some((o) => o.coverPct >= 90 && o.blocking)).toBe(true);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("never reports an input's typed value as its name", async () => {
    const page = await pageWith(`<input id="pw" type="password" aria-label="Password" value="hunter2">`);
    const { actions } = await walkAllFrames(page);
    const pw = actions.find((a) => a.meta.tag === "INPUT")!;
    expect(pw.meta.name).toBe("Password");
    expect(JSON.stringify(actions)).not.toContain("hunter2");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("pierces an open shadow root", async () => {
    const page = await pageWith(`<div id="host"></div><script>
      const r = document.getElementById('host').attachShadow({mode:'open'});
      r.innerHTML = '<button>Shadow Btn</button>';
    </script>`);
    const { actions } = await walkAllFrames(page);
    expect(actions.some((a) => a.meta.name === "Shadow Btn")).toBe(true);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("names icon-only buttons from a descendant aria-label", async () => {
    const page = await pageWith(`<div role="button" id="like"><svg aria-label="Like" width="24" height="24"><rect width="24" height="24"/></svg></div>`);
    const { actions } = await walkAllFrames(page);
    const like = actions.find((a) => a.meta.role === "button");
    expect(like!.meta.name).toBe("Like");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("prefers visible text over a descendant aria-label", async () => {
    const page = await pageWith(`<button>Save<svg aria-label="star" width="10" height="10"><rect width="10" height="10"/></svg></button>`);
    const { actions } = await walkAllFrames(page);
    const btn = actions.find((a) => a.meta.tag === "BUTTON");
    expect(btn!.meta.name).toBe("Save");
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("does not report a large absolutely-positioned layout grid (no z-index) as an overlay", async () => {
    const page = await pageWith(`<div style="position:absolute;top:0;left:0;width:100%;height:90%"><button>Cell</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays).toEqual([]);          // the Calendar-grid false positive
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("still reports absolutely-positioned overlays that carry an explicit z-index", async () => {
    const page = await pageWith(`
      <div style="position:absolute;top:0;left:0;width:100%;height:70%;z-index:50"><button>Accept all</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("reports dialog-role elements as overlays regardless of position", async () => {
    const page = await pageWith(`
      <div role="dialog" style="position:absolute;top:0;left:0;width:100%;height:70%"><button>OK</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("reports a non-positioned dialog-role div as an overlay", async () => {
    const page = await pageWith(`
      <div role="dialog" style="width:100%;height:70%"><button>Submit</button></div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });

  it("links actions inside an overlay to it via overlayIndex; outside buttons get none", async () => {
    const page = await pageWith(`
      <button id="outside">Continue</button>
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
        <button id="inside">Accept all</button>
      </div>`);
    const { actions, overlays } = await walkAllFrames(page);
    expect(overlays.length).toBe(1);
    expect(actions.find((a) => a.meta.name === "Accept all")!.meta.overlayIndex).toBe(0);
    expect(actions.find((a) => a.meta.name === "Continue")!.meta.overlayIndex).toBeUndefined();
    for (const a of actions) await a.handle.dispose();
    await page.context().close();
  });
});
