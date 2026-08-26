import { describe, expect, it } from "vitest";
import { WORKSPACE_SCHEMAS } from "@pixdrift/db";
import { SYSTEM_IDS } from "@pixdrift/systems";
import {
  DATABASE_CONTRACT,
  IDENTITY_TABLES,
  knownProductKeys,
  PRODUCT_SCHEMAS,
  PRODUCT_TABLES,
  schemaOwner,
} from "./structure.ts";

describe("shared storage structure", () => {
  it("keeps one Postgres and the app role", () => {
    expect(DATABASE_CONTRACT.engines).toBe(1);
    expect(DATABASE_CONTRACT.role).toBe("pixdrift_app");
    expect(DATABASE_CONTRACT.bus).toBe("platform.events");
  });

  it("covers every workspace schema and no invented products", () => {
    expect(PRODUCT_SCHEMAS).toEqual(WORKSPACE_SCHEMAS.map((entry) => entry.schema));
    expect(PRODUCT_TABLES.some((item) => item.schema === "nora")).toBe(false);
    for (const table of PRODUCT_TABLES) {
      if (table.system === "platform") continue;
      expect(SYSTEM_IDS).toContain(table.system);
    }
  });

  it("lists identity tables without a sessions table", () => {
    expect(IDENTITY_TABLES).toContain("users");
    expect(IDENTITY_TABLES).toContain("organizations");
    expect(IDENTITY_TABLES).toContain("memberships");
    expect(IDENTITY_TABLES).not.toContain("sessions");
  });

  it("keeps house intakes off org_ref and the chart of accounts shared", () => {
    const intakes = PRODUCT_TABLES.find(
      (item) => item.schema === "kansli" && item.table === "intakes",
    );
    const accounts = PRODUCT_TABLES.find(
      (item) => item.schema === "ekonomi" && item.table === "accounts",
    );
    expect(intakes?.tenancy).toBe("house_org_ref");
    expect(accounts?.tenancy).toBe("none");
    expect(knownProductKeys().has("kansli.intakes")).toBe(true);
  });

  it("maps schemas back to the owning system", () => {
    expect(schemaOwner("public")).toBe("identity");
    expect(schemaOwner("platform")).toBe("platform");
    expect(schemaOwner("tyra")).toBe("tyra");
    expect(schemaOwner("nora")).toBeNull();
  });
});
