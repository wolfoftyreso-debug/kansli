import { describe, expect, it } from "vitest";
import { issuedPathFromCookie, publicIrmaUrl, tokenFromIssuedPath } from "./issued-path.ts";

describe("issued link cookie value", () => {
  it("accepts a raw token or a path and rejects junk", () => {
    const token = "w1lVNJQz5JVSh57mLbE1EwvEWcI8S-dD";
    expect(tokenFromIssuedPath(`/irma/l/${token}`)).toBe(token);
    expect(tokenFromIssuedPath(token)).toBe(token);
    expect(tokenFromIssuedPath("/irma/l/nope")).toBeNull();
    expect(tokenFromIssuedPath("/irma/l/../x")).toBeNull();
    expect(issuedPathFromCookie(token)).toBe(`/irma/l/${token}`);
    expect(issuedPathFromCookie(`/irma/l/${token}`)).toBe(`/irma/l/${token}`);
    expect(issuedPathFromCookie("")).toBeNull();
    expect(publicIrmaUrl(`/irma/l/${token}`, "http://127.0.0.1:3000")).toBe(
      `http://127.0.0.1:3000/irma/l/${token}`,
    );
  });
});
