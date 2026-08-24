const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 20;
const failures = new Map<string, { count: number; resetAt: number }>();

export function irmaTokenBlocked(key: string): boolean {
  const row = failures.get(key);
  if (!row) return false;
  if (row.resetAt <= Date.now()) {
    failures.delete(key);
    return false;
  }
  return row.count >= MAX_FAILURES;
}

export function noteIrmaTokenFailure(key: string): void {
  const now = Date.now();
  const row = failures.get(key);
  if (!row || row.resetAt <= now) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  row.count += 1;
}

export function noteIrmaTokenSuccess(key: string): void {
  failures.delete(key);
}

export function irmaThrottleKey(token: string): string {
  return token.trim().slice(0, 12) || "empty";
}
