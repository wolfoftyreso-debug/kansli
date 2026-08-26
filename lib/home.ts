import { landvexAb } from "./site.ts";

export const hero = {
  eyebrow: "Founder-led engineering",
  title: "We fill the gaps between the big systems.",
  lede: "Landvex is a founder-led engineering company with offices in Stockholm and Houston. The platforms you already run each do their job. We design, build and operate what sits in between — the handoffs, the exceptions, the data that never quite lines up.",
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
    title: "Run & operate",
    body: "We stay on after launch. Observability, on-call, cost review and a look at the next gap worth closing. Handover is optional, never abrupt.",
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
    title: "Operate and extend",
    body: "Monitoring, cost control and a standing review of the next gap between systems worth closing.",
  },
] as const;

export const layers = [
  {
    n: "Layer 01 — Capture",
    body: "Mobile, body, vehicle and drone capture. 4K/8K video with GPS, IMU and compass metadata. Original media immutable.",
  },
  {
    n: "Layer 02 — Orchestration",
    body: "An engine decides which specialist models run per observation: classification, detection, segmentation, depth, OCR.",
  },
  {
    n: "Layer 03 — Active learning",
    body: "Humans are asked only when the expected learning value clears a threshold. Validations take seconds, not sessions.",
  },
  {
    n: "Layer 04 — Knowledge graph",
    body: "Assets, relationships, condition and history, continuously indexed. Every output traceable to source, observation and model.",
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
    body: "Senior engineers only. We take fewer engagements and stay in them longer.",
  },
  {
    title: "Evidence over assertion",
    body: "Accuracy, throughput and cost are measured against how the work runs today and reported as they are.",
  },
  {
    title: "You own it",
    body: "Code in your accounts, infrastructure as code, no proprietary lock-in on the systems we build for you.",
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
    value: "24–72h",
    sr: " from task to delivered output",
    label:
      "From a defined task to structured, delivered output in our own production systems",
  },
] as const;
