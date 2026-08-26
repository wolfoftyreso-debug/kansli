import { ApiError, requireOrg } from "@pixdrift/api-core";
import { getAgreement } from "@/lib/irma/agreements";
import { agreementSpeechText } from "@/lib/irma/speech";
import { handleApi } from "@/lib/platform/http";
import { synthesizeSpeech, ttsConfigured } from "@/lib/platform/tts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    if (!ttsConfigured()) {
      throw new ApiError("not_ready", "Uppläsning är inte kopplad.");
    }
    const org = requireOrg(actor);
    const { id } = await context.params;
    const agreement = await getAgreement(pool, org.orgRef, id);
    if (!agreement) throw new ApiError("not_found", "Avtalet finns inte.");
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
