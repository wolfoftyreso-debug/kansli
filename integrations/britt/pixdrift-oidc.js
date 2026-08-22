// Pixdrift OIDC for BRITT (Express + node:sqlite).
//
// Zero external dependencies — only node:crypto/WebCrypto and fetch — to honour
// BRITT's "inga native-beroenden". Identity is proven by Pixdrift; BRITT keeps
// its own `oi_session`. The module is framework-light: `beginLogin` and
// `completeLogin` do the OIDC work; BRITT's Express routes are thin wrappers.
//
// Wiring in BRITT (src/index.ts + src/core/auth.ts):
//
//   const { createPixdriftOidc } = require('./pixdrift-oidc');
//   const pixdrift = createPixdriftOidc({
//     issuer: process.env.PIXDRIFT_ISSUER,
//     clientId: process.env.PIXDRIFT_CLIENT_ID,      // "britt-web"
//     clientSecret: process.env.PIXDRIFT_CLIENT_SECRET,
//     redirectUri: `${process.env.OI_BASE_URL}/auth/pixdrift/callback`,
//   });
//
//   app.get('/auth/pixdrift/login', async (req, res) => {
//     const { authorizationUrl, state, nonce, codeVerifier } = await pixdrift.beginLogin();
//     res.setHeader('Set-Cookie', signedTempCookie({ state, nonce, codeVerifier })); // httpOnly, 10 min
//     res.redirect(authorizationUrl);
//   });
//   app.get('/auth/pixdrift/callback', async (req, res) => {
//     const expected = readSignedTempCookie(req);              // { state, nonce, codeVerifier }
//     const identity = await pixdrift.completeLogin(req.query, expected);
//     const user = findUserByEmail(identity.email);            // no auto-provisioning
//     if (!user) return res.redirect('/?error=okand_anvandare');
//     const sid = createSession(user.id);                      // BRITT's own session
//     res.setHeader('Set-Cookie', sessionCookie(sid));         // oi_session
//     res.redirect('/');
//   });

"use strict";

const { webcrypto, createHash, randomBytes } = require("node:crypto");
const { subtle } = webcrypto;

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}
function fromB64url(segment) {
  return Buffer.from(segment, "base64url");
}
function decodeJson(segment) {
  return JSON.parse(fromB64url(segment).toString("utf8"));
}
function importEcKey(jwk) {
  return subtle.importKey(
    "jwk",
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
}

function createPixdriftOidc(config) {
  const doFetch = config.fetchImpl || fetch;
  const scope = config.scope || "openid profile email";
  let discovery = null;
  let cachedKeys = null;
  let keysExpire = 0;

  async function discover() {
    if (discovery) return discovery;
    const res = await doFetch(
      `${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
    );
    if (!res.ok) throw new Error("pixdrift discovery " + res.status);
    discovery = await res.json();
    return discovery;
  }

  async function jwks(uri) {
    if (cachedKeys && Date.now() < keysExpire) return cachedKeys;
    const res = await doFetch(uri);
    if (!res.ok) throw new Error("pixdrift jwks " + res.status);
    cachedKeys = (await res.json()).keys || [];
    keysExpire = Date.now() + 300000;
    return cachedKeys;
  }

  async function verifyIdToken(idToken, nonce) {
    const parts = String(idToken || "").split(".");
    if (parts.length !== 3) throw new Error("ogiltig id_token");
    const [head, body, signature] = parts;
    const header = decodeJson(head);
    if (header.alg !== "ES256") throw new Error("oväntad alg: " + header.alg);
    const doc = await discover();
    const keys = await jwks(doc.jwks_uri);
    const jwk = keys.find((k) => k.kid === header.kid) || keys[0];
    if (!jwk) throw new Error("ingen matchande nyckel");
    const key = await importEcKey(jwk);
    const ok = await subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      fromB64url(signature),
      new TextEncoder().encode(`${head}.${body}`),
    );
    if (!ok) throw new Error("ogiltig signatur");
    const claims = decodeJson(body);
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp < now) throw new Error("utgången id_token");
    if (claims.iss !== doc.issuer) throw new Error("fel utfärdare");
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(config.clientId)) throw new Error("fel audience");
    if (nonce && claims.nonce !== nonce) throw new Error("nonce matchar inte");
    return claims;
  }

  return {
    async beginLogin() {
      const doc = await discover();
      const state = b64url(randomBytes(16));
      const nonce = b64url(randomBytes(16));
      const codeVerifier = b64url(randomBytes(32));
      const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
      const url = new URL(doc.authorization_endpoint);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      return { authorizationUrl: url.toString(), state, nonce, codeVerifier };
    },

    async completeLogin(params, expected) {
      if (!params || !params.code || !expected || params.state !== expected.state) {
        throw new Error("state");
      }
      const doc = await discover();
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: params.code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        code_verifier: expected.codeVerifier,
      });
      if (config.clientSecret) body.set("client_secret", config.clientSecret);
      const res = await doFetch(doc.token_endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) throw new Error("pixdrift token-utbyte " + res.status);
      const json = await res.json();
      const claims = await verifyIdToken(json.id_token, expected.nonce);
      return {
        sub: claims.sub,
        email: claims.email,
        name: claims.name || claims.email,
        org: claims.org || null,
        tier: (claims.org && claims.org.tier) || "free",
        memberships: claims.memberships || [],
        accessToken: json.access_token,
      };
    },
  };
}

module.exports = { createPixdriftOidc };
