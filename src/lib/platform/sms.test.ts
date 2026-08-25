import { describe, expect, it } from "vitest";
import { normalizeSwedishMobile, salesSmsBody, sendSms, smsConfigured } from "./sms.ts";

describe("SMS channel", () => {
  it("normalises Swedish mobiles and writes a short sales text", () => {
    expect(normalizeSwedishMobile("070-123 45 67")).toBe("+46701234567");
    expect(normalizeSwedishMobile("+46701234567")).toBe("+46701234567");
    expect(normalizeSwedishMobile("123")).toBeNull();
    expect(
      salesSmsBody({ invoiceNumber: "INV-1", customerName: "Holm AB", amountLabel: "125,00 kr" }),
    ).toBe("Sälj: faktura INV-1 till Holm AB, 125,00 kr. Pixdrift Ekonomi.");
  });

  it("does not send when the vendor is missing", async () => {
    const username = process.env.ELKS_API_USERNAME;
    const password = process.env.ELKS_API_PASSWORD;
    const user = process.env.ELKS_API_USER;
    delete process.env.ELKS_API_USERNAME;
    delete process.env.ELKS_API_PASSWORD;
    delete process.env.ELKS_API_USER;
    expect(smsConfigured()).toBe(false);
    const result = await sendSms({ to: "0701234567", body: "hej" }, async () => {
      throw new Error("should not fetch");
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/kopplad/);
    if (username) process.env.ELKS_API_USERNAME = username;
    if (password) process.env.ELKS_API_PASSWORD = password;
    if (user) process.env.ELKS_API_USER = user;
  });

  it("posts to 46elks when credentials exist", async () => {
    process.env.ELKS_API_USERNAME = "u";
    process.env.ELKS_API_PASSWORD = "p";
    const result = await sendSms({ to: "0701234567", body: "Sälj: test" }, async (url, init) => {
      expect(String(url)).toContain("46elks.com/a1/sms");
      expect(String((init as RequestInit).headers && (init as RequestInit).headers)).toBeTruthy();
      return new Response(JSON.stringify({ id: "sms-1" }), { status: 200 });
    });
    expect(result).toEqual({ ok: true, providerRef: "sms-1", reason: null });
    delete process.env.ELKS_API_USERNAME;
    delete process.env.ELKS_API_PASSWORD;
  });
});
