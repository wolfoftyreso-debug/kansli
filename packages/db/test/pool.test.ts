import { describe, expect, it } from "vitest";
import { poolConfig } from "../src/pool.ts";

describe("poolConfig", () => {
  it("leaves localhost on a plain connection", () => {
    const config = poolConfig("postgres://pixdrift_app:x@localhost:5432/pixdrift");
    expect(config.ssl).toBeUndefined();
    expect(config.connectionString).toContain("localhost");
  });

  it("leaves 127.0.0.1 on a plain connection", () => {
    const config = poolConfig("postgres://pixdrift_app:x@127.0.0.1:5432/pixdrift");
    expect(config.ssl).toBeUndefined();
  });

  it("enables TLS for a remote host", () => {
    const config = poolConfig("postgres://pixdrift_app:x@ep-example.neon.tech/neondb");
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("enables TLS on localhost when sslmode=require", () => {
    const config = poolConfig("postgres://pixdrift_app:x@localhost:5432/pixdrift?sslmode=require");
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("forwards pool options", () => {
    const config = poolConfig("postgres://pixdrift_app:x@localhost:5432/pixdrift", {
      max: 4,
      statementTimeoutMs: 8_000,
      applicationName: "tora@test",
    });
    expect(config.max).toBe(4);
    expect(config.statement_timeout).toBe(8_000);
    expect(config.query_timeout).toBe(8_000);
    expect(config.application_name).toBe("tora@test");
  });
});
