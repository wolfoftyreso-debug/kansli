import { describe, expect, it } from "vitest";
import { openIntakeReveal, sealIntakeReveal } from "./intake-reveal-token.ts";

describe("intake reveal token", () => {
  it("opens only the sealed payload", async () => {
    const token = await sealIntakeReveal({
      intakeId: "intake-1",
      passwordOnce: "Abcd-Efgh-Ijkl-Mnop",
    });
    expect(await openIntakeReveal(token)).toEqual({
      intakeId: "intake-1",
      passwordOnce: "Abcd-Efgh-Ijkl-Mnop",
    });
    expect(await openIntakeReveal("not-a-token")).toBeNull();
  });
});
