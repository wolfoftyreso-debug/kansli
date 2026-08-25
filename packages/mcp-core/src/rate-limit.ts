import { RATE_BUDGET, type RateClass } from "./risk.ts";

type Bucket = { resetAt: number; used: number };

const buckets = new Map<string, Bucket>();

export function resetRateLimits(): void {
  buckets.clear();
}

export function takeRateToken(key: string, rateClass: RateClass, now = Date.now()): boolean {
  const windowMs = 60_000;
  const budget = RATE_BUDGET[rateClass];
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, used: 1 });
    return true;
  }
  if (current.used >= budget) return false;
  current.used += 1;
  return true;
}
