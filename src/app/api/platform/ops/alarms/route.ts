import { NextResponse } from "next/server";
import { isHouseSession } from "@/lib/kansli/intakes";
import { loadOpsDesk, raiseOpsAlarms } from "@/lib/platform/ops-desk";
import { loadFirstCustomerBoard } from "@/lib/platform/first-customer";
import { hubStatus } from "@/lib/platform/hub-status";
import { tryRuntime } from "@/lib/platform/page";
import { bindOrgPool } from "@/lib/platform/tenancy";

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

export const dynamic = "force-dynamic";

/**
 * Rising-edge SMS for ops alarms. Snapshot polling never calls this.
 * SENT only if the SMS channel accepted the message.
 */
export async function GET(request: Request) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return unauthorized();
  const provided = secretFromRequest(request);
  if (!provided || provided !== configured) return unauthorized();

  const runtime = tryRuntime();
  if (!runtime)
    return NextResponse.json({ ok: false, error: "database_not_ready" }, { status: 503 });

  const { rows } = await runtime.pool.query<{ org_ref: string }>(
    `select distinct org_ref from platform.sms_routes`,
  );
  const refs = [...new Set(rows.map((row) => row.org_ref).filter(Boolean))];
  const results: { orgRef: string; sent: number; skipped: number; blocked: number }[] = [];

  for (const orgRef of refs) {
    const scope = isHouseSession(orgRef) ? "house" : "org";
    const pool = scope === "house" ? runtime.pool : bindOrgPool(runtime.pool, orgRef);
    const readiness = await loadFirstCustomerBoard(pool, orgRef);
    const desk = await loadOpsDesk(pool, {
      orgRef,
      scope,
      blockedGates: readiness.gates.filter((gate) => gate.state === "blocked").length,
      databaseDown: hubStatus().database === "down",
    });
    const raised = await raiseOpsAlarms({
      pool,
      orgRef,
      facts: desk.facts,
      routes: desk.sms.routes,
      deliver: true,
    });
    results.push({ orgRef, ...raised });
  }

  return NextResponse.json({ ok: true, orgs: results.length, results });
}
