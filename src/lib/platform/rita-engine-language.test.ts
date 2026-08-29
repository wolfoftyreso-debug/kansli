import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ContractVersionMismatch,
  FakeAnalysisEngine,
  HttpAnalysisEngine,
  parseEnvelope,
} from "@pixdrift/rita-engine";

describe("RITA engine leftover-throw language", () => {
  it("uses English-canonical leftover host throws like blockedReason", () => {
    const engine = readFileSync("packages/rita-engine/src/engine.ts", "utf8");
    const contract = readFileSync("packages/rita-engine/src/contract.ts", "utf8");
    expect(engine).toContain("The analysis cannot start:");
    expect(engine).toContain("unexpected --version output:");
    expect(engine).toContain("The analysis returned something unreadable");
    expect(engine).toContain("The analysis exceeded the");
    expect(engine).toContain("The analysis was cancelled");
    expect(engine).toContain("The analysis could not be started:");
    expect(engine).toContain("The analysis failed (code");
    expect(engine).toContain("The engine response does not match the contract:");
    expect(engine).toContain("FakeAnalysisEngine needs at least one envelope");
    expect(engine).toContain("ENGINE_URL is missing");
    expect(engine).toContain("ENGINE_TOKEN is missing");
    expect(engine).toContain("The analysis did not return a version");
    expect(engine).toContain("The analysis responded");
    expect(engine).toContain("The analysis could not be reached:");
    expect(contract).toContain("The engine speaks contract version");
    expect(engine).not.toContain("ENGINE_URL saknas");
    expect(engine).not.toContain("ENGINE_TOKEN saknas");
    expect(engine).not.toContain("behöver minst ett kuvert");
    expect(engine).not.toContain("motorns svar matchar inte");
    expect(contract).not.toContain("motorn talar kontraktversion");
  });

  it("throws the English-canonical sentences before a live analysis", async () => {
    expect(() => new HttpAnalysisEngine({ baseUrl: "", token: "t" })).toThrow(
      /ENGINE_URL is missing/,
    );
    expect(() => new HttpAnalysisEngine({ baseUrl: "http://engine.test", token: "" })).toThrow(
      /ENGINE_TOKEN is missing/,
    );
    expect(() => new FakeAnalysisEngine([])).toThrow(
      /FakeAnalysisEngine needs at least one envelope/,
    );
    expect(() => parseEnvelope({ contract_version: "9" })).toThrow(ContractVersionMismatch);
    expect(() => parseEnvelope({ contract_version: "9" })).toThrow(
      /The engine speaks contract version 9, this code reads 1/,
    );
    expect(() => parseEnvelope({ contract_version: "1" })).toThrow(
      /The engine response does not match the contract:/,
    );

    const unreachable = new HttpAnalysisEngine({
      baseUrl: "http://engine.test",
      token: "t",
      fetch: async () => {
        throw new Error("ECONNREFUSED");
      },
    });
    await expect(unreachable.version()).rejects.toThrow(
      /The analysis could not be reached: ECONNREFUSED/,
    );

    const unreadable = new HttpAnalysisEngine({
      baseUrl: "http://engine.test",
      token: "t",
      fetch: async () => new Response("not-json", { status: 200 }),
    });
    await expect(unreadable.version()).rejects.toThrow(
      /The analysis returned something unreadable/,
    );

    const failed = new HttpAnalysisEngine({
      baseUrl: "http://engine.test",
      token: "t",
      fetch: async () => new Response("nej", { status: 503 }),
    });
    await expect(failed.version()).rejects.toThrow(/The analysis responded 503/);
  });

  it("leaves leftover invoice-book throws and stored finding copy as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
    expect(readFileSync("packages/rita-engine/test/fixtures/envelope.json", "utf8")).toContain(
      "det saknas underlag",
    );
  });
});
