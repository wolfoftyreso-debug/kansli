import { landvexAb } from "./site.ts";

export const hero = {
  eyebrow: "Founder-led · AWS engineering",
  title: "We automate the work that used to need people.",
  lede: "Landvex is a founder-led engineering company with offices in Stockholm and Houston. We design, build and operate automation on AWS — replacing manual review, manual data entry and manual coordination with systems that run continuously, and can be audited.",
} as const;

export const capabilities = [
  {
    n: "01",
    title: "Process automation",
    body: "Event-driven pipelines on Lambda, Step Functions, SQS and EventBridge. Work that ran once a week when someone had time now runs on every event, in seconds.",
  },
  {
    n: "02",
    title: "Document & media processing",
    body: "Extraction, classification and validation of documents, images and video at volume. Confidence scored per field, with exceptions routed to a reviewer instead of the whole batch.",
  },
  {
    n: "03",
    title: "Applied AI in production",
    body: "Model orchestration on Bedrock and SageMaker, with evaluation harnesses, guardrails and cost ceilings. We treat inference as a line item, not a demo.",
  },
  {
    n: "04",
    title: "Data platforms",
    body: "Ingest, storage and query layers built so every number can be traced back to its source. Lineage is a requirement, not a report we generate afterwards.",
  },
  {
    n: "05",
    title: "Cloud foundation",
    body: "Multi-account AWS setups, IAM, networking and infrastructure as code. EU and US data residency handled at the account boundary, not by policy documents.",
  },
  {
    n: "06",
    title: "Run & operate",
    body: "We stay on after launch. Observability, on-call, cost review and a roadmap for the next process to automate. Handover is optional, never abrupt.",
  },
] as const;

export const steps = [
  {
    n: "Step 01",
    title: "Find the manual work",
    body: "Two or three days with the people doing the task. We measure volume, handling time and error rate before proposing anything.",
  },
  {
    n: "Step 02",
    title: "Prove it on real data",
    body: "A narrow slice in production within weeks, running alongside the manual process so the two can be compared directly.",
  },
  {
    n: "Step 03",
    title: "Scale what holds",
    body: "Widen the scope only where accuracy and cost hold up. Everything is infrastructure as code from the first commit.",
  },
  {
    n: "Step 04",
    title: "Operate and extend",
    body: "Monitoring, cost control and a standing review of the next process worth removing from someone's day.",
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
    region: "CET / CEST · eu-north-1",
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
    body: "Accuracy, throughput and cost are measured against the manual baseline and reported as they are.",
  },
  {
    title: "You own it",
    body: "Code in your accounts, infrastructure as code, no proprietary lock-in on the automation we build for you.",
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
    value: "AWS",
    sr: " native",
    label:
      "Native to the platform — event-driven services, managed inference, infrastructure as code",
  },
  {
    value: "24–72h",
    sr: " from task to delivered output",
    label:
      "From a defined task to structured, delivered output in our own production systems",
  },
] as const;
