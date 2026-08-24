import { describe, expect, it } from "vitest";
import {
  REVOLUT_OAUTH_PATH,
  revolutJwtIss,
  revolutOAuthRedirectUri,
  revolutRedirectStatus,
} from "./revolut-oauth.ts";

describe("Revolut OAuth redirect", () => {
  it("is not the Pixdrift Identity callback", () => {
    const uri = revolutOAuthRedirectUri({ APP_BASE_URL: "https://kansli.example.se" });
    expect(uri).toBe(`https://kansli.example.se${REVOLUT_OAUTH_PATH}`);
    expect(uri).not.toContain("/api/auth/callback");
    expect(uri).not.toContain("/idp");
    expect(revolutJwtIss(uri)).toBe("kansli.example.se");
  });

  it("rejects localhost for the Revolut portal", () => {
    const status = revolutRedirectStatus({ APP_BASE_URL: "http://127.0.0.1:3000" });
    expect(status.usableInRevolutPortal).toBe(false);
    expect(status.uri).toBe(`http://127.0.0.1:3000${REVOLUT_OAUTH_PATH}`);
  });

  it("accepts an explicit https redirect", () => {
    const status = revolutRedirectStatus({
      REVOLUT_REDIRECT_URI: "https://kansli.example.se/ekonomi/anslutningar/revolut",
    });
    expect(status.usableInRevolutPortal).toBe(true);
    expect(status.uri).toBe("https://kansli.example.se/ekonomi/anslutningar/revolut");
  });
});
