import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  isCurrentScheme,
  hashSessionToken,
  newSessionToken,
  newOpaqueId,
} from "../src/index.ts";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const stored = await hashPassword("demo-losenord-1234");
    expect(isCurrentScheme(stored)).toBe(true);
    expect(await verifyPassword("demo-losenord-1234", stored)).toBe(true);
    expect(await verifyPassword("fel-losenord", stored)).toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  it("does not throw on a malformed stored value", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(isCurrentScheme("bcrypt$...")).toBe(false);
  });
});

describe("session tokens", () => {
  it("hashes deterministically and generates unique tokens", () => {
    const token = newSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(newSessionToken()).not.toBe(newSessionToken());
    expect(newOpaqueId(16)).toHaveLength(22);
  });
});
