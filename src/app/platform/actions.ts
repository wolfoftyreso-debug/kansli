"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { pingGateway } from "@/lib/platform/ai";

export type GatewayPingState =
  | { ok: true; model: string; text: string; latencyMs: number }
  | { ok: false; error: string }
  | null;

export async function pingAiGateway(
  _prev: GatewayPingState,
  formData: FormData,
): Promise<Exclude<GatewayPingState, null>> {
  void _prev;
  void formData;
  await requireOrgAction("/platform");
  try {
    const ping = await pingGateway();
    revalidatePath("/platform");
    return { ok: true, model: ping.model, text: ping.text, latencyMs: ping.latencyMs };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "gateway_failed" };
  }
}
