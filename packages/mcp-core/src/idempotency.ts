type Entry = { expiresAt: number; value: unknown };

const store = new Map<string, Entry>();

export function resetIdempotency(): void {
  store.clear();
}

export function idempotencyKeyOf(
  orgRef: string,
  tool: string,
  key: string | undefined,
): string | null {
  const trimmed = key?.trim();
  if (!trimmed) return null;
  return `${orgRef}:${tool}:${trimmed}`;
}

export function recallIdempotent(key: string, now = Date.now()): unknown | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function rememberIdempotent(key: string, value: unknown, ttlMs = 10 * 60_000): void {
  store.set(key, { expiresAt: Date.now() + ttlMs, value });
}
