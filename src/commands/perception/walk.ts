// src/commands/perception/walk.ts
import type { Page, Frame, ElementHandle } from "playwright";
import type { ActionState } from "../../sessions/types";

export interface WalkMeta {
  signature: string;
  role: string | null;
  name: string;
  tag: string;
  box: { x: number; y: number; w: number; h: number };
  state: ActionState;
  occludedBy?: { kind: "overlay" | "iframe" | "element"; name?: string };
  overlayIndex?: number;     // index into the same walk's overlays; set when an overlay element contains this one
}
export interface RawAction { handle: ElementHandle; frameId: string; meta: WalkMeta; }
export interface RawOverlay { kind: "modal" | "banner" | "iframe"; name: string; coverPct: number; blocking: boolean; }

const MAX_FRAME_DEPTH = 5;

// The in-page IIFE source. Read-only; pierces open shadow roots; never reads el.value.
// Returns { elements: Element[], metas: WalkMeta[], overlays: RawOverlay[], total: number }.
// `metas[i]` corresponds to `elements[i]`.
const WALK_SRC = (frameId: string) => `(() => {
  const INTERACTIVE_TAGS = new Set(["A","BUTTON","INPUT","SELECT","TEXTAREA","SUMMARY"]);
  const INTERACTIVE_ROLES = new Set(["button","link","textbox","combobox","checkbox","radio","menuitem","tab","option","switch","searchbox"]);
  function isInteractive(el){
    if (INTERACTIVE_TAGS.has(el.tagName)) return true;
    const r = el.getAttribute && el.getAttribute("role");
    if (r && INTERACTIVE_ROLES.has(r)) return true;
    if (el.hasAttribute && el.hasAttribute("onclick")) return true;
    if (typeof el.tabIndex === "number" && el.tabIndex >= 0 && el.tagName !== "BODY" && el.tagName !== "HTML") return true;
    try { if (getComputedStyle(el).cursor === "pointer" && el.children.length === 0) return true; } catch (e) {}
    return false;
  }
  function visible(el){
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  // shadow-piercing collector
  function collect(root, out){
    const els = root.querySelectorAll("*");
    for (const el of els){
      try { if (isInteractive(el) && visible(el)) out.push(el); } catch (e) {}
      if (el.shadowRoot) collect(el.shadowRoot, out);
    }
  }
  // structural signature including shadow boundaries
  function domPath(el){
    const seg = [];
    let node = el;
    while (node && node.nodeType === 1 && seg.length < 40){
      let i = 1, sib = node;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === node.tagName) i++;
      seg.unshift(node.tagName.toLowerCase() + "[" + i + "]");
      const parent = node.parentNode;
      if (parent && parent.host) { seg.unshift(">>"); node = parent.host; }   // cross shadow boundary
      else node = parent;
    }
    return seg.join("/");
  }
  function accName(el){
    const aria = el.getAttribute("aria-label");
    if (aria) return aria.trim();
    const ph = el.getAttribute("placeholder");
    if (ph) return ph.trim();
    if (el.id){ const lab = document.querySelector('label[for="'+CSS.escape(el.id)+'"]'); if (lab) return (lab.innerText||"").trim(); }
    const nm = el.getAttribute("name") || el.getAttribute("title");
    if (nm) return nm.trim();
    const txt = (el.innerText || "").trim();     // NEVER el.value
    if (txt) return txt;
    const labelled = el.querySelector("[aria-label]");   // icon-only buttons: borrow the icon's label, last resort
    if (labelled){ const v = labelled.getAttribute("aria-label"); if (v && v.trim()) return v.trim(); }
    return "";
  }
  function meta(el){
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const inVp = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    let state = inVp ? "actionable" : "offscreen";
    let occludedBy;
    if (el.disabled) state = "disabled";
    if (inVp && !el.disabled){
      const top = document.elementFromPoint(cx, cy);
      if (top && top !== el && !el.contains(top) && !top.contains(el)){
        state = "covered";
        const cs = getComputedStyle(top);
        const kind = top.tagName === "IFRAME" ? "iframe" : (cs.position === "fixed" || cs.position === "absolute") ? "overlay" : "element";
        occludedBy = { kind, name: (top.getAttribute("aria-label") || top.innerText || "").trim().slice(0,40) };
      }
    }
    const name = accName(el).slice(0,80);
    return { signature: ${JSON.stringify(frameId)} + "|" + (el.getAttribute("role")||"") + "|" + name + "|" + domPath(el),
      role: el.getAttribute("role") || null, name, tag: el.tagName,
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      state, occludedBy };
  }
  function overlays(){
    const W = innerWidth, H = innerHeight, area = W*H, metas = [], els = [];
    for (const el of document.querySelectorAll("body *")){
      const cs = getComputedStyle(el);
      const role = el.getAttribute("role");
      const dialogish = role === "dialog" || role === "alertdialog" || el.getAttribute("aria-modal") === "true";
      if (!dialogish && !["fixed","absolute","sticky"].includes(cs.position)) continue;
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      if (cs.pointerEvents === "none") continue;
      if (!dialogish && cs.position !== "fixed"){
        const z = parseInt(cs.zIndex, 10);          // "auto" → NaN
        if (!(z > 0)) continue;                     // absolute/sticky must explicitly float above content
      }
      const r = el.getBoundingClientRect();
      const cover = Math.max(0, Math.min(r.right,W)-Math.max(r.left,0)) * Math.max(0, Math.min(r.bottom,H)-Math.max(r.top,0));
      const pct = Math.round(100*cover/area);
      if (pct > 25){
        const kind = el.tagName === "IFRAME" ? "iframe" : pct >= 90 ? "modal" : "banner";
        metas.push({ kind, name: (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0,60), coverPct: pct, blocking: pct >= 60 });
        els.push(el);
      }
    }
    return { metas, els };
  }
  const els = [];
  collect(document, els);
  const ov = overlays();
  const metas = els.map(meta);
  metas.forEach((m, i) => {
    const k = ov.els.findIndex((o) => o.contains(els[i]));   // contains() includes self: an interactive overlay self-links, which is correct
    if (k >= 0) m.overlayIndex = k;
  });
  return { elements: els, metas, overlays: ov.metas, total: els.length };
})()`;

async function walkFrame(frame: Frame, frameId: string): Promise<{ actions: RawAction[]; overlays: RawOverlay[] }> {
  const resHandle = await frame.evaluateHandle(WALK_SRC(frameId));
  try {
    const props = await resHandle.getProperties();
    const elementsHandle = props.get("elements")!;
    const elProps = await elementsHandle.getProperties();
    const handles: ElementHandle[] = [];
    for (const p of elProps.values()) { const el = p.asElement(); if (el) handles.push(el as ElementHandle); else await p.dispose(); }
    const data = (await resHandle.evaluate((r: any) => ({ metas: r.metas, overlays: r.overlays }))) as
      { metas: WalkMeta[]; overlays: RawOverlay[] };
    await elementsHandle.dispose();
    const actions = handles.map((handle, i) => ({ handle, frameId, meta: data.metas[i] }));
    return { actions, overlays: data.overlays };
  } finally {
    await resHandle.dispose();
  }
}

/** Walk the top frame + same-origin child frames (depth-capped). */
export async function walkAllFrames(page: Page): Promise<{ actions: RawAction[]; overlays: RawOverlay[] }> {
  const top = page.mainFrame();
  const topOrigin = safeOrigin(top.url());
  const actions: RawAction[] = [];
  const overlays: RawOverlay[] = [];

  async function visit(frame: Frame, depth: number) {
    const fid = `f${depth}_${actions.length}`;
    try {
      const res = await walkFrame(frame, frame === top ? "top" : fid);
      if (frame !== top) for (const a of res.actions) delete a.meta.overlayIndex;
      actions.push(...res.actions);
      if (frame === top) overlays.push(...res.overlays);
    } catch { /* frame may be detached/blank; skip */ }
    if (depth >= MAX_FRAME_DEPTH) return;
    for (const child of frame.childFrames()) {
      if (safeOrigin(child.url()) === topOrigin) await visit(child, depth + 1); // same-origin only
    }
  }
  await visit(top, 0);
  return { actions, overlays };
}

function safeOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ""; }
}
