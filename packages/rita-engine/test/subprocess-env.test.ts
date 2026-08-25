import { describe, expect, it } from "vitest";
import { DEFAULT_SKATTJAKT_MODEL_ID, subprocessEngineEnv } from "../src/subprocess-env.ts";

describe("subprocessEngineEnv", () => {
  it("never forwards database or session secrets", () => {
    const env = subprocessEngineEnv({
      PATH: "/bin",
      DATABASE_URL: "postgres://pixdrift_app:secret@127.0.0.1/db",
      PIXDRIFT_DB_OWNER_URL: "postgres://owner:secret@127.0.0.1/db",
      APP_SESSION_SECRET: "session-secret",
      ANTHROPIC_API_KEY: "sk-ant-test",
    });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.PIXDRIFT_DB_OWNER_URL).toBeUndefined();
    expect(env.APP_SESSION_SECRET).toBeUndefined();
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-test");
    expect(env.SKATTJAKT_MODEL_ID).toBe(DEFAULT_SKATTJAKT_MODEL_ID);
    expect(env.SKATTJAKT_MODEL_PRICES).toContain(DEFAULT_SKATTJAKT_MODEL_ID);
    expect(env.SKATTJAKT_MODEL_FALLBACK).toBe("false");
    expect(env.SKATTJAKT_MODEL_TIMEOUT_SECS).toBe("180");
    expect(env.SKATTJAKT_MODEL_MAX_RETRIES).toBe("0");
  });

  it("keeps an operator-set model id and price list", () => {
    const env = subprocessEngineEnv({
      PATH: "/bin",
      ANTHROPIC_API_KEY: "sk-ant-test",
      SKATTJAKT_MODEL_ID: "claude-sonnet-4-6",
      SKATTJAKT_MODEL_PRICES: '{"claude-sonnet-4-6":{"input_per_mtok":1,"output_per_mtok":2}}',
    });
    expect(env.SKATTJAKT_MODEL_ID).toBe("claude-sonnet-4-6");
    expect(env.SKATTJAKT_MODEL_PRICES).toContain("claude-sonnet-4-6");
    expect(env.SKATTJAKT_MODEL_PRICES).not.toContain(DEFAULT_SKATTJAKT_MODEL_ID);
  });

  it("does not invent a model when no Anthropic key is present", () => {
    const env = subprocessEngineEnv({ PATH: "/bin" });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.SKATTJAKT_MODEL_ID).toBeUndefined();
    expect(env.SKATTJAKT_MODEL_PRICES).toBeUndefined();
  });
});
