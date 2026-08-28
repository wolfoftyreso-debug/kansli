import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowRequest } from "./rate-limit.ts";

describe("allowRequest", () => {
  it("allows traffic under the limit and blocks the overflow", () => {
    const key = `test-${Date.now()}`;
    assert.equal(allowRequest(key, 2, 60_000, 1_000), true);
    assert.equal(allowRequest(key, 2, 60_000, 1_100), true);
    assert.equal(allowRequest(key, 2, 60_000, 1_200), false);
  });

  it("resets after the window", () => {
    const key = `test-window-${Date.now()}`;
    assert.equal(allowRequest(key, 1, 1_000, 5_000), true);
    assert.equal(allowRequest(key, 1, 1_000, 5_500), false);
    assert.equal(allowRequest(key, 1, 1_000, 6_100), true);
  });
});
