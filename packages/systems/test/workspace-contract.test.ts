import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EVENT_KINDS,
  SYSTEM_IDS,
  SYSTEM_MODULES,
  getModule,
  productModules,
} from "../src/index.ts";

const ROOT = process.cwd();

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

describe("workspace contract", () => {
  it("uses one id list for catalog, events and family order", () => {
    expect([...SYSTEM_IDS]).toEqual([
      "identity",
      "kansli",
      "ekonomi",
      "tora",
      "rita",
      "britt",
      "irma",
      "tyra",
      "alva",
      "creditae",
      "maj",
    ]);
    expect(SYSTEM_MODULES.map((entry) => entry.id)).toEqual([...SYSTEM_IDS]);
  });

  it("keeps event kinds owned by exactly one system, prefixed by that id", () => {
    const claimed = SYSTEM_MODULES.flatMap((entry) => [...entry.eventKinds]);
    expect(claimed).toEqual([...EVENT_KINDS]);
    for (const entry of SYSTEM_MODULES) {
      for (const kind of entry.eventKinds) {
        expect(kind.startsWith(`${entry.id}.`)).toBe(true);
      }
    }
  });

  it("gives every product its own schema, API prefix, UI and domain folder", () => {
    for (const entry of productModules()) {
      expect(entry.schema).toBe(entry.id);
      expect(entry.basePath).toBe(`/${entry.id}`);
      expect(entry.apiBase).toBe(`/api/${entry.id}`);
      expect(entry.domainDir).toBe(`src/lib/${entry.id}`);
      expect(existsSync(path.join(ROOT, entry.domainDir))).toBe(true);
      expect(existsSync(path.join(ROOT, "src/app", entry.id, "page.tsx"))).toBe(true);
      expect(existsSync(path.join(ROOT, "src/app/api", entry.id))).toBe(true);
      expect(existsSync(path.join(ROOT, "db/migrations", entry.schema!))).toBe(true);
      const tests = walkFiles(path.join(ROOT, entry.domainDir)).filter((file) =>
        file.endsWith(".test.ts"),
      );
      expect(tests.length, `${entry.id} must have a domain test`).toBeGreaterThan(0);
    }
  });

  it("keeps identity on /idp and out of product schemas", () => {
    const identity = getModule("identity")!;
    expect(identity.schema).toBeNull();
    expect(identity.apiBase).toBe("/idp");
    expect(identity.domainDir).toBe("packages/identity");
    expect(existsSync(path.join(ROOT, "packages/identity/src/server.ts"))).toBe(true);
    expect(existsSync(path.join(ROOT, "src/app/idp"))).toBe(true);
  });

  it("does not put platform.events in a product schema", () => {
    expect(SYSTEM_MODULES.some((module) => module.schema === "platform")).toBe(false);
    for (const entry of productModules()) {
      expect(existsSync(path.join(ROOT, "db/migrations", entry.schema!))).toBe(true);
    }
    expect(existsSync(path.join(ROOT, "db/migrations/platform"))).toBe(true);
  });

  it("keeps RITA and TORA as separate modules", () => {
    expect(getModule("rita")?.purpose).not.toEqual(getModule("tora")?.purpose);
    expect(getModule("rita")?.schema).toBe("rita");
    expect(getModule("tora")?.schema).toBe("tora");
    expect(getModule("rita")?.eventKinds).not.toEqual(getModule("tora")?.eventKinds);
  });
});
