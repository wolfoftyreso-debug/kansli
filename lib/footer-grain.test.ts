import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { footerGrain } from "./footer-grain.ts";

describe("footerGrain", () => {
  it("builds a path of squares rather than a text node", () => {
    assert.match(footerGrain.d, /^M\d+ \d+h3v3h-3z/);
    assert.equal(footerGrain.d.includes("Snart"), false);
    assert.equal(footerGrain.d.includes("jobba"), false);
    assert.ok(footerGrain.width > 0);
    assert.ok(footerGrain.height > 0);
    assert.equal(footerGrain.d.includes("hemifrån"), false);
    assert.equal((footerGrain.d.match(/h3v3/g) ?? []).length, 521);
  });
});
