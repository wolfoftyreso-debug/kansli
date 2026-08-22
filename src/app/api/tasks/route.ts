import type { NextRequest } from "next/server";
import { addTask, listTasks } from "@/lib/store";

export async function GET() {
  const tasks = await listTasks();
  return Response.json({ tasks });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json(
      { error: "Titeln får inte vara tom." },
      { status: 400 },
    );
  }

  const owner = typeof body.owner === "string" ? body.owner : undefined;
  const task = await addTask({ title: body.title, owner });
  return Response.json({ task }, { status: 201 });
}
