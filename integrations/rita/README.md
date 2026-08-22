# RITA ← Pixdrift-inkoppling

RITA behåller sin egen serverssession och radsäkerhet (RLS). Den här
Fastify-pluginen byter bara ut *vem som styrker identiteten*: den kör
Authorization Code + PKCE mot Pixdrift och lämnar en verifierad identitet till
`onLogin`, där RITA skapar sin session och löser tenant.

## Vad som landar i RITA-repot

- `src/pixdrift-oidc.ts` → `packages/auth/src/pixdrift-oidc.ts` (eller
  `apps/api/src/routes/pixdrift.ts`).
- Beroenden finns redan i RITA: `fastify`, `@fastify/cookie`. Lägg till
  `@pixdrift/auth-client` och `@pixdrift/contracts`.

## Inkoppling i `apps/api`

```ts
import cookie from "@fastify/cookie";
import { registerPixdriftOidc } from "@pixdrift/auth-client/rita"; // eller lokal sökväg

await app.register(cookie, { secret: process.env.SESSION_SECRET });
await registerPixdriftOidc(app, {
  issuer: process.env.PIXDRIFT_ISSUER!,
  clientId: process.env.PIXDRIFT_CLIENT_ID!,      // "rita-web"
  clientSecret: process.env.PIXDRIFT_CLIENT_SECRET!,
  redirectUri: `${process.env.WEB_ORIGIN}/auth/pixdrift/callback`,
  cookieSecure: process.env.APP_ENV !== "local",
  async onLogin(identity, reply) {
    // RITA:s egen session + tenant. identity.tenantId = organisationens id.
    const session = await createSession({ userRef: identity.sub, email: identity.email });
    reply.setCookie("rita_session", session.token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    // Efterföljande requests: withTenant(identity.tenantId) aktiverar RLS.
    return "/";
  },
});
```

## Regler som respekteras

- **Tenanten kommer från sessionen** — `identity.tenantId` sätts serverside ur
  token-claims, aldrig ur en request-header.
- **`packages/contracts` är plattformens** — identiteten är formad efter
  `@pixdrift/contracts` (User/Organization/Role/Permission), inte RITA:s domän.

Verifieras av `test/plugin.test.ts`: hela OIDC-flödet körs mot en riktig
identitetstjänst in-process, `onLogin` får rätt identitet mappad till
`tenantId=org-exempelbolaget` med behörigheten `scan:read`, session-cookie sätts
och callback utan state-cookie avvisas (400).
