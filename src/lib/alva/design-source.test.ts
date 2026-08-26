import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "docs/design/alva");

describe("alva design source", () => {
  it("keeps the schema in the repo without importing the diagnosis engine", () => {
    expect(existsSync(join(root, "README.md"))).toBe(true);
    expect(existsSync(join(root, "DESIGN.md"))).toBe(true);
    expect(existsSync(join(root, "ALVA-DESIGNSCHEMA.md"))).toBe(true);
    expect(existsSync(join(root, "alva-designschema.html"))).toBe(true);
    const gate = readFileSync(join(root, "README.md"), "utf8");
    expect(gate).toMatch(/Diagnosmotorn/);
    expect(gate).toMatch(/ställer ingen diagnos/);
    expect(gate).not.toMatch(/NORA|MOVA|SAGA/);
  });
});
