// Read-only CDP capture of the manual Claude-for-Chrome run on the Feather scratch profile.
// Attaches to the already-running Chromium's debug port (it was launched with
// --remote-debugging-port=0; the chosen port is in <profile>/DevToolsActivePort).
// Logs: (1) every tab navigation, (2) periodic innerText of each Claude-for-Chrome side panel
// so the agent's conversation + final output is captured as it evolves.
//
// This is a manual CDP attach OUTSIDE Feather's session API (the deferred v2/5c "warmed attach").
// Usage: CDP_PORT=43995 node capture.js   (run from anywhere inside the repo; resolves playwright
// from the project node_modules)

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PORT = process.env.CDP_PORT || "43995";
const CDP = `http://127.0.0.1:${PORT}`;
const OUT = __dirname;
const navLog = path.join(OUT, "navigations.jsonl");
const panelsDir = path.join(OUT, "panels");
fs.mkdirSync(panelsDir, { recursive: true });

const ts = () => new Date().toISOString();
const appendNav = (rec) => fs.appendFileSync(navLog, JSON.stringify(rec) + "\n");
const lastText = new Map();

function watchPage(page) {
  let url0 = "";
  try { url0 = page.url(); } catch {}
  appendNav({ ts: ts(), event: "page_seen", url: url0 });
  page.on("framenavigated", (frame) => {
    try {
      if (frame === page.mainFrame()) appendNav({ ts: ts(), event: "navigated", url: frame.url() });
    } catch {}
  });
  page.on("close", () => { try { appendNav({ ts: ts(), event: "page_closed", url: page.url() }); } catch {} });
}

async function poll(browser) {
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      let u = "";
      try { u = p.url(); } catch { continue; }
      if (!u.includes("sidepanel.html")) continue;
      let text = "";
      try { text = await p.evaluate(() => (document.body ? document.body.innerText : "")); } catch { continue; }
      const prev = lastText.get(u) || "";
      if (text && text !== prev) {
        lastText.set(u, text);
        const m = u.match(/[?&]tabId=(\d+)/);
        const safe = "panel-" + (m ? m[1] : u.replace(/[^a-z0-9]/gi, "_").slice(0, 40));
        fs.writeFileSync(path.join(panelsDir, safe + ".latest.txt"), `# ${u}\n# captured ${ts()}\n\n${text}`);
        fs.appendFileSync(path.join(panelsDir, safe + ".timeline.jsonl"), JSON.stringify({ ts: ts(), text }) + "\n");
      }
    }
  }
}

(async () => {
  const browser = await chromium.connectOverCDP(CDP);
  appendNav({ ts: ts(), event: "connected", cdp: CDP });
  for (const ctx of browser.contexts()) {
    ctx.on("page", (p) => watchPage(p));
    for (const p of ctx.pages()) watchPage(p);
  }
  await poll(browser);
  setInterval(() => poll(browser).catch(() => {}), 3000);
  browser.on("disconnected", () => { appendNav({ ts: ts(), event: "browser_disconnected" }); process.exit(0); });
})().catch((e) => {
  fs.appendFileSync(path.join(OUT, "capture-error.log"), ts() + " " + (e && e.stack || e) + "\n");
  process.exit(1);
});
