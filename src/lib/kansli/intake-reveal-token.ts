import { SignJWT, jwtVerify } from "jose";
import { authConfig } from "@/lib/auth/config";

export type IntakeReveal = {
  intakeId: string;
  passwordOnce: string | null;
};

const secretKey = new TextEncoder().encode(authConfig.sessionSecret);

export async function sealIntakeReveal(reveal: IntakeReveal): Promise<string> {
  return new SignJWT({
    intakeId: reveal.intakeId,
    passwordOnce: reveal.passwordOnce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secretKey);
}

export async function openIntakeReveal(token: string): Promise<IntakeReveal | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const intakeId = String(payload.intakeId ?? "").trim();
    if (!intakeId) return null;
    const password = payload.passwordOnce;
    return {
      intakeId,
      passwordOnce: typeof password === "string" && password.trim() ? password : null,
    };
  } catch {
    return null;
  }
}
