import { NextResponse } from "next/server";
import { tryRuntime } from "@/lib/platform/page";
import { processDueOutbox } from "@/lib/tyra/reminders";

function unauthorized() {
  return new NextResponse("Unauthorized", { status: 401 });
}

function secretFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const header =
    request.headers.get("x-cron-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;
  return url.searchParams.get("secret") || header;
}

export async function GET(request: Request) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return unauthorized();
  const provided = secretFromRequest(request);
  if (!provided || provided !== configured) return unauthorized();

  const runtime = tryRuntime();
  if (!runtime)
    return NextResponse.json({ ok: false, error: "database_not_ready" }, { status: 503 });

  const result = await processDueOutbox({
    pool: runtime.pool,
    events: runtime.events,
    requestId: crypto.randomUUID(),
  });
  return NextResponse.json({ ok: true, ...result, delivered: false });
}
