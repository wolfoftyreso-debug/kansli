import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { requireMajHouse } from "@/lib/maj/access";
import { capabilityStatuses, runAnalysis } from "@/lib/maj/engine";
import { createProject, listProjects, parseGoal } from "@/lib/maj/projects";
import { usageTotals } from "@/lib/maj/usage";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    requireMajHouse(present.orgRef);
    return json({
      projects: await listProjects(pool, present.orgRef),
      capabilities: capabilityStatuses(),
      usage: await usageTotals(pool, present.orgRef),
      note: "MAJ shows decisions, not vendor metrics. Evidence sits behind every decision.",
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    requireMajHouse(present.orgRef);
    const body = (await request.json().catch(() => null)) as {
      domain?: string;
      market?: string;
      language?: string;
      goal?: string;
    } | null;
    const goal = parseGoal(body?.goal ?? "all");
    if (!body?.domain?.trim() || !goal) {
      throw new ApiError("invalid_request", "domain and a valid goal are required.");
    }
    const project = await createProject({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      domain: body.domain,
      market: body.market,
      language: body.language,
      goal,
      requestId,
    });
    const run = await runAnalysis({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      project,
      requestId: `${requestId}-run`,
    });
    return json({ project, analysis: run }, 201);
  });
}
