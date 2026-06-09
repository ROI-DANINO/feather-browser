// THROWAWAY SPIKE — perception loop "between B and C".
// Validates: DOM-walk run in a CDP ISOLATED WORLD, elements keyed by backendNodeId
// (no DOM mutation), elementFromPoint occlusion detection, ref->act round-trip.
// Run: node spikes/observe-perception-spike.mjs
import { chromium } from "playwright";

// ---- functions injected into the page (toString'd into the isolated world) ----
function featherWalk() {
  const TAGS = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);
  const ROLES = new Set(["button", "link", "textbox", "combobox", "checkbox", "radio",
    "menuitem", "tab", "option", "switch", "searchbox"]);
  function interactive(el) {
    if (TAGS.has(el.tagName)) return true;
    const r = el.getAttribute && el.getAttribute("role");
    if (r && ROLES.has(r)) return true;
    if (el.hasAttribute && el.hasAttribute("onclick")) return true;
    if (typeof el.tabIndex === "number" && el.tabIndex >= 0 && el.tagName !== "BODY" && el.tagName !== "HTML") return true;
    try { if (getComputedStyle(el).cursor === "pointer" && el.children.length === 0) return true; } catch (e) {}
    return false;
  }
  function visible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  return Array.prototype.filter.call(document.querySelectorAll("*"), (el) => {
    try { return interactive(el) && visible(el); } catch (e) { return false; }
  });
}

function metaOf() {
  const el = this;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const inVp = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  let covered = false, occ = null;
  if (inVp) {
    const top = document.elementFromPoint(cx, cy);
    if (top && top !== el && !el.contains(top) && !top.contains(el)) {
      covered = true;
      const cs = getComputedStyle(top);
      occ = { tag: top.tagName, role: top.getAttribute("role"), pos: cs.position, z: cs.zIndex,
        text: (top.innerText || "").trim().slice(0, 40) };
    }
  }
  const name = (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.value ||
    el.innerText || el.getAttribute("name") || el.getAttribute("title") || "").trim().slice(0, 70);
  return { tag: el.tagName, role: el.getAttribute("role") || null, name,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    inViewport: inVp, covered, occluder: occ };
}

function overlayScan() {
  const W = innerWidth, H = innerHeight, area = W * H, out = [];
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (!["fixed", "absolute", "sticky"].includes(cs.position)) continue;
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    if (cs.pointerEvents === "none") continue;
    const r = el.getBoundingClientRect();
    const cover = Math.max(0, Math.min(r.right, W) - Math.max(r.left, 0)) *
      Math.max(0, Math.min(r.bottom, H) - Math.max(r.top, 0));
    if (cover / area > 0.25) {
      out.push({ tag: el.tagName, role: el.getAttribute("role"), z: cs.zIndex, pos: cs.position,
        coverPct: Math.round((100 * cover) / area), text: (el.innerText || "").trim().slice(0, 50) });
    }
  }
  return out;
}

// ---- the observe pass: isolated world + backendNodeId, NO dom mutation ----
async function observe(page, cap = 80) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const { frameTree } = await cdp.send("Page.getFrameTree");
  const frameId = frameTree.frame.id;
  const { executionContextId } = await cdp.send("Page.createIsolatedWorld",
    { frameId, worldName: "feather-observe" });

  const walkRes = await cdp.send("Runtime.evaluate", {
    expression: `(${featherWalk.toString()})()`,
    contextId: executionContextId,
    returnByValue: false,
  });
  if (walkRes.exceptionDetails) throw new Error("walk failed: " + JSON.stringify(walkRes.exceptionDetails));

  const props = await cdp.send("Runtime.getProperties", {
    objectId: walkRes.result.objectId, ownProperties: true,
  });
  const elProps = props.result.filter((p) => p.enumerable && p.value && p.value.subtype === "node");

  const list = [];
  let i = 0;
  for (const p of elProps.slice(0, cap)) {
    const oid = p.value.objectId;
    const { node } = await cdp.send("DOM.describeNode", { objectId: oid });
    const m = await cdp.send("Runtime.callFunctionOn", {
      objectId: oid,
      functionDeclaration: `function(){ return (${metaOf.toString()}).call(this); }`,
      returnByValue: true,
    });
    if (m.exceptionDetails) { list.push({ ref: "e" + i++, backendNodeId: node.backendNodeId, err: m.exceptionDetails.text }); continue; }
    list.push({ ref: "e" + i++, backendNodeId: node.backendNodeId, ...m.result.value });
  }

  const ov = await cdp.send("Runtime.evaluate", {
    expression: `(${overlayScan.toString()})()`,
    contextId: executionContextId,
    returnByValue: true,
  });

  return { cdp, executionContextId, list, overlays: ov.result.value, totalInteractive: elProps.length };
}

// resolve a backendNodeId ref and click it — proves ref->act with no mutation
async function clickByRef(cdp, backendNodeId) {
  const { object } = await cdp.send("DOM.resolveNode", { backendNodeId });
  const res = await cdp.send("Runtime.callFunctionOn", {
    objectId: object.objectId,
    functionDeclaration: "function(){ this.click(); return (this.innerText||this.outerHTML).slice(0,60); }",
    returnByValue: true,
  });
  return res.result.value;
}

function summarize(label, o) {
  console.log(`\n===== ${label} =====`);
  console.log(`interactive found: ${o.totalInteractive} (showing up to ${o.list.length})`);
  console.log(`overlays flagged: ${o.overlays.length}`);
  for (const ov of o.overlays) console.log(`  OVERLAY ${ov.tag} z=${ov.z} pos=${ov.pos} cover=${ov.coverPct}% "${ov.text}"`);
  const covered = o.list.filter((e) => e.covered);
  console.log(`elements covered/blocked: ${covered.length}`);
  for (const e of o.list.slice(0, 18)) {
    const c = e.covered ? ` [COVERED by ${e.occluder?.tag} "${e.occluder?.text}"]` : "";
    const vp = e.inViewport ? "" : " (off-screen)";
    console.log(`  ${e.ref} bn=${e.backendNodeId} ${e.tag}${e.role ? "/" + e.role : ""} "${e.name}"${vp}${c}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // -------- TEST 1: CONTROLLED ground truth --------
  const p1 = await ctx.newPage();
  await p1.setContent(`
    <html><body>
      <h1>Page</h1>
      <button id="real">Real Button</button>
      <input id="email" placeholder="Email">
      <a href="#" id="link">A link</a>
      <div id="banner" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;
           display:flex;align-items:center;justify-content:center">
        <div style="background:#fff;padding:40px">
          <p>We use cookies</p>
          <button id="accept">Accept all</button>
        </div>
      </div>
    </body></html>`);
  const o1 = await observe(p1);
  summarize("TEST 1 — CONTROLLED (button covered by fixed overlay)", o1);

  // assertions (ground truth)
  const real = o1.list.find((e) => e.name === "Real Button");
  const accept = o1.list.find((e) => e.name === "Accept all");
  console.log(`\n  GT real-button covered? ${real?.covered}  (expect true)`);
  console.log(`  GT accept-button covered? ${accept?.covered}  (expect false)`);
  console.log(`  GT overlay detected? ${o1.overlays.length > 0}  (expect true)`);

  // ref->act: click Accept via backendNodeId, then re-observe -> overlay should be gone
  if (accept) {
    const clicked = await clickByRef(o1.cdp, accept.backendNodeId);
    // banner has no JS handler, so manually verify resolveNode worked by re-reading; instead remove via the click path on a real handler:
    console.log(`  ref->act clicked "${clicked}" via backendNodeId (no DOM mutation used to find it)`);
  }
  await p1.close();

  // -------- TEST 2: Instagram login (ARIA-sparse real site) --------
  try {
    const p2 = await ctx.newPage();
    await p2.goto("https://www.instagram.com/accounts/login/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await p2.waitForTimeout(2500);
    const o2 = await observe(p2);
    summarize("TEST 2 — Instagram login (real, ARIA-sparse)", o2);
    const hasUser = o2.list.some((e) => /user|phone|email/i.test(e.name) || e.tag === "INPUT");
    console.log(`\n  found a username/text input? ${hasUser}`);
    await p2.close();
  } catch (e) {
    console.log("\n===== TEST 2 — Instagram FAILED: " + e.message + " =====");
  }

  // -------- TEST 3: real cookie-banner site --------
  for (const url of ["https://www.theguardian.com/international", "https://www.bbc.com/news"]) {
    try {
      const p3 = await ctx.newPage();
      await p3.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await p3.waitForTimeout(3000);
      const o3 = await observe(p3);
      summarize(`TEST 3 — ${url} (real consent banner?)`, o3);
      await p3.close();
    } catch (e) {
      console.log(`\n===== TEST 3 — ${url} FAILED: ${e.message} =====`);
    }
  }

  await browser.close();
  console.log("\n[spike done]");
}

main().catch((e) => { console.error("SPIKE ERROR", e); process.exit(1); });
