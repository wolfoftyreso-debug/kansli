import type { EventLog } from "@pixdrift/events";
import type { McpRuntime } from "@pixdrift/mcp-core";
import { McpError } from "@pixdrift/mcp-core";
import type pg from "pg";
import { tryRuntime } from "@/lib/platform/page";

export function attachRuntime(base: Omit<McpRuntime, "pool" | "events">): McpRuntime {
  const runtime = tryRuntime(base.actor?.orgRef);
  return {
    ...base,
    pool: runtime?.pool ?? null,
    events: runtime?.events ?? null,
  };
}

export function needStore(ctx: McpRuntime): { pool: pg.Pool; events: EventLog } {
  if (!ctx.pool || !ctx.events) {
    throw new McpError("DEPENDENCY_UNAVAILABLE", "Databasen är inte tillgänglig.", ctx.requestId);
  }
  return { pool: ctx.pool as pg.Pool, events: ctx.events as EventLog };
}
