import { problemResponse, type Actor } from "@pixdrift/api-core";
import { readSession, type AppSession } from "@/lib/auth/session";
import { getRuntime, type PlatformRuntime } from "./runtime";

export interface ApiContext extends PlatformRuntime {
  requestId: string;
  actor: Actor | null;
}

export function actorFromSession(session: AppSession | null): Actor | null {
  if (!session) return null;
  return {
    sub: session.sub,
    email: session.email,
    name: session.name,
    orgRef: session.org?.ref ?? null,
    orgName: session.org?.name ?? null,
    tier: session.org?.tier ?? "free",
    permissions: session.org?.permissions ?? [],
  };
}

export async function handleApi(
  handler: (ctx: ApiContext) => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    const session = await readSession();
    const ctx: ApiContext = {
      requestId,
      actor: actorFromSession(session),
      ...getRuntime(),
    };
    const response = await handler(ctx);
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    return problemResponse(error, requestId);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}
