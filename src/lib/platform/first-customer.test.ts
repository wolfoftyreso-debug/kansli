import { describe, expect, it } from "vitest";
import { evaluateFirstCustomerGates } from "./first-customer.ts";

describe("evaluateFirstCustomerGates", () => {
  const base = {
    databaseUp: true,
    appEnv: "dev",
    seedDemo: false,
    sessionSecretSet: true,
    cronSecretSet: true,
    toraProfileSaved: true,
    tyraCases: 1,
    tyraInspections: 1,
    tyraQuotes: 1,
    irmaAgreements: 1,
    ritaAvailable: false,
  };

  it("allows a pilot offer when the database is up, even if RITA and ALVA are missing", () => {
    const board = evaluateFirstCustomerGates(base);
    expect(board.pilotOfferable).toBe(true);
    expect(board.allSystemsReady).toBe(false);
    expect(board.gates.find((g) => g.id === "alva")?.state).toBe("blocked");
    expect(board.gates.find((g) => g.id === "rita")?.state).toBe("blocked");
  });

  it("blocks the pilot when Postgres is down", () => {
    const board = evaluateFirstCustomerGates({ ...base, databaseUp: false });
    expect(board.pilotOfferable).toBe(false);
    expect(board.gates.find((g) => g.id === "database")?.state).toBe("blocked");
  });

  it("blocks production when the session secret is missing", () => {
    const board = evaluateFirstCustomerGates({
      ...base,
      appEnv: "production",
      sessionSecretSet: false,
    });
    expect(board.pilotOfferable).toBe(false);
    expect(board.gates.find((g) => g.id === "secrets")?.state).toBe("blocked");
  });

  it("flags seed demo as open, not ready", () => {
    const board = evaluateFirstCustomerGates({ ...base, seedDemo: true });
    expect(board.gates.find((g) => g.id === "demo")?.state).toBe("open");
    expect(board.pilotOfferable).toBe(true);
  });
});
