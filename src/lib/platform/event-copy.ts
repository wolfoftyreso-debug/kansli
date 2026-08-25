import type { StoredEvent } from "@pixdrift/events";

const HEADLINE_KEYS = ["title", "headline", "companyName", "reason"] as const;

export function eventHeadline(payload: Record<string, unknown>): string | null {
  for (const key of HEADLINE_KEYS) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function eventLine(event: Pick<StoredEvent, "kind" | "payload" | "subjectRef">): string {
  return eventHeadline(event.payload) ?? event.subjectRef ?? event.kind;
}
