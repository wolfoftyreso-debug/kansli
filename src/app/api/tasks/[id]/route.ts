import type { NextRequest } from "next/server";
import { deleteTask, toggleTask } from "@/lib/store";

export async function PATCH(
  _request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  const task = await toggleTask(id);

  if (!task) {
    return Response.json({ error: "Uppgiften hittades inte." }, { status: 404 });
  }

  return Response.json({ task });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  const ok = await deleteTask(id);

  if (!ok) {
    return Response.json({ error: "Uppgiften hittades inte." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
