import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPixdriftRegistry } from "../mcp/tools.ts";

describe("leftover MCP assessment language", () => {
  it("uses English-canonical leftover assessment words like CREDITAE labels", () => {
    const source = readFileSync("src/lib/mcp/tools.ts", "utf8");
    expect(source).toContain("decide Go/Watch/Stop");
    expect(source).not.toContain("Kör/Bevaka/Stanna");

    const catalog = buildPixdriftRegistry().catalog();
    const list = catalog.tools.find((tool) => tool.name === "list_credit_inquiries");
    const register = catalog.tools.find((tool) => tool.name === "register_credit_inquiry");
    expect(list?.description).toContain("Go/Watch/Stop");
    expect(register?.description).toContain("Go/Watch/Stop");
    expect(list?.description).not.toContain("Kör/Bevaka/Stanna");
    expect(register?.description).not.toContain("Kör/Bevaka/Stanna");
  });

  it("leaves leftover AGENTS.md and ping prompt as written", () => {
    expect(readFileSync("AGENTS.md", "utf8")).toContain("Kör/Bevaka/Stanna");
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
  });
});
