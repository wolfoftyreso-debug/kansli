import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { acknowledgeAgreement, openAgreementByToken } from "@/lib/irma/agreements";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "@/lib/irma/throttle";

function guardToken(token: string): string {
  const key = irmaThrottleKey(token);
  if (irmaTokenBlocked(key)) {
    throw new ApiError("not_found", "Länken är ogiltig eller har gått ut.");
  }
  return key;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const key = guardToken(token);
    const agreement = await openAgreementByToken({ pool, events, token, requestId });
    if (!agreement) {
      noteIrmaTokenFailure(key);
      throw new ApiError("not_found", "Länken är ogiltig eller har gått ut.");
    }
    noteIrmaTokenSuccess(key);
    return noStore({ agreement, signed: agreement.status === "signed" });
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const key = guardToken(token);
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
    if (!agreement) {
      noteIrmaTokenFailure(key);
      throw new ApiError("not_found", "Länken är ogiltig eller har gått ut.");
    }
    if (agreement.verificationLevel === 0) {
      throw new ApiError("invalid_request", "Underlaget kräver ingen bekräftelse.");
    }
    noteIrmaTokenSuccess(key);
    return noStore({ agreement, signed: agreement.status === "signed" });
  });
}

function noStore(data: unknown, status = 200): Response {
  const response = json(data, status);
  response.headers.set("cache-control", "no-store");
  return response;
}
