import { ApiError } from "@pixdrift/api-core";
import { peekAgreementByToken } from "@/lib/irma/agreements";
import { agreementSpeechText } from "@/lib/irma/speech";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "@/lib/irma/throttle";
import { handleApi } from "@/lib/platform/http";
import { synthesizeSpeech, ttsConfigured } from "@/lib/platform/tts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  return handleApi(async ({ pool }) => {
    if (!ttsConfigured()) {
      throw new ApiError("not_ready", "Uppläsning är inte kopplad.");
    }
    const { token } = await context.params;
    const key = irmaThrottleKey(token);
    if (irmaTokenBlocked(key)) {
      throw new ApiError("not_found", "The link is invalid or has expired.");
    }
    const agreement = await peekAgreementByToken(pool, token);
    if (!agreement) {
      noteIrmaTokenFailure(key);
      throw new ApiError("not_found", "The link is invalid or has expired.");
    }
    noteIrmaTokenSuccess(key);
    const spoken = await synthesizeSpeech({ text: agreementSpeechText(agreement) });
    if (!spoken.ok) throw new ApiError("not_ready", spoken.reason);
    return new Response(Buffer.from(spoken.audio), {
      headers: {
        "content-type": spoken.contentType,
        "cache-control": "no-store",
      },
    });
  });
}
