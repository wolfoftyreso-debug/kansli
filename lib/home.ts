import { landvexAb } from "./site.ts";

export const hero = {
  eyebrow: "Founder-led engineering",
  title: "We fill the gaps between the big systems.",
  lede: "Landvex is a founder-led engineering company with offices in Stockholm and Houston. The platforms you already run each do their job. We design and build what sits in between — the handoffs, the exceptions, the data that never quite lines up. Development only: two to five project assignments a year, plus our own products, most of them sold white-label.",
} as const;

export const capabilities = [
  {
    n: "01",
    title: "Between systems",
    body: "Pipelines that sit between the platforms you already run. Handoffs that waited for someone to notice now move on every event, with retries and an audit trail.",
  },
  {
    n: "02",
    title: "Document & media processing",
    body: "Extraction, classification and validation of documents, images and video at volume. Confidence scored per field, with exceptions routed to a reviewer instead of the whole batch.",
  },
  {
    n: "03",
    title: "Applied AI in production",
    body: "Model orchestration with evaluation harnesses, guardrails and cost ceilings. We treat inference as a line item, not a demo.",
  },
  {
    n: "04",
    title: "Data platforms",
    body: "Ingest, storage and query layers built so every number can be traced back to its source. Lineage is a requirement, not a report we generate afterwards.",
  },
  {
    n: "05",
    title: "Cloud foundation",
    body: "Accounts, IAM, networking and infrastructure as code. EU and US data residency handled at the account boundary, not by policy documents.",
  },
  {
    n: "06",
    title: "White label & handover",
    body: "We build, you run. Most of the systems we ship are white-label, in your accounts. We do not offer operations — delivery includes the code, the infrastructure as code, and a clean handover.",
  },
] as const;

export const steps = [
  {
    n: "Step 01",
    title: "Find the gap",
    body: "Two or three days with the people in the middle. We map what the large systems do not cover — volume, handling time, error rate — before proposing anything.",
  },
  {
    n: "Step 02",
    title: "Prove it on real data",
    body: "A narrow slice in production within weeks, running alongside how the work is done today so the two can be compared directly.",
  },
  {
    n: "Step 03",
    title: "Scale what holds",
    body: "Widen the scope only where accuracy and cost hold up. Everything is infrastructure as code from the first commit.",
  },
  {
    n: "Step 04",
    title: "Hand over",
    body: "The system ships as yours. White-label where that is the deal. Runbooks and observability go with the code. We do not stay on as an operations team.",
  },
] as const;

export const products = [
  {
    n: "01 — Own products",
    body: "We develop products for our own companies. That is the bulk of the work: systems we need, built to production standard.",
  },
  {
    n: "02 — White label",
    body: "Most of those systems we sell to the organisations that need them most. Your brand, your accounts, your operations.",
  },
  {
    n: "03 — Selective assignments",
    body: "Two to five project engagements a year. Founder-led, from first call to a working system in the same gaps we close for ourselves.",
  },
  {
    n: "04 — Development, not ops",
    body: "We design and build. We do not sell on-call, stay-on, or managed operations. When the work is done, the system is yours.",
  },
] as const;

export const offices = [
  {
    city: "Stockholm",
    label: "EU HQ",
    region: "CET / CEST",
    body: `${landvexAb.legalName} · ${landvexAb.street}, ${landvexAb.postalCode} ${landvexAb.city}, Sweden · Org.nr ${landvexAb.orgNr}. European engineering, EU regulatory work and data handled in region.`,
  },
  {
    city: "Houston",
    label: "US HQ",
    region: "US Central",
    body: "Landvex Inc. · Houston, Texas. The US headquarters, and our base for North American clients in energy, infrastructure and industry.",
  },
] as const;

export const principles = [
  {
    title: "Small by design",
    body: "Senior engineers only. Two to five assignments a year. We spend the rest of the time on our own products.",
  },
  {
    title: "Evidence over assertion",
    body: "Accuracy, throughput and cost are measured against how the work runs today and reported as they are.",
  },
  {
    title: "You own it",
    body: "White-label by default. Code in your accounts, infrastructure as code, no proprietary lock-in, no ops contract attached.",
  },
] as const;

export const glance = [
  {
    value: "2",
    sr: " engineering offices",
    label:
      "Engineering offices — Stockholm and Houston, overlapping working hours across EU and US Central",
  },
  {
    value: "Between",
    sr: " existing systems",
    label:
      "The layer between the platforms you already run — handoffs, exceptions, and the work that never quite made it in",
  },
  {
    value: "2–5",
    sr: " project assignments a year",
    label:
      "Special project assignments a year. The rest of the time we develop our own products",
  },
] as const;
