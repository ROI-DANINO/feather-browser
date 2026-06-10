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
  // composed-tree containment: hops shadow boundaries (collect() pierces them, so containment must too)
  function containsComposed(o, n){
    while (n){ if (n === o) return true; n = n.parentNode || (n.getRootNode && n.getRootNode().host); }
    return false;
  }
  metas.forEach((m, i) => {
    const k = ov.els.findIndex((o) => containsComposed(o, els[i]));   // containsComposed matches self on its first iteration (n === o): an interactive overlay self-links, which is correct
    if (k >= 0) m.overlayIndex = k;
  });
  return { elements: els, metas, overlays: ov.metas, overlayEls: ov.els, total: els.length };
})()`;

async function walkFrame(frame: Frame, frameId: string): Promise<{ actions: RawAction[]; overlays: RawOverlay[]; overlayEls: ElementHandle[] }> {
  const resHandle = await frame.evaluateHandle(WALK_SRC(frameId));
  try {
    const props = await resHandle.getProperties();
    const elementsHandle = props.get("elements")!;
    const elProps = await elementsHandle.getProperties();
    const handles: ElementHandle[] = [];
    for (const p of elProps.values()) { const el = p.asElement(); if (el) handles.push(el as ElementHandle); else await p.dispose(); }
    const overlayElsHandle = props.get("overlayEls")!;
    const ovProps = await overlayElsHandle.getProperties();
    const overlayEls: ElementHandle[] = [];
    for (const p of ovProps.values()) { const el = p.asElement(); if (el) overlayEls.push(el as ElementHandle); else await p.dispose(); }
    const data = (await resHandle.evaluate((r: any) => ({ metas: r.metas, overlays: r.overlays }))) as
      { metas: WalkMeta[]; overlays: RawOverlay[] };
    await elementsHandle.dispose();
    await overlayElsHandle.dispose();
    const actions = handles.map((handle, i) => ({ handle, frameId, meta: data.metas[i] }));
    return { actions, overlays: data.overlays, overlayEls };
  } finally {
    await resHandle.dispose();
  }
}

/** Index of the top-frame overlay that (composed-tree) contains this child frame's <iframe>
 * element, or undefined. Both handles live in the top frame's context, so handle-identity
 * comparison inside one evaluate is sound. */
async function overlayIndexOfFrame(top: Frame, child: Frame, overlayEls: ElementHandle[]): Promise<number | undefined> {
  const fe = await child.frameElement().catch(() => null);
  if (!fe) return undefined;
  try {
    const idx = await top.evaluate(
      ({ els, fe }: { els: Element[]; fe: Element }) =>
        els.findIndex((o) => {
          let n: any = fe;
          while (n) { if (n === o) return true; n = n.parentNode || (n.getRootNode && (n.getRootNode() as any).host); }
          return false;
        }),
      { els: overlayEls, fe } as any,
    );
    return idx >= 0 ? idx : undefined;
  } catch {
    return undefined;
  } finally {
    await fe.dispose().catch(() => {});
  }
}

/** Walk the top frame + same-origin child frames (depth-capped). */
export async function walkAllFrames(page: Page): Promise<{ actions: RawAction[]; overlays: RawOverlay[] }> {
  const top = page.mainFrame();
  const topOrigin = safeOrigin(top.url());
  const actions: RawAction[] = [];
  const overlays: RawOverlay[] = [];
  let topOverlayEls: ElementHandle[] = [];

  async function visit(frame: Frame, depth: number, inheritedIdx?: number) {
    const fid = `f${depth}_${actions.length}`;
    try {
      const res = await walkFrame(frame, frame === top ? "top" : fid);
      if (frame !== top) {
        // A child frame's own overlayIndex points into its own (discarded) overlay list and
        // would dangle. Replace it with the top-frame index inherited from the overlay that
        // contains this frame's <iframe> element — that is what lets /dismiss reach buttons
        // inside same-origin iframe overlays.
        for (const a of res.actions) {
          if (inheritedIdx != null) a.meta.overlayIndex = inheritedIdx;
          else delete a.meta.overlayIndex;
        }
        for (const h of res.overlayEls) h.dispose().catch(() => {});
      } else {
        topOverlayEls = res.overlayEls;
        overlays.push(...res.overlays);
      }
      actions.push(...res.actions);
    } catch { /* frame may be detached/blank; skip */ }
    if (depth >= MAX_FRAME_DEPTH) return;
    for (const child of frame.childFrames()) {
      if (safeOrigin(child.url()) !== topOrigin) continue; // same-origin only
      // Deeper frames inherit their parent's link; only top-frame children can be matched
      // directly (their <iframe> element lives in the top frame, where the overlay handles are).
      let idx = inheritedIdx;
      if (frame === top && topOverlayEls.length > 0) {
        idx = (await overlayIndexOfFrame(top, child, topOverlayEls)) ?? inheritedIdx;
      }
      await visit(child, depth + 1, idx);
    }
  }
  await visit(top, 0);
  for (const h of topOverlayEls) h.dispose().catch(() => {});
  return { actions, overlays };
}

function safeOrigin(url: string): string {
  try { return new URL(url).origin; } catch { return ""; }
}
