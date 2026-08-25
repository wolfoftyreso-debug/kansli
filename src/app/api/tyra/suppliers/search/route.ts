import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { searchSupplierProducts } from "@/lib/tyra/suppliers/gateway";

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const body = (await request.json().catch(() => null)) as {
      width?: number;
      aspectRatio?: number;
      rimDiameter?: number;
      season?: string;
    } | null;
    if (!body?.width || !body.aspectRatio || !body.rimDiameter) {
      throw new ApiError("invalid_request", "width, aspectRatio och rimDiameter krävs.");
    }
    const result = await searchSupplierProducts({
      pool,
      orgRef: present.orgRef,
      identity: {
        width: body.width,
        aspectRatio: body.aspectRatio,
        rimDiameter: body.rimDiameter,
        season: body.season,
      },
    });
    return json(result);
  });
}
