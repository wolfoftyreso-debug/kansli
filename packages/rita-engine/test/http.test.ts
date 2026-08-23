import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EngineError, HttpAnalysisEngine } from "../src/engine.ts";

const FIXTURE = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "fixtures/envelope.json"), "utf8"),
) as unknown;

function listen(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("no address"));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        close: () =>
          new Promise((done, fail) => server.close((err) => (err ? fail(err) : done()))),
      });
    });
  });
}

const request: Parameters<HttpAnalysisEngine["analyse"]>[0] = {
  analysis_id: "11111111-1111-4111-8111-111111111111",
  company: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Exempelbolaget AB",
    org_number: "556000-0000",
    fiscal_year_start: "2025-01-01",
    fiscal_year_end: "2025-12-31",
  },
  documents: [],
  accounts_state: "final",
  audience: "company",
};

describe("HttpAnalysisEngine", () => {
  let url = "";
  let close: () => Promise<void> = async () => undefined;
  let lastAuth = "";

  beforeAll(async () => {
    const server = await listen((req, res) => {
      lastAuth = String(req.headers.authorization ?? "");
      if (req.headers.authorization !== "Bearer secret-token") {
        res.writeHead(401).end("nej");
        return;
      }
      if (req.method === "GET" && req.url === "/version") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            engineVersion: "0.1.0",
            ruleSetVersion: "se-2025.2",
            contractVersion: "1",
          }),
        );
        return;
      }
      if (req.method === "POST" && req.url === "/analyse") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(FIXTURE));
        return;
      }
      res.writeHead(404).end();
    });
    url = server.url;
    close = server.close;
  });

  afterAll(async () => {
    await close();
  });

  it("refuses to construct without a token", () => {
    expect(() => new HttpAnalysisEngine({ baseUrl: "http://127.0.0.1:9", token: "" })).toThrow(
      /ENGINE_TOKEN/,
    );
  });

  it("reads version and analyses through the real contract", async () => {
    const engine = new HttpAnalysisEngine({ baseUrl: url, token: "secret-token" });
    const version = await engine.version();
    expect(version).toEqual({
      engineVersion: "0.1.0",
      ruleSetVersion: "se-2025.2",
      contractVersion: "1",
    });

    const envelope = await engine.analyse(request);
    expect(envelope.contract_version).toBe("1");
    expect(envelope.result.opportunities.length).toBeGreaterThan(0);
    expect(lastAuth).toBe("Bearer secret-token");
  });

  it("fails closed on a missing token at the host", async () => {
    const engine = new HttpAnalysisEngine({ baseUrl: url, token: "wrong" });
    await expect(engine.analyse(request)).rejects.toBeInstanceOf(EngineError);
  });
});
