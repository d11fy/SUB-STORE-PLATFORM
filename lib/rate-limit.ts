// Sliding-window in-memory rate limiter.
//
// Per-process scope: effective within a single warm Node.js instance.
// On Vercel serverless, each warm worker independently tracks its own
// window, so limits are "per instance" rather than globally distributed.
// This still meaningfully throttles rapid retries from the same client
// hitting the same warm function.
//
// For distributed limits across serverless instances, install
// @upstash/ratelimit + @upstash/redis and replace the implementation
// below — the exported interface stays identical.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  limit: number;
}

// Each map entry is a sorted list of request timestamps (epoch ms)
// within the sliding window. Old entries are pruned on access.
const _store = new Map<string, number[]>();

// Prune stale entries periodically to bound memory under sustained load.
const MAX_KEYS = 50_000;
let _lastPrune = 0;

function maybePrune(windowMs: number): void {
  const now = Date.now();
  if (now - _lastPrune < 30_000 && _store.size < MAX_KEYS) return;
  _lastPrune = now;
  const cutoff = now - windowMs;
  for (const [k, ts] of _store) {
    const fresh = ts.filter((t) => t > cutoff);
    if (fresh.length === 0) _store.delete(k);
    else _store.set(k, fresh);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  maybePrune(windowMs);

  let timestamps = (_store.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= limit) {
    const retryAfterMs = Math.max(0, timestamps[0] + windowMs - now);
    return { allowed: false, remaining: 0, retryAfterMs, limit };
  }

  timestamps.push(now);
  _store.set(key, timestamps);

  return {
    allowed: true,
    remaining: limit - timestamps.length,
    retryAfterMs: 0,
    limit,
  };
}

// Pre-configured limiters ——————————————————————————————————————————————

/** 5 orders per minute per IP — checkout mutations */
export const checkoutRateLimit = (ip: string) =>
  rateLimit(`checkout:${ip}`, 5, 60_000);

/** 10 uploads per hour per storeId — payment proof uploads */
export const paymentProofRateLimit = (storeId: string) =>
  rateLimit(`proof:${storeId}`, 10, 3_600_000);

/** 10 generations per minute per storeId — AI content */
export const aiGenerationRateLimit = (storeId: string) =>
  rateLimit(`ai:${storeId}`, 10, 60_000);

/** 30 reports per minute per IP — client error reporting */
export const errorReportRateLimit = (ip: string) =>
  rateLimit(`errreport:${ip}`, 30, 60_000);
