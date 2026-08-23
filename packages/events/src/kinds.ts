export const SYSTEMS = ["identity", "kansli", "tora", "rita", "britt", "irma", "alva"] as const;
export type SystemId = (typeof SYSTEMS)[number];

export const EVENT_KINDS = [
  "identity.session.started",
  "kansli.task.created",
  "kansli.task.updated",
  "tora.market.evaluated",
  "rita.analysis.requested",
  "rita.analysis.completed",
  "rita.analysis.blocked",
  "britt.observation.recorded",
  "irma.agreement.created",
  "alva.case.created",
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export function isSystemId(value: string): value is SystemId {
  return (SYSTEMS as readonly string[]).includes(value);
}

export function isEventKind(value: string): value is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(value);
}
