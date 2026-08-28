import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTACT_LIMITS, escapeHtml, oneLine, parseContactFields } from "./contact.ts";

const valid = {
  name: "Alex Founder",
  organisation: "Northwind",
  email: "alex@northwind.example",
  brief: "Weekly invoice matching still happens in a spreadsheet.",
};

describe("parseContactFields", () => {
  it("accepts a complete enquiry", () => {
    const result = parseContactFields(valid);
    assert.equal(result.ok, true);
    if (result.ok && !result.spam) {
      assert.equal(result.data.email, "alex@northwind.example");
      assert.equal(result.data.name, "Alex Founder");
    }
  });

  it("accepts Swedish characters, emoji and RTL text", () => {
    const result = parseContactFields({
      ...valid,
      name: "Åke Öberg",
      organisation: "Göteborgs Åkeri",
      brief: "Manuell granskning 😀 في ملمو. Enough text.",
    });
    assert.equal(result.ok, true);
    if (result.ok && !result.spam) {
      assert.equal(result.data.name, "Åke Öberg");
    }
  });

  it("rejects a missing brief", () => {
    const result = parseContactFields({ ...valid, brief: "   " });
    assert.equal(result.ok, false);
  });

  it("rejects non-string fields", () => {
    const result = parseContactFields({
      name: 12,
      organisation: ["Northwind"],
      email: null,
      brief: { text: "nope" },
    });
    assert.equal(result.ok, false);
  });

  it("rejects an invalid email", () => {
    const result = parseContactFields({ ...valid, email: "not-an-email" });
    assert.equal(result.ok, false);
  });

  it("rejects header-injection attempts in email", () => {
    const result = parseContactFields({
      ...valid,
      email: "alex@northwind.example\r\nBcc:attacker@example.com",
    });
    assert.equal(result.ok, false);
  });

  it("rejects control characters in the name", () => {
    const result = parseContactFields({
      ...valid,
      name: "Alex\nFounder",
    });
    assert.equal(result.ok, false);
  });

  it("rejects oversized fields instead of truncating", () => {
    const result = parseContactFields({
      ...valid,
      name: "A".repeat(CONTACT_LIMITS.name.max + 1),
    });
    assert.equal(result.ok, false);
  });

  it("says a field is too long rather than asking for it again", () => {
    const result = parseContactFields({
      ...valid,
      name: "A".repeat(CONTACT_LIMITS.name.max + 1),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.errors?.name ?? "", /too long|under \d+ characters/i);
    }
  });

  it("keeps markup as text rather than executing it", () => {
    const payload = `<script>alert(1)</script> and weekly invoice matching.`;
    const result = parseContactFields({ ...valid, brief: payload });
    assert.equal(result.ok, true);
    if (result.ok && !result.spam) {
      assert.equal(result.data.brief, payload);
    }
  });

  it("treats a filled honeypot as spam without erroring", () => {
    const result = parseContactFields({
      ...valid,
      website: "https://spam.example",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.spam, true);
    }
    if (result.ok && result.spam) {
      assert.equal(result.values.email, valid.email);
    }
  });
});

describe("oneLine", () => {
  it("strips every control character, not just the first", () => {
    const result = oneLine("Acme\u0001Corp\u0001AB\u0001Ltd", 80);
    const remaining = [...result].filter((ch) => ch.charCodeAt(0) < 32);
    assert.deepEqual(remaining, []);
    assert.equal(result, "Acme Corp AB Ltd");
  });

  it("collapses newlines so a subject line stays one line", () => {
    assert.equal(oneLine("Acme\r\nBcc: attacker@example.com", 80), "Acme Bcc: attacker@example.com");
  });

  it("truncates to the maximum length", () => {
    assert.equal(oneLine("A".repeat(200), 10).length, 10);
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
