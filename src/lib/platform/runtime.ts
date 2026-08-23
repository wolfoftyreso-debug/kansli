import { createPool } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { ApiError } from "@pixdrift/api-core";
import type pg from "pg";
import { appDatabaseUrl } from "./env";
import { registerSyncHandlers } from "../sync/handlers";

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
      "Databasen är inte konfigurerad.",
      "Sätt DATABASE_URL för app-rollen.",
    );
  }
  const pool = createPool(url, { applicationName: "kansli", max: 8, statementTimeoutMs: 15_000 });
  const events = new EventLog(pool);
  registerSyncHandlers(events, pool);
  runtime = { pool, events };
  return runtime;
}
