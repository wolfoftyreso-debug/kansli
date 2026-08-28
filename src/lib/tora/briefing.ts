import { demoCompany, demoGraph, type Company } from "@pixdrift/tora";
import { DEFAULT_LOCALE, t, type Locale } from "../i18n";
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

export function buildCompanyBriefing(
  company: Company,
  locale: Locale = DEFAULT_LOCALE,
): CompanyBriefing {
  const size = [
    company.employees != null
      ? t(locale, "tora.brief.employees", { count: company.employees })
      : null,
    company.annualRevenueSek != null
      ? t(locale, "tora.brief.revenue", { amount: sek(company.annualRevenueSek) })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const facts = [
    size ? { label: t(locale, "tora.brief.size"), value: size } : null,
    company.capabilities.length
      ? {
          label: t(locale, "tora.brief.can"),
          value: joinLabels(company.capabilities, capabilityLabel),
        }
      : null,
    company.servesAreas.length
      ? { label: t(locale, "tora.brief.areas"), value: joinLabels(company.servesAreas, areaLabel) }
      : null,
    company.certifications.length
      ? {
          label: t(locale, "tora.brief.certs"),
          value: joinLabels(company.certifications, certificationLabel),
        }
      : null,
    company.registrations.length
      ? {
          label: t(locale, "tora.brief.regs"),
          value: joinLabels(company.registrations, registrationLabel),
        }
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
        t(locale, "tora.brief.publicBuyer");
      return {
        title: contract.title,
        buyer,
        detail: contract.valueSek
          ? `${t(locale, "tora.brief.rankOne")} · ${sek(contract.valueSek)}`
          : t(locale, "tora.brief.rankOne"),
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
      ? t(locale, "tora.brief.demoHeadline", { name: company.name })
      : t(locale, "tora.brief.savedHeadline", { name: company.name });

  return { name: company.name, headline, facts, frameworks, references };
}
