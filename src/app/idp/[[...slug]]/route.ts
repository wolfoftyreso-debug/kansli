/**
 * Co-located Pixdrift identity provider.
 *
 * The IdP (`@pixdrift/identity`, Fastify + Postgres) is mounted inside this
 * Next app under `/idp` so the whole platform ships as one Vercel deployment
 * backed by Vercel Postgres. Every `/idp/*` request is delegated to the exact
 * same Fastify server exercised by the identity test-suite, via Fastify's
 * lightweight `inject()` (no socket needed — ideal for serverless functions).
 *
 * The OIDC issuer is `${origin}/idp`; discovery therefore advertises
 * `${origin}/idp/authorize`, `/idp/token`, `/idp/jwks.json`, etc. On Vercel,
 * set `DATABASE_URL` (auto-injected by the Vercel Postgres integration) so the
 * store, signing key and auth codes are shared across serverless instances.
 * Without a database it falls back to a per-instance in-memory store, which is
 * only coherent on a single process (local `pnpm dev`).
 */

import type { NextRequest } from "next/server";
import type { FastifyInstance } from "fastify";
import { bootIdentityFromEnv } from "@pixdrift/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFIX = "/idp";

// Cache the built server per issuer for the lifetime of a warm instance.
let cached: { issuer: string; app: Promise<FastifyInstance> } | null = null;

function issuerFor(req: NextRequest): string {
  if (process.env.PIXDRIFT_ISSUER) return process.env.PIXDRIFT_ISSUER;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}${PREFIX}`;
}

function serverFor(issuer: string): Promise<FastifyInstance> {
  if (!cached || cached.issuer !== issuer) {
    cached = { issuer, app: bootIdentityFromEnv({ issuer }) };
  }
  return cached.app;
}

const HOP_BY_HOP = new Set(["content-length", "transfer-encoding", "connection", "keep-alive"]);

async function handle(req: NextRequest): Promise<Response> {
  const issuer = issuerFor(req);
  const app = await serverFor(issuer);

  // Map `/idp/authorize?…` → the Fastify route `/authorize?…`.
  const stripped = req.nextUrl.pathname.slice(PREFIX.length) || "/";
  const url = `${stripped}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key)) headers[key] = value;
  });

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const payload = hasBody ? await req.text() : undefined;

  const res = await app.inject({
    method: req.method as "GET" | "POST",
    url,
    headers,
    payload,
    remoteAddress: (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim(),
  });

  const outHeaders = new Headers();
  for (const [key, value] of Object.entries(res.headers)) {
    if (value === undefined || HOP_BY_HOP.has(key)) continue;
    if (key === "set-cookie") {
      const cookies = Array.isArray(value) ? value : [value];
      for (const c of cookies) outHeaders.append("set-cookie", String(c));
    } else {
      outHeaders.set(key, String(value));
    }
  }

  // `rawPayload` is a Node Buffer; hand the web Response a plain Uint8Array.
  const body =
    req.method === "HEAD" || res.statusCode === 204 || res.statusCode === 304
      ? null
      : new Uint8Array(res.rawPayload);
  return new Response(body, { status: res.statusCode, headers: outHeaders });
}

export const GET = handle;
export const POST = handle;
