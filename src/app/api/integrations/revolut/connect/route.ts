import { NextResponse } from "next/server";
import { hasPermission } from "@pixdrift/contracts";
import { readSession } from "@/lib/auth/session";
import { authConfig } from "@/lib/auth/config";
import { getRuntime } from "@/lib/platform/runtime";
import {
  REVOLUT_STATUS_PATH,
  revolutConfigState,
  revolutConsentEndpoint,
} from "@/lib/ekonomi/revolut/config";
import {
  createOAuthState,
  ensurePendingConnection,
  OAUTH_STATE_TTL_MS,
} from "@/lib/ekonomi/revolut/connection";
import { logRevolut } from "@/lib/ekonomi/revolut/observability";

export const dynamic = "force-dynamic";

/** Fallback carrier for state, in case the provider drops the query parameter. */
export const REVOLUT_STATE_COOKIE = "pd_revolut_state";

function backToStatus(reason: string): NextResponse {
  return NextResponse.redirect(
    new URL(`${REVOLUT_STATUS_PATH}?error=${encodeURIComponent(reason)}`, authConfig.baseUrl),
  );
}

export async function GET() {
  const session = await readSession();
  if (!session?.org?.ref) {
    return NextResponse.redirect(
      new URL(
        `/api/auth/login?next=${encodeURIComponent(REVOLUT_STATUS_PATH)}`,
        authConfig.baseUrl,
      ),
    );
  }
  if (!hasPermission(session.org.permissions ?? [], "invoice:approve")) {
    return backToStatus("forbidden");
  }

  const config = revolutConfigState();
  if (!config.ready) return backToStatus("configuration");

  const { pool, events } = getRuntime();
  const orgRef = session.org.ref;

  await ensurePendingConnection(pool, orgRef, config.environment);
  const state = await createOAuthState(pool, {
    orgRef,
    environment: config.environment,
    actorRef: session.sub,
    redirectUri: config.redirect.uri,
  });

  await events
    .publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.oauth.started",
      orgRef,
      actorKind: "user",
      actorRef: session.sub,
      subjectRef: `ekonomi:connection:revolut:${config.environment}`,
      payload: { title: "Revolut-anslutning startad", environment: config.environment },
    })
    .catch(() => undefined);

  logRevolut("oauth.started", { orgRef, environment: config.environment });

  const consent = new URL(revolutConsentEndpoint());
  consent.searchParams.set("client_id", process.env.REVOLUT_CLIENT_ID!.trim());
  consent.searchParams.set("redirect_uri", config.redirect.uri);
  consent.searchParams.set("response_type", "code");
  consent.searchParams.set("state", state);

  const response = NextResponse.redirect(consent);
  response.cookies.set(REVOLUT_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: Math.floor(OAUTH_STATE_TTL_MS / 1000),
  });
  return response;
}
