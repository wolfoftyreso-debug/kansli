import { describe, expect, it } from "vitest";
import { intakeOrgNumberPath } from "./complete-intake.ts";

describe("complete intake org number", () => {
  it("sends a broken number back to the form", () => {
    const form = new FormData();
    form.set("orgNumber", "556000-0000");
    expect(intakeOrgNumberPath(form)).toBe("/upphandling?fel=orgnr");
  });

  it("lets a blank or valid number through", () => {
    expect(intakeOrgNumberPath(new FormData())).toBeNull();
    const form = new FormData();
    form.set("orgNumber", "556016-0680");
    expect(intakeOrgNumberPath(form)).toBeNull();
  });
});
