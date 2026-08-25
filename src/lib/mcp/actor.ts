import { createAccessTokenVerifier } from "@pixdrift/auth-client";
import type { Actor } from "@pixdrift/api-core";
import { authConfig } from "@/lib/auth/config";
import { actorFromSession } from "@/lib/platform/http";
import { readSession } from "@/lib/auth/session";

export type ActorSource = "bearer" | "session" | "none";

let verifier: ReturnType<typeof createAccessTokenVerifier> | null = null;

function accessVerifier() {
  if (!verifier) {
    verifier = createAccessTokenVerifier({
      issuer: authConfig.issuer,
      jwksUri: `${authConfig.issuer.replace(/\/$/, "")}/jwks.json`,
      audience: authConfig.clientId,
    });
  }
  return verifier;
}

export async function resolveMcpActor(
  authorization: string | null,
): Promise<{ actor: Actor | null; source: ActorSource; clientId: string | null }> {
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) return { actor: null, source: "none", clientId: null };
    const verified = await accessVerifier().verify(token);
    const orgRef = verified.claims.org ?? verified.claims.tenant ?? null;
    return {
      actor: {
        sub: verified.claims.sub,
        email: "",
        name: verified.claims.sub,
        orgRef,
        orgName: null,
        tier: verified.claims.tier,
        permissions: verified.claims.permissions,
      },
      source: "bearer",
      clientId: Array.isArray(verified.claims.aud)
        ? (verified.claims.aud[0] ?? null)
        : verified.claims.aud,
    };
  }

  const session = await readSession();
  const actor = actorFromSession(session);
  return {
    actor,
    source: actor ? "session" : "none",
    clientId: actor ? "kansli-session" : null,
  };
}
