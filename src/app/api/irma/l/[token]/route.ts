import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { openAgreementByToken } from "@/lib/irma/agreements";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const agreement = await openAgreementByToken({ pool, events, token, requestId });
    if (!agreement) throw new ApiError("not_found", "Länken är ogiltig.");
    return json({ agreement, signed: false });
  });
}
