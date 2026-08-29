import { mkdtempSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCRIPT = "scripts/revolut/generate-certificate.sh";

describe("leftover Revolut cert script language", () => {
  it("uses English-canonical leftover usage like vendor-check", () => {
    const source = readFileSync(SCRIPT, "utf8");
    expect(source).toContain("unknown argument:");
    expect(source).toContain("ERROR: $KEY already exists.");
    expect(source).toContain("Never create a new key on top of a registered one.");
    expect(source).toContain("PASTE THIS INTO REVOLUT");
    expect(source).toContain("END OF CERTIFICATE");
    expect(source).not.toContain("okänt argument:");
    expect(source).not.toContain("finns redan.");
    expect(source).not.toContain("KLISTRA IN DET HÄR");
  });

  it("prints the English-canonical sentences and does not write a new key", () => {
    const unknown = spawnSync("bash", [SCRIPT, "--nope"], { encoding: "utf8" });
    expect(unknown.status).toBe(2);
    expect(unknown.stderr).toContain("unknown argument: --nope");

    const dir = mkdtempSync(path.join(tmpdir(), "pixdrift-revolut-cert-"));
    writeFileSync(path.join(dir, "revolut-private-key.pem"), "existing\n");
    const exists = spawnSync("bash", [SCRIPT, "--out", dir], { encoding: "utf8" });
    expect(exists.status).toBe(1);
    expect(exists.stderr).toContain("already exists.");
    expect(exists.stderr).toContain("Never create a new key on top of a registered one.");
    expect(readFileSync(path.join(dir, "revolut-private-key.pem"), "utf8")).toBe("existing\n");
  });

  it("leaves leftover ping prompt as written", () => {
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
  });
});
