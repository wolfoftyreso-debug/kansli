import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { getRuntime } from "@/lib/platform/runtime";
import { REVOLUT_STATUS_PATH, revolutConfigState } from "@/lib/ekonomi/revolut/config";
import { consumeOAuthState, persistTokens } from "@/lib/ekonomi/revolut/connection";
import { RevolutError } from "@/lib/ekonomi/revolut/errors";
import { logRevolut, logRevolutError } from "@/lib/ekonomi/revolut/observability";
import { exchangeAuthorizationCode } from "@/lib/ekonomi/revolut/tokens";
import { REVOLUT_STATE_COOKIE } from "../connect/route";

export const dynamic = "force-dynamic";

/**
 * The registered Revolut OAuth redirect URI.
 *
 * Authorization codes are short-lived, so the exchange happens here, on the
 * server, in the same request. No human ever sees or copies a code.
 */
function finish(reason: string | null, connected: boolean): NextResponse {
  const target = new URL(REVOLUT_STATUS_PATH, authConfig.baseUrl);
  if (connected) target.searchParams.set("connected", "1");
  else if (reason) target.searchParams.set("error", reason);
  const response = NextResponse.redirect(target);
  response.cookies.delete(REVOLUT_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const providerError = params.get("error");
  const code = params.get("code");
  const queryState = params.get("state");
  const cookieState = request.cookies.get(REVOLUT_STATE_COOKIE)?.value ?? null;
  const { pool, events } = getRuntime();
  const config = revolutConfigState();

  const publishFailure = async (reason: string, orgRef: string | null, actorRef: string | null) => {
    logRevolut("oauth.failed", {
      orgRef,
      environment: config.environment,
      providerCode: reason,
    });
    await events
      .publish({
        system: "ekonomi",
        kind: "ekonomi.revolut.oauth.failed",
        orgRef,
        actorKind: "user",
        actorRef: actorRef ?? "system",
        subjectRef: `ekonomi:connection:revolut:${config.environment}`,
        payload: {
          title: "Revolut-anslutning misslyckades",
          reason,
          environment: config.environment,
        },
      })
      .catch(() => undefined);
  };

  if (providerError) {
    await publishFailure("authorization_denied", null, null);
    return finish("authorization_denied", false);
  }

  // Revolut echoes state; the cookie is a belt-and-braces carrier. When both
  // exist they must agree, otherwise someone is replaying another user's code.
  if (queryState && cookieState && queryState !== cookieState) {
    await publishFailure("state_invalid", null, null);
    return finish("state_invalid", false);
  }
  const state = queryState ?? cookieState ?? "";

  const verdict = await consumeOAuthState(pool, state);
  if (!verdict.ok) {
    await publishFailure(verdict.reason, null, null);
    return finish(verdict.reason, false);
  }

  if (!code) {
    await publishFailure("code_rejected", verdict.state.orgRef, verdict.state.actorRef);
    return finish("code_rejected", false);
  }

  try {
    const tokens = await exchangeAuthorizationCode(code);
    await persistTokens(pool, {
      orgRef: verdict.state.orgRef,
      environment: verdict.state.environment,
      tokens,
      actorRef: verdict.state.actorRef,
      markConnected: true,
    });
  } catch (error) {
    const reason = error instanceof RevolutError ? error.category : "unknown";
    logRevolutError("oauth.failed", error, {
      orgRef: verdict.state.orgRef,
      environment: verdict.state.environment,
    });
    await publishFailure(reason, verdict.state.orgRef, verdict.state.actorRef);
    return finish(reason, false);
  }

  logRevolut("oauth.completed", {
    orgRef: verdict.state.orgRef,
    environment: verdict.state.environment,
  });
  await events
    .publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.oauth.completed",
      orgRef: verdict.state.orgRef,
      actorKind: "user",
      actorRef: verdict.state.actorRef,
      subjectRef: `ekonomi:connection:revolut:${verdict.state.environment}`,
      payload: {
        title: "Revolut ansluten",
        environment: verdict.state.environment,
      },
    })
    .catch(() => undefined);

  return finish(null, true);
}
