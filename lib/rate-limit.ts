type Bucket = number[];

const MAX_KEYS = 2_000;
const buckets = new Map<string, Bucket>();

export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const cutoff = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first) buckets.delete(first);
  }

  return true;
}
