import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleEnquiry, type Mailer } from "./enquiry.ts";
import { isCompanyFromAddress } from "./env.ts";

function fields(id: string) {
  return {
    name: "Alex Founder",
    organisation: "Northwind",
    email: `alex+${id}@northwind.example`,
    process: "Weekly invoice matching still happens in a spreadsheet.",
  };
}

const env = {
  apiKey: "test-key",
  from: "Landvex <contact@landvex.com>",
  to: "contact@landvex.com",
  production: true,
};

function recordingMailer() {
  const sent: unknown[] = [];
  const mailer: Mailer = {
    async send(message) {
      sent.push(message);
      return { accepted: true };
    },
  };
  return { mailer, sent };
}

describe("handleEnquiry", () => {
  it("sends through the mailer on a valid submission", async () => {
    const { mailer, sent } = recordingMailer();
    const result = await handleEnquiry(fields("ok"), {
      mailer,
      env,
      clientKey: `ok-${Date.now()}`,
    });

    assert.equal(result.status, "success");
    assert.equal(sent.length, 1);
  });

  it("does not claim success when the mailer rejects", async () => {
    const mailer: Mailer = {
      async send() {
        return { accepted: false, error: "resend_error" };
      },
    };

    const result = await handleEnquiry(fields("fail"), {
      mailer,
      env,
      clientKey: `fail-${Date.now()}`,
    });

    assert.equal(result.status, "error");
    assert.match(result.message ?? "", /contact@landvex.com/);
  });

  it("does not claim success when the mailer throws", async () => {
    const mailer: Mailer = {
      async send() {
        throw new TypeError("network");
      },
    };

    const result = await handleEnquiry(fields("throw"), {
      mailer,
      env,
      clientKey: `throw-${Date.now()}`,
    });

    assert.equal(result.status, "error");
    assert.match(result.message ?? "", /contact@landvex.com/);
  });

  it("escapes HTML in the outbound mail body", async () => {
    let html = "";
    let text = "";
    const mailer: Mailer = {
      async send(message) {
        html = message.html;
        text = message.text;
        return { accepted: true };
      },
    };

    await handleEnquiry(
      {
        ...fields("html"),
        process: `<img src=x onerror="alert(1)"> invoice matching work.`,
      },
      { mailer, env, clientKey: `html-${Date.now()}` },
    );

    assert.equal(html.includes("<img"), false);
    assert.equal(html.includes("&lt;img"), true);
    assert.equal(text.includes("<img src=x"), true);
  });

  it("refuses a production From address outside landvex.com", async () => {
    const mailer: Mailer = {
      async send() {
        throw new Error("should not send");
      },
    };

    const result = await handleEnquiry(fields("from"), {
      mailer,
      env: { ...env, from: "Landvex <onboarding@resend.dev>" },
      clientKey: `from-${Date.now()}`,
    });

    assert.equal(result.status, "error");
  });

  it("throttles repeated submissions from the same address", async () => {
    const { mailer } = recordingMailer();
    const payload = fields(`throttle-${Date.now()}`);

    for (let i = 0; i < 3; i += 1) {
      const result = await handleEnquiry(payload, {
        mailer,
        env,
        clientKey: `throttle-${Date.now()}-${i}`,
        now: 10_000 + i,
      });
      assert.equal(result.status, "success");
    }

    const blocked = await handleEnquiry(payload, {
      mailer,
      env,
      clientKey: `throttle-${Date.now()}-x`,
      now: 10_100,
    });
    assert.equal(blocked.status, "error");
    assert.match(blocked.message ?? "", /wait/i);
  });
});

describe("isCompanyFromAddress", () => {
  it("accepts a landvex.com mailbox and rejects lookalikes", () => {
    assert.equal(isCompanyFromAddress("Landvex <contact@landvex.com>"), true);
    assert.equal(isCompanyFromAddress("contact@landvex.com"), true);
    assert.equal(isCompanyFromAddress("  contact@landvex.com  "), true);
    assert.equal(isCompanyFromAddress("Landvex <onboarding@resend.dev>"), false);
    assert.equal(isCompanyFromAddress("contact@landvex.com.evil.example"), false);
    assert.equal(isCompanyFromAddress("notlandvex.com@example.com"), false);
  });
});
