import { afterEach, describe, expect, it, vi } from "vitest";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "./throttle.ts";

describe("irma token throttle", () => {
  afterEach(() => {
    vi.useRealTimers();
    noteIrmaTokenSuccess("abc123456789");
  });

  it("blocks after 20 failures in the window", () => {
    const key = irmaThrottleKey("abc123456789xxxx");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("abc123456789xxxx");
    for (let i = 0; i < 19; i += 1) noteIrmaTokenFailure(key);
    expect(irmaTokenBlocked(key)).toBe(false);
    noteIrmaTokenFailure(key);
    expect(irmaTokenBlocked(key)).toBe(true);
    noteIrmaTokenSuccess(key);
    expect(irmaTokenBlocked(key)).toBe(false);
  });

  it("resets after the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T00:00:00.000Z"));
    const key = "window-key-1";
    for (let i = 0; i < 20; i += 1) noteIrmaTokenFailure(key);
    expect(irmaTokenBlocked(key)).toBe(true);
    vi.setSystemTime(new Date("2026-08-24T00:16:00.000Z"));
    expect(irmaTokenBlocked(key)).toBe(false);
  });
});
