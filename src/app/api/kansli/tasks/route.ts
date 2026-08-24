import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { addTask, listTasks } from "@/lib/kansli/tasks";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ tasks: await listTasks(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "task:write");
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      owner?: string;
    } | null;
    if (!body?.title?.trim()) throw new ApiError("invalid_request", "Titeln får inte vara tom.");
    const task = await addTask(pool, {
      orgRef: present.orgRef,
      title: body.title,
      owner: (body.owner ?? "").trim() || present.name,
      createdBy: present.sub,
    });
    await events.publish({
      system: "kansli",
      kind: "kansli.task.created",
      orgRef: present.orgRef,
      actorKind: "user",
      actorRef: present.sub,
      subjectRef: `kansli:task:${task.id}`,
      requestId,
      payload: { title: task.title },
    });
    return json({ task }, 201);
  });
}
