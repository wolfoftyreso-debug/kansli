import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import {
  acknowledgeAgreement,
  openAgreementByToken,
  peekAgreementByToken,
} from "@/lib/irma/agreements";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "@/lib/irma/throttle";

function guardToken(token: string): string {
  const key = irmaThrottleKey(token);
  if (irmaTokenBlocked(key)) {
    throw new ApiError("not_found", "The link is invalid or has expired.");
  }
  return key;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const key = guardToken(token);
    const agreement = await peekAgreementByToken(pool, token);
    if (!agreement) {
      noteIrmaTokenFailure(key);
      throw new ApiError("not_found", "The link is invalid or has expired.");
    }
    noteIrmaTokenSuccess(key);
    return noStore({ agreement, signed: agreement.status === "signed" });
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool, events, requestId }) => {
    const { token } = await context.params;
    const key = guardToken(token);
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      signerName?: string;
    } | null;
    if (body?.action === "view") {
      const agreement = await openAgreementByToken({ pool, events, token, requestId });
      if (!agreement) {
        noteIrmaTokenFailure(key);
        throw new ApiError("not_found", "The link is invalid or has expired.");
      }
      noteIrmaTokenSuccess(key);
      return noStore({ agreement, signed: agreement.status === "signed" });
    }
    const signerName = body?.signerName?.trim() ?? "";
    if (!signerName) throw new ApiError("invalid_request", "signerName is required.");
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
      throw new ApiError("not_found", "The link is invalid or has expired.");
    }
    if (agreement.verificationLevel === 0) {
      throw new ApiError("invalid_request", "The record does not require acknowledgement.");
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
