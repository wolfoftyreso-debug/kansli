import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeHtml, parseContactFields } from "./contact.ts";

describe("parseContactFields", () => {
  it("accepts a complete enquiry", () => {
    const result = parseContactFields({
      name: "Alex Founder",
      organisation: "Northwind",
      email: "alex@northwind.example",
      process: "Weekly invoice matching still happens in a spreadsheet.",
    });

    assert.deepEqual(result, {
      ok: true,
      spam: false,
      data: {
        name: "Alex Founder",
        organisation: "Northwind",
        email: "alex@northwind.example",
        process: "Weekly invoice matching still happens in a spreadsheet.",
      },
    });
  });

  it("rejects a missing process description", () => {
    const result = parseContactFields({
      name: "Alex Founder",
      organisation: "Northwind",
      email: "alex@northwind.example",
      process: "   ",
    });

    assert.equal(result.ok, false);
  });

  it("rejects an invalid email", () => {
    const result = parseContactFields({
      name: "Alex Founder",
      organisation: "Northwind",
      email: "not-an-email",
      process: "Manual review of inbound PDFs.",
    });

    assert.equal(result.ok, false);
  });

  it("treats a filled honeypot as spam without erroring", () => {
    const result = parseContactFields({
      name: "Bot",
      organisation: "Spam",
      email: "bot@example.com",
      process: "Buy now",
      website: "https://spam.example",
    });

    assert.deepEqual(result, { ok: true, spam: true });
  });
});

describe("escapeHtml", () => {
  it("escapes markup that must not land in mail HTML", () => {
    assert.equal(
      escapeHtml(`<img src=x onerror="alert('xss')">`),
      "&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;",
    );
  });
});
