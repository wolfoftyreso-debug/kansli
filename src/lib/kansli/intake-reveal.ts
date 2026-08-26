import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";
import { openIntakeReveal, sealIntakeReveal, type IntakeReveal } from "./intake-reveal-token.ts";

export const INTAKE_REVEAL_COOKIE = "pd_intake_reveal";
export type { IntakeReveal };

export async function writeIntakeReveal(reveal: IntakeReveal): Promise<void> {
  const jar = await cookies();
  jar.set(INTAKE_REVEAL_COOKIE, await sealIntakeReveal(reveal), {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: 600,
  });
}

export async function readIntakeReveal(): Promise<IntakeReveal | null> {
  const jar = await cookies();
  const raw = jar.get(INTAKE_REVEAL_COOKIE)?.value;
  if (!raw) return null;
  return openIntakeReveal(raw);
}

/** Only call from a Server Action or Route Handler. Pages may not write cookies. */
export async function clearIntakeReveal(): Promise<void> {
  const jar = await cookies();
  jar.delete(INTAKE_REVEAL_COOKIE);
}
