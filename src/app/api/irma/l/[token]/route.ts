import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { acknowledgeAgreement, openAgreementByToken } from "@/lib/irma/agreements";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const agreement = await openAgreementByToken({ pool, events, token, requestId });
    if (!agreement) throw new ApiError("not_found", "Länken är ogiltig.");
    return json({ agreement, signed: agreement.status === "signed" });
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const body = (await request.json().catch(() => null)) as { signerName?: string } | null;
    const signerName = body?.signerName?.trim() ?? "";
    if (!signerName) throw new ApiError("invalid_request", "signerName krävs.");
    const agreement = await acknowledgeAgreement({
      pool,
      events,
      token,
      signerName,
      requestId,
      declaration: ACKNOWLEDGEMENT_DECLARATION,
    });
    if (!agreement) throw new ApiError("not_found", "Länken är ogiltig.");
    return json({ agreement, signed: agreement.status === "signed" });
  });
}
