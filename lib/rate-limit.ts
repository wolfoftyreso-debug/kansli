type Bucket = number[];

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
  return true;
}
