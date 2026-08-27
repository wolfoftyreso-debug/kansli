import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { capabilityStatuses } from "@/lib/maj/engine";
import { listProjects } from "@/lib/maj/projects";
import { usageTotals } from "@/lib/maj/usage";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({
      projects: await listProjects(pool, present.orgRef),
      capabilities: capabilityStatuses(),
      usage: await usageTotals(pool, present.orgRef),
      note: "MAJ visar beslut, inte leverantörsmetrik. Evidensen ligger bakom varje beslut.",
    });
  });
}
