import { createPool } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { ApiError } from "@pixdrift/api-core";
import type pg from "pg";
import { appDatabaseUrl } from "./env";
import { registerSyncHandlers } from "../sync/handlers";
import { bindOrgPool } from "./tenancy";

export interface PlatformRuntime {
  pool: pg.Pool;
  events: EventLog;
}

let runtime: PlatformRuntime | null = null;

export function getRuntime(): PlatformRuntime {
  if (runtime) return runtime;
  const url = appDatabaseUrl();
  if (!url) {
    throw new ApiError(
      "not_ready",
      "The database is not configured.",
      "Set DATABASE_URL for the app role.",
    );
  }
  const pool = createPool(url, { applicationName: "kansli", max: 8, statementTimeoutMs: 15_000 });
  const events = new EventLog(pool);
  registerSyncHandlers(events, pool);
  runtime = { pool, events };
  return runtime;
}

/** Request-scoped runtime: product queries pin `app.org_ref` for RLS. */
export function runtimeForOrg(orgRef: string): PlatformRuntime {
  const base = getRuntime();
  return { pool: bindOrgPool(base.pool, orgRef), events: base.events };
}
