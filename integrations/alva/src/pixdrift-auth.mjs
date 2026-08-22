// Pixdrift-verifiering av access-tokens för ALVA.
//
// Ersätter den delade HS256-hemligheten (`JWT_SECRET`) med asymmetrisk
// verifiering mot den centrala identitetstjänstens JWKS: ALVA behöver bara de
// publika nycklarna och kan aldrig utfärda tokens själv. Ingen extern
// beroende — bara `node:crypto` (WebCrypto), i linje med ALVA:s regel att
// plattformen är självhostad och beroendeminimal.
//
// Så här kopplas den in i `services/plattform/server.mjs` (och ai-orkestern):
//
//   import { skapaPixdriftVerifierare, harBehorighet } from "./pixdrift-auth.mjs";
//   const pixdrift = skapaPixdriftVerifierare({
//     issuer: process.env.PIXDRIFT_ISSUER,
//     jwksUri: `${process.env.PIXDRIFT_ISSUER}/jwks.json`,
//     audience: "alva-plattform",
//   });
//   // i request-hanteringen, där `verifieraJwt` tidigare användes:
//   const anspr = await pixdrift.verifiera(bearer);           // kastar vid ogiltig
//   if (!harBehorighet(anspr, "arende:write")) svara(403);

import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;

function fromBase64Url(segment) {
  return Buffer.from(segment, "base64url");
}

function decodeJson(segment) {
  return JSON.parse(fromBase64Url(segment).toString("utf8"));
}

async function importeraEcNyckel(jwk) {
  return subtle.importKey(
    "jwk",
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
}

/**
 * @param {object} opts
 * @param {string} opts.issuer     Förväntad `iss`.
 * @param {string} opts.jwksUri    URL till identitetstjänstens JWKS.
 * @param {string} opts.audience   Denna tjänsts resursnamn (t.ex. "alva-plattform").
 * @param {number} [opts.jwksCacheMs=300000]  Hur länge JWKS cachas.
 * @param {typeof fetch} [opts.fetchImpl]      Injicerbar för test.
 */
export function skapaPixdriftVerifierare(opts) {
  const cacheTid = opts.jwksCacheMs ?? 300_000;
  const doFetch = opts.fetchImpl ?? fetch;
  let cache = { keys: null, expires: 0 };

  async function hamtaNycklar() {
    if (cache.keys && Date.now() < cache.expires) return cache.keys;
    const res = await doFetch(opts.jwksUri);
    if (!res.ok) throw new Error(`kunde inte hämta JWKS: ${res.status}`);
    const body = await res.json();
    cache = { keys: body.keys ?? [], expires: Date.now() + cacheTid };
    return cache.keys;
  }

  return {
    /**
     * Verifierar en token och returnerar dess anspråk. Kastar vid ogiltig
     * signatur, fel alg, utgången token, fel utfärdare eller fel audience.
     * @param {string} token
     */
    async verifiera(token) {
      const delar = String(token || "").split(".");
      if (delar.length !== 3) throw new Error("ogiltig token: fel format");
      const [huvudB64, kroppB64, signaturB64] = delar;

      const huvud = decodeJson(huvudB64);
      if (huvud.alg !== "ES256") throw new Error(`oväntad alg: ${huvud.alg}`);

      const nycklar = await hamtaNycklar();
      const jwk = nycklar.find((k) => k.kid === huvud.kid) ?? nycklar[0];
      if (!jwk) throw new Error("ingen matchande signeringsnyckel");

      const nyckel = await importeraEcNyckel(jwk);
      const data = new TextEncoder().encode(`${huvudB64}.${kroppB64}`);
      const signatur = fromBase64Url(signaturB64);
      const giltig = await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, nyckel, signatur, data);
      if (!giltig) throw new Error("ogiltig signatur");

      const anspr = decodeJson(kroppB64);
      const nu = Math.floor(Date.now() / 1000);
      if (typeof anspr.exp !== "number" || anspr.exp < nu) throw new Error("utgången token");
      if (opts.issuer && anspr.iss !== opts.issuer) throw new Error("fel utfärdare");
      const aud = Array.isArray(anspr.aud) ? anspr.aud : [anspr.aud];
      if (opts.audience && !aud.includes(opts.audience)) throw new Error("fel audience");

      return anspr;
    },
  };
}

/**
 * Behörighetskontroll mot `verb:noun`-grammatiken. Stödjer `noun:*` och `*:*`.
 * @param {{permissions?: string[]}} anspr
 * @param {string} krav
 */
export function harBehorighet(anspr, krav) {
  const beviljade = anspr?.permissions ?? [];
  if (beviljade.includes(krav)) return true;
  const substantiv = krav.split(":")[0];
  return beviljade.includes(`${substantiv}:*`) || beviljade.includes("*:*");
}

/** Plockar ut Bearer-token ur ett Authorization-huvude, eller "" om saknas. */
export function bearerUr(authorizationHuvud) {
  const h = authorizationHuvud || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
