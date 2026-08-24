"use server";

import { revalidatePath } from "next/cache";
import { requireOrgAction } from "@/lib/platform/actions";
import { persistSnapshot } from "@/lib/tora/persist";

export async function publishToraMarket() {
  const { session, pool, events } = await requireOrgAction("/tora");
  await persistSnapshot({
    pool,
    events,
    orgRef: session.org.ref,
    tier: session.org.tier,
    actorRef: session.sub,
    requestId: crypto.randomUUID(),
  });
  revalidatePath("/tora");
  revalidatePath("/britt");
  revalidatePath("/kansli");
  revalidatePath("/platform/events");
}
