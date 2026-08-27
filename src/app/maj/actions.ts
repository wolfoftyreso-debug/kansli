"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runAnalysis } from "@/lib/maj/engine";
import { createProject, getProject, parseGoal, parsePosture, setPosture } from "@/lib/maj/projects";
import { completeAction, decideAction } from "@/lib/maj/releases";
import { requireOrgAction } from "@/lib/platform/actions";

export async function createMajProject(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/maj", "arende:write");
  const domain = String(formData.get("domain") ?? "").trim();
  const goal = parseGoal(formData.get("goal"));
  if (!domain || !goal) return;
  let project;
  try {
    project = await createProject({
      pool,
      events,
      orgRef: session.org.ref,
      actorRef: session.sub,
      domain,
      market: String(formData.get("market") ?? "SE"),
      language: String(formData.get("language") ?? "sv"),
      goal,
      requestId: crypto.randomUUID(),
    });
    // The system starts working immediately; the user configures nothing more.
    await runAnalysis({
      pool,
      events,
      orgRef: session.org.ref,
      actorRef: session.sub,
      project,
      requestId: crypto.randomUUID(),
    });
  } catch {
    return;
  }
  revalidatePath("/maj");
  redirect(`/maj/${project.id}`);
}

export async function runMajAnalysis(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/maj", "arende:write");
  const id = String(formData.get("id") ?? "").trim();
  const project = id ? await getProject(pool, session.org.ref, id) : null;
  if (!project) return;
  await runAnalysis({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    project,
    requestId: crypto.randomUUID(),
  });
  revalidatePath(`/maj/${id}`);
  revalidatePath("/platform/events");
}

export async function decideMajAction(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/maj", "arende:write");
  const actionId = String(formData.get("actionId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (!actionId || (decision !== "approved" && decision !== "declined")) return;
  try {
    await decideAction({
      pool,
      events,
      orgRef: session.org.ref,
      actorRef: session.sub,
      actionId,
      decision,
      requestId: crypto.randomUUID(),
    });
  } catch {
    return;
  }
  revalidatePath(`/maj/${projectId}`);
}

export async function completeMajAction(formData: FormData) {
  const { session, pool, events } = await requireOrgAction("/maj", "arende:write");
  const actionId = String(formData.get("actionId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!actionId) return;
  try {
    await completeAction({
      pool,
      events,
      orgRef: session.org.ref,
      actorRef: session.sub,
      actionId,
      note: String(formData.get("note") ?? ""),
      requestId: crypto.randomUUID(),
    });
  } catch {
    return;
  }
  revalidatePath(`/maj/${projectId}`);
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}

export async function setMajPosture(formData: FormData) {
  const { session, pool } = await requireOrgAction("/maj", "arende:write");
  const projectId = String(formData.get("projectId") ?? "").trim();
  const posture = parsePosture(formData.get("posture"));
  if (!projectId || !posture) return;
  await setPosture(pool, session.org.ref, projectId, posture);
  revalidatePath(`/maj/${projectId}`);
}
