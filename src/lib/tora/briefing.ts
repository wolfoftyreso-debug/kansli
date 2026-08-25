import { demoCompany, demoGraph, type Company } from "@pixdrift/tora";
import {
  areaLabel,
  capabilityLabel,
  certificationLabel,
  joinLabels,
  registrationLabel,
} from "./labels.ts";
import { sek } from "./view.ts";

export type CompanyBriefing = {
  name: string;
  headline: string;
  facts: { label: string; value: string }[];
  frameworks: { title: string; buyer: string; detail: string }[];
  references: { customer: string; detail: string }[];
};

export function buildCompanyBriefing(company: Company): CompanyBriefing {
  const size = [
    company.employees != null ? `${company.employees} anställda` : null,
    company.annualRevenueSek != null ? `${sek(company.annualRevenueSek)} i omsättning` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const facts = [
    size ? { label: "Storlek", value: size } : null,
    company.capabilities.length
      ? { label: "Ni kan", value: joinLabels(company.capabilities, capabilityLabel) }
      : null,
    company.servesAreas.length
      ? { label: "Ni jobbar i", value: joinLabels(company.servesAreas, areaLabel) }
      : null,
    company.certifications.length
      ? { label: "Certifikat", value: joinLabels(company.certifications, certificationLabel) }
      : null,
    company.registrations.length
      ? { label: "Registrerat", value: joinLabels(company.registrations, registrationLabel) }
      : null,
  ].filter((row): row is { label: string; value: string } => row != null);

  const frameworks = demoGraph.contracts
    .filter((contract) =>
      (contract.frameworkRankings ?? []).some(
        (row) => row.supplierId === company.id && row.rank === 1,
      ),
    )
    .map((contract) => {
      const buyer =
        demoGraph.organizations.find((org) => org.id === contract.organizationId)?.name ??
        "Offentlig köpare";
      return {
        title: contract.title,
        buyer,
        detail: `Ni är etta på avtalet${contract.valueSek ? ` · ${sek(contract.valueSek)}` : ""}.`,
      };
    });

  const references = (company.references ?? []).map((item) => ({
    customer: item.customerName,
    detail: [
      joinLabels(item.capabilities, capabilityLabel),
      item.valueSek != null ? sek(item.valueSek) : null,
      item.areas?.length ? joinLabels(item.areas, areaLabel) : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const headline =
    company.id === demoCompany.id
      ? `TORA räknar på ${company.name}: vad ni kan ta, vad som saknas, och vad ni ska göra härnäst.`
      : `TORA räknar på ${company.name} mot samma marknad.`;

  return { name: company.name, headline, facts, frameworks, references };
}
