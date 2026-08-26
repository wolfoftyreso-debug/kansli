import { landvexAb } from "./site.ts";

export const hero = {
  eyebrow: "Founder-led engineering",
  title: "We fill the gaps between the big systems.",
  lede: "Landvex is a founder-led engineering company in Stockholm and Houston. The platforms you already run each do their job — we build what sits in between: the handoffs, the exceptions, and the data that never quite lines up.",
} as const;

export const capabilities = [
  {
    n: "01",
    title: "Between systems",
    body: "Services that sit between the platforms you already run. Handoffs that used to wait for someone to notice now move on every event, with retries and an audit trail.",
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
    body: "Ingest, storage and query layers built so every number can be traced back to its source. Lineage is a requirement, not a report generated afterwards.",
  },
  {
    n: "05",
    title: "Cloud foundation",
    body: "Accounts, IAM, networking and infrastructure as code — built in your cloud account, under your billing. EU and US data residency is set at the account boundary.",
  },
  {
    n: "06",
    title: "White label & handover",
    body: "We build, you run. Most of what we ship carries your name, in your accounts. Delivery is the code, the infrastructure as code and the handover — not an operations contract.",
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
    body: "The system ships as yours, under your name where that is the deal. Runbooks, dashboards and the code go with it. We do not stay on as an operations team.",
  },
] as const;

export const offers = [
  {
    n: "01 — Own products",
    body: "We build products for our own companies. That is where most of the year goes, and it is where the engineering standard is set.",
  },
  {
    n: "02 — White label",
    body: "Most of those systems we sell on to the organisations that need them most. Your brand, your accounts, your operations.",
  },
  {
    n: "03 — Selective assignments",
    body: "Two to five project engagements a year. Founder-led from the first call, chosen because the problem sits in a gap we know how to close.",
  },
  {
    n: "04 — Development, not ops",
    body: "We design and build. We do not sell on-call, staffing or managed operations. When the work is done, the system is yours to run.",
  },
] as const;

export const offices = [
  {
    city: "Stockholm",
    label: "EU HQ",
    region: "CET / CEST",
    body: `${landvexAb.legalName} · ${landvexAb.street}, ${landvexAb.postalCode} ${landvexAb.city}, Sweden · Org.nr ${landvexAb.orgNr}. European engineering, EU regulatory work, and data kept in region.`,
  },
  {
    city: "Houston",
    label: "US HQ",
    region: "US Central",
    body: "Landvex Inc. · Houston, Texas. The US headquarters, and where North American work is contracted and built.",
  },
] as const;

export const principles = [
  {
    title: "Small by design",
    body: "Senior engineers only. Two to five assignments a year, so the ones we take get the whole team rather than a slice of it.",
  },
  {
    title: "Evidence over assertion",
    body: "Accuracy, throughput and cost are measured against how the work runs today, and reported as they are.",
  },
  {
    title: "You own it",
    body: "White label by default. Code in your accounts, infrastructure as code, no proprietary lock-in and no operations contract attached.",
  },
] as const;

export const glance = [
  {
    value: "2–5",
    sr: " project assignments a year",
    label:
      "Project assignments a year. The rest of the year goes to products for our own companies",
  },
  {
    value: "2",
    sr: " engineering offices",
    label:
      "Engineering offices — Stockholm and Houston, with overlapping hours across the EU and US Central day",
  },
  {
    value: "0",
    sr: " operations contracts",
    label:
      "Operations contracts. We are a development company: we build it, hand it over, and you run it",
  },
] as const;
