import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const toggleTask = vi.fn();
const deleteTask = vi.fn();

vi.mock("@/lib/kansli/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/kansli/tasks")>();
  return {
    ...actual,
    toggleTask: (...args: unknown[]) => toggleTask(...args),
    deleteTask: (...args: unknown[]) => deleteTask(...args),
  };
});

import { buildPixdriftRegistry } from "./tools";

const actor: Actor = {
  sub: "user:demo",
  email: "demo@exempelbolaget.se",
  name: "Demo",
  orgRef: "pixdrift:org:demo",
  orgName: "Exempelbolaget",
  tier: "enterprise",
  permissions: ["task:write"],
};

function runtime() {
  return {
    requestId: "task-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP office task writes", () => {
  beforeEach(() => {
    toggleTask.mockReset();
    deleteTask.mockReset();
  });

  it("toggles a task and publishes kansli.task.updated", async () => {
    toggleTask.mockResolvedValue({
      id: "t-1",
      title: "Ring holm",
      owner: "Demo",
      done: true,
      createdAt: "2026-08-28T00:00:00.000Z",
    });
    const tool = buildPixdriftRegistry().getTool("toggle_office_task");
    expect(tool?.flags.destructive).toBe(false);
    const ctx = runtime();
    const result = await tool!.handler(ctx, { id: "t-1" });
    expect(toggleTask).toHaveBeenCalledWith({}, actor.orgRef, "t-1");
    expect(result).toEqual({
      id: "t-1",
      title: "Ring holm",
      owner: "Demo",
      done: true,
    });
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "kansli.task.updated",
        subjectRef: "kansli:task:t-1",
        payload: { done: true, via: "mcp" },
      }),
    );
  });

  it("returns not_found when the task is missing", async () => {
    toggleTask.mockResolvedValue(null);
    deleteTask.mockResolvedValue(false);
    const toggle = buildPixdriftRegistry().getTool("toggle_office_task");
    const remove = buildPixdriftRegistry().getTool("delete_office_task");
    expect(await toggle!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(await remove!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
  });

  it("deletes a task as a destructive write", async () => {
    deleteTask.mockResolvedValue(true);
    const tool = buildPixdriftRegistry().getTool("delete_office_task");
    expect(tool?.flags.destructive).toBe(true);
    const ctx = runtime();
    const result = await tool!.handler(ctx, { id: "t-2" });
    expect(deleteTask).toHaveBeenCalledWith({}, actor.orgRef, "t-2");
    expect(result).toEqual({ ok: true, id: "t-2" });
    expect(ctx.events.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "kansli.task.updated",
        payload: { deleted: true, via: "mcp" },
      }),
    );
  });
});
