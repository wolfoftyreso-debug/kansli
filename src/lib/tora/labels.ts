import { demoGraph } from "@pixdrift/tora";

const AREA = new Map(demoGraph.areas.map((area) => [area.code, area.name]));
const CAPABILITY = new Map(demoGraph.capabilities.map((item) => [item.code, item.label]));
const CERTIFICATION = new Map(demoGraph.certifications.map((item) => [item.code, item.label]));

const REGISTRATION: Record<string, string> = {
  f_tax: "F-skatt",
  vat: "Moms",
  employer: "Arbetsgivare",
};

const REQUIREMENT_STATUS: Record<string, string> = {
  met: "Uppfyllt",
  unmet: "Saknas",
  remediable: "Går att fixa",
  unknown: "Vi vet inte",
};

export function areaLabel(code: string): string {
  return AREA.get(code) ?? code;
}

export function capabilityLabel(code: string): string {
  return CAPABILITY.get(code) ?? code;
}

export function certificationLabel(code: string): string {
  return CERTIFICATION.get(code) ?? code;
}

export function registrationLabel(code: string): string {
  return REGISTRATION[code] ?? code;
}

export function requirementStatusText(status: string): string {
  return REQUIREMENT_STATUS[status] ?? status;
}

export function joinLabels(codes: readonly string[], label: (code: string) => string): string {
  return codes.map(label).join(", ");
}
