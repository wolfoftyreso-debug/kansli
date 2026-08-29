import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { GET, llmsTxtBody } from "../../app/llms.txt/route.ts";
import { MCP_DOC_LINKS } from "../mcp/catalog.ts";

describe("leftover llms.txt catalog lock", () => {
  it("keeps every catalog room and MCP doc link in llms.txt", () => {
    const body = llmsTxtBody();
    const lines = new Set(body.split("\n"));
    for (const system of SYSTEM_MODULES) {
      const hasName = [...lines].some((line) => line.startsWith(`- ${system.name}`));
      expect(hasName, system.id).toBe(true);
    }
    for (const item of MCP_DOC_LINKS) {
      expect(lines.has(`- ${item.href}`), item.href).toBe(true);
    }
    expect(body).toContain("PIXDRIFT Identity");
    expect(body).toContain("CREDITAE");
    expect(body).toContain("MAJ");
    expect(body).toContain("intake. No diagnosis.");
    expect(body).toContain("Not Visma. Not Fortnox.");
    expect(body).toContain("POST /mcp — agent interface, the same services as REST");
    expect(readFileSync("src/app/llms.txt/route.ts", "utf8")).toContain("SYSTEM_MODULES");
    expect(readFileSync("src/app/llms.txt/route.ts", "utf8")).toContain("MCP_DOC_LINKS");
  });

  it("leaves leftover invented products and intake out of llms.txt", () => {
    const body = llmsTxtBody();
    expect(body).toContain("NORA, MOVA, SAGA");
    expect(body).toContain("ChatGPT Apps");
    expect(body).not.toContain("/upphandling");
    expect(GET().headers.get("content-type")).toContain("text/plain");
  });
});
