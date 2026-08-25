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
    ekonomiIssued: 0,
    ekonomiPaid: 0,
    smsVendor: false,
    smsEnabled: false,
  };

  it("allows a pilot offer when the database is up, even if RITA and ALVA are missing", () => {
    const board = evaluateFirstCustomerGates(base);
    expect(board.pilotOfferable).toBe(true);
    expect(board.allSystemsReady).toBe(false);
    expect(board.gates.find((g) => g.id === "alva")?.state).toBe("blocked");
    expect(board.gates.find((g) => g.id === "rita")?.state).toBe("blocked");
    expect(board.gates.find((g) => g.id === "upphandling")?.state).toBe("ready");
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

  it("treats an issued invoice as an Ekonomi book, not as Visma", () => {
    const empty = evaluateFirstCustomerGates(base);
    expect(empty.gates.find((g) => g.id === "ekonomi")?.state).toBe("open");
    expect(empty.gates.find((g) => g.id === "ekonomi")?.detail).toMatch(/Visma/);
    const booked = evaluateFirstCustomerGates({ ...base, ekonomiIssued: 5, ekonomiPaid: 1 });
    expect(booked.gates.find((g) => g.id === "ekonomi")?.state).toBe("ready");
    expect(booked.gates.find((g) => g.id === "ekonomi")?.detail).toMatch(/5 utfärdade/);
    expect(booked.gates.find((g) => g.id === "honesty")?.detail).toMatch(/Visma/);
  });

  it("does not call SMS ready unless the vendor is on and the owner said yes", () => {
    const vendorOnly = evaluateFirstCustomerGates({ ...base, smsVendor: true, smsEnabled: false });
    expect(vendorOnly.gates.find((g) => g.id === "sms")?.state).toBe("open");
    const opted = evaluateFirstCustomerGates({ ...base, smsVendor: true, smsEnabled: true });
    expect(opted.gates.find((g) => g.id === "sms")?.state).toBe("ready");
  });
});
