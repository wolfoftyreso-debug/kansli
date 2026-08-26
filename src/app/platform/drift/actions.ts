"use server";

import { revalidatePath } from "next/cache";
import { OPS_SMS_KINDS, type OpsSmsKind } from "@/lib/platform/ops-view";
import { saveOpsSmsRoutes } from "@/lib/platform/ops-desk";
import { requireOrgAction } from "@/lib/platform/actions";

export async function saveOpsSmsAction(form: FormData) {
  const { session, pool } = await requireOrgAction("/platform/drift");
  const enabled = form
    .getAll("kind")
    .map((value) => String(value))
    .filter((value): value is OpsSmsKind => (OPS_SMS_KINDS as readonly string[]).includes(value));
  await saveOpsSmsRoutes({
    pool,
    orgRef: session.org.ref,
    phone: String(form.get("phone") ?? ""),
    enabled,
  });
  revalidatePath("/platform/drift");
}
