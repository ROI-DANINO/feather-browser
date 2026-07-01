// tower/core/asr-ci.ts
//
// Clopper-Pearson (exact, Beta-quantile) confidence interval for a per-trial obedience rate (design
// §2.3 CI paragraph + §6.4). The security level scores any-of-k=3 per RUN, but a CI over the collapsed
// any-of-3 verdict saturates to 1 as runs accumulate — so the honest interval pools the RAW per-trial
// Bernoulli outcomes across all N runs (3N trials) and computes an exact interval on the per-trial
// obedience p. Report `per-trial ASR = p̂ [low, high], n=3N`, and label the k=3 headline "attack
// succeeded within 3 trials" (a sensitivity FLOOR: any-of-3 = 1-(1-p)^3), never a bare "ASR".
//
// Exact (Clopper-Pearson) is chosen over normal-approximation because n is small and p sits near 0/1
// for a security claim — the conservative direction is the safe one. Pure TS, no new dependency: the
// Beta quantiles come from the regularized incomplete beta function I_x(a,b) inverted by bisection.

export interface ConfidenceInterval {
  /** Point estimate k/n (0 when n = 0). */
  pHat: number;
  /** Lower bound of the (1 − α) two-sided exact interval. */
  low: number;
  /** Upper bound of the (1 − α) two-sided exact interval. */
  high: number;
}

/** log Γ(x) — Lanczos approximation (g = 7, n = 9). Accurate to ~1e-13 for x > 0. */
function logGamma(x: number): number {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    // Reflection formula: Γ(x)Γ(1−x) = π / sin(πx).
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + 7.5;
  for (let i = 1; i < c.length; i += 1) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Regularized incomplete beta function I_x(a,b) via the Lentz continued fraction (Numerical Recipes
 * `betai`/`betacf`). Returns a probability in [0,1]. Used as the Beta(a,b) CDF whose inverse gives the
 * Clopper-Pearson bounds.
 */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const lbeta = logGamma(a + b) - logGamma(a) - logGamma(b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b + lbeta) / a;

  // Continued fraction (Lentz). Converges fastest for x < (a+1)/(a+b+2); else use the symmetry
  // I_x(a,b) = 1 − I_{1−x}(b,a).
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  const tiny = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;

  // The CF's b0 term is the `d` init above. Each subsequent pair of steps shares one index m =
  // ceil(i/2): odd i → the even (aa_{2m}) numerator, even i → the odd (aa_{2m+1}) numerator (NR §6.4).
  for (let i = 1; i <= 300; i += 1) {
    const m = Math.ceil(i / 2);
    let numerator: number;
    if (i % 2 === 1) {
      numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }
    d = 1 + numerator * d;
    if (Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < tiny) c = tiny;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  return front * h;
}

/** Invert the Beta(a,b) CDF at probability `p` by bisection (monotone ⇒ robust). */
function betaQuantile(p: number, a: number, b: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (regularizedIncompleteBeta(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Two-sided Clopper-Pearson exact interval for `k` successes in `n` Bernoulli trials.
 *   low  = Beta⁻¹(α/2;  k,   n−k+1),  with low  = 0 when k = 0
 *   high = Beta⁻¹(1−α/2; k+1, n−k),   with high = 1 when k = n
 * `confidence` defaults to 0.95 (α = 0.05). n = 0 ⇒ the whole [0,1] (no information).
 */
export function clopperPearson(k: number, n: number, confidence = 0.95): ConfidenceInterval {
  if (!Number.isInteger(k) || !Number.isInteger(n) || k < 0 || n < 0 || k > n) {
    throw new Error(`clopperPearson: need integers 0 <= k <= n, got k=${k}, n=${n}`);
  }
  if (n === 0) return { pHat: 0, low: 0, high: 1 };

  const alpha = 1 - confidence;
  const pHat = k / n;
  const low = k === 0 ? 0 : betaQuantile(alpha / 2, k, n - k + 1);
  const high = k === n ? 1 : betaQuantile(1 - alpha / 2, k + 1, n - k);
  return { pHat, low, high };
}

/**
 * The any-of-k sensitivity floor: probability the attack succeeds in AT LEAST ONE of `k` trials given
 * a per-trial obedience `p`, i.e. 1 − (1 − p)^k. Documents WHY the k=3 headline is a floor, not an ASR
 * — at p = 0.18 any-of-3 ≈ 0.44; at p = 0.05 ≈ 0.14. Flag near-ceiling-secure levels for a higher k.
 */
export function anyOfKFloor(p: number, k: number): number {
  return 1 - Math.pow(1 - p, k);
}

/** The mandated headline label for a k-trial security result (design §2.3): never bare "ASR". */
export function attackWithinKLabel(k: number): string {
  return `attack succeeded within ${k} trials`;
}
