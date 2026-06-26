// src/browser/mouse-path.ts
// Pure, seedable human-like cursor path generator. No Playwright, no I/O — testable in isolation.
// Consumed by src/commands/move.ts, which drives page.mouse.move waypoint-by-waypoint.

export interface Point { x: number; y: number; }
export interface Waypoint { x: number; y: number; delayMs: number; }

export interface MousePathOpts {
  steps?: number;        // intermediate samples (default 25) — path length is steps+1
  curviness?: number;    // perpendicular bow as a fraction of distance (default 0.15)
  jitter?: number;       // per-step timing jitter, 0..1 (default 0.3)
  overshoot?: number;    // overshoot past target as a fraction of distance, 0 = off (default 0)
  minDelayMs?: number;   // per-step delay floor (default 8)
  maxDelayMs?: number;   // per-step delay ceiling (default 25)
  seed?: number;         // when set, output is deterministic; else random per call
}

const DEFAULTS = { steps: 25, curviness: 0.15, jitter: 0.3, overshoot: 0, minDelayMs: 8, maxDelayMs: 25 };

/** mulberry32 — tiny deterministic PRNG so a seed fully determines the path. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * A curved, variable-velocity path of waypoints from `from` to `to`.
 * Curve = cubic Bezier with randomized perpendicular control offsets (straight lines are the tell).
 * Velocity = ease-in-out sampling (slow-fast-slow) + jittered per-step delayMs.
 * Deterministic when `opts.seed` is set.
 */
export function mousePath(from: Point, to: Point, opts: MousePathOpts = {}): Waypoint[] {
  const o = { ...DEFAULTS, ...opts };
  const seed = opts.seed ?? Math.floor(Math.random() * 0xffffffff);
  const rand = makeRng(seed);

  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return [{ x: to.x, y: to.y, delayMs: o.minDelayMs }];

  const px = -dy / dist, py = dx / dist;           // unit perpendicular to the straight line
  const bow = () => (rand() * 2 - 1) * o.curviness * dist;
  const lerp = (t: number): Point => ({ x: from.x + dx * t, y: from.y + dy * t });
  const c1 = lerp(1 / 3), c2 = lerp(2 / 3);
  const off1 = bow(), off2 = bow();
  const p1: Point = { x: c1.x + px * off1, y: c1.y + py * off1 };
  const p2: Point = { x: c2.x + px * off2, y: c2.y + py * off2 };

  const baseDelay = (o.minDelayMs + o.maxDelayMs) / 2;
  const out: Waypoint[] = [];
  for (let i = 0; i <= o.steps; i++) {
    const t = easeInOut(i / o.steps);
    const pt = cubicBezier(from, p1, p2, to, t);
    const jittered = Math.round(baseDelay * (1 + (rand() * 2 - 1) * o.jitter));
    const delayMs = Math.max(o.minDelayMs, Math.min(o.maxDelayMs, jittered));
    out.push({ x: pt.x, y: pt.y, delayMs });
  }

  if (o.overshoot > 0) {
    const ox = to.x + (dx / dist) * o.overshoot * dist;
    const oy = to.y + (dy / dist) * o.overshoot * dist;
    const settle = Math.max(o.minDelayMs, Math.round(baseDelay));
    out.push({ x: ox, y: oy, delayMs: settle });
    out.push({ x: to.x, y: to.y, delayMs: settle });
  } else {
    out[out.length - 1] = { ...out[out.length - 1], x: to.x, y: to.y }; // land exactly on target
  }
  return out;
}
