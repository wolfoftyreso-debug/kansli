import { ApiError, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { deleteTask, toggleTask } from "@/lib/kansli/tasks";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "task:write");
    const { id } = await context.params;
    const task = await toggleTask(pool, present.orgRef, id);
    if (!task) throw new ApiError("not_found", "The task does not exist.");
    await events.publish({
      system: "kansli",
      kind: "kansli.task.updated",
      orgRef: present.orgRef,
      actorKind: "user",
      actorRef: present.sub,
      subjectRef: `kansli:task:${task.id}`,
      requestId,
      payload: { done: task.done },
    });
    return json({ task });
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "task:write");
    const { id } = await context.params;
    const ok = await deleteTask(pool, present.orgRef, id);
    if (!ok) throw new ApiError("not_found", "The task does not exist.");
    await events.publish({
      system: "kansli",
      kind: "kansli.task.updated",
      orgRef: present.orgRef,
      actorKind: "user",
      actorRef: present.sub,
      subjectRef: `kansli:task:${id}`,
      requestId,
      payload: { deleted: true },
    });
    return json({ ok: true });
  });
}
