import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";

const capabilities = [
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

const steps = [
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

const layers = [
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

export default function HomePage() {
  return (
    <main id="main">
      <section className="border-b border-line">
        <div className="mx-auto grid min-h-[600px] max-w-[1240px] items-stretch site:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center px-6 py-16 site:py-[104px] site:pr-[72px] site:pl-10">
            <div className="mb-[34px] flex items-center gap-3.5">
              <span className="inline-block h-[3px] w-[34px] bg-teal" />
              <span className="eyebrow text-teal">Founder-led · AWS engineering</span>
            </div>
            <h1 className="m-0 max-w-[15ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.03em] site:text-[64px]">
              We automate the work that used to need people.
            </h1>
            <p className="mt-8 mb-0 max-w-[52ch] text-xl leading-[1.55] text-muted">
              Landvex is a founder-led engineering company with offices in Stockholm and
              Houston. We design, build and operate automation on AWS — replacing manual
              review, manual data entry and manual coordination with systems that run
              continuously, and can be audited.
            </p>
            <div className="mt-11 flex flex-wrap gap-3.5">
              <a
                href="#contact"
                className="bg-navy px-[30px] py-4 text-[15px] font-semibold text-white hover:bg-teal hover:text-white"
              >
                Book a technical review
              </a>
              <a
                href="#capabilities"
                className="border border-navy px-[30px] py-4 text-[15px] font-semibold text-navy hover:bg-wash hover:text-navy"
              >
                See what we build
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-10 bg-navy px-8 py-14 site:mr-[-40px] site:px-12 site:py-14">
            <div className="grid gap-7">
              <div className="border-t border-white/18 pt-[18px]">
                <div className="text-[38px] font-semibold tracking-[-0.02em] text-accent">
                  2
                </div>
                <div className="mt-1.5 text-sm text-panel">
                  Engineering offices — Stockholm and Houston, overlapping working hours
                  across EU and US Central
                </div>
              </div>
              <div className="border-t border-white/18 pt-[18px]">
                <div className="text-[38px] font-semibold tracking-[-0.02em] text-accent">
                  AWS
                </div>
                <div className="mt-1.5 text-sm text-panel">
                  Native to the platform — event-driven services, managed inference,
                  infrastructure as code
                </div>
              </div>
              <div className="border-t border-white/18 pt-[18px]">
                <div className="text-[38px] font-semibold tracking-[-0.02em] text-accent">
                  24–72h
                </div>
                <div className="mt-1.5 text-sm text-panel">
                  From a defined task to structured, delivered output in our own
                  production systems
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-wash">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-6 px-6 py-9 site:gap-12 site:px-10">
          <span className="eyebrow text-subtle">Two entities, one engineering team</span>
          <span className="text-[15px] text-muted">
            Landvex Inc. — Houston, Texas (US HQ)
          </span>
          <span className="hidden h-4 w-px bg-edge min-[720px]:inline-block" />
          <span className="text-[15px] text-muted">
            Landvex AB — Tyresö, Stockholm (EU HQ) · Org.nr {site.entities.eu.orgNr}
          </span>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-24 border-b border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-16 site:px-10 site:py-[104px]">
          <div className="mb-12 grid items-start gap-10 site:mb-[72px] site:grid-cols-[0.9fr_1.1fr] site:gap-20">
            <div>
              <span className="eyebrow text-teal">Capabilities</span>
              <h2 className="mt-5 mb-0 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] site:text-[44px]">
                Manual processes, rebuilt as production systems.
              </h2>
            </div>
            <p className="m-0 text-lg leading-[1.6] text-muted site:pt-11">
              Most of the work we take on starts as a spreadsheet, an inbox, or a person
              checking things by hand. We map the process, define what &quot;correct&quot;
              means, and move it onto AWS as a service with monitoring, retries and an
              audit trail. Where judgement is genuinely required, the system asks a human
              — and learns from the answer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px border-t border-l border-line bg-line site:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.n} className="bg-white px-[34px] pt-10 pb-11">
                <div className="mb-[22px] font-mono text-xs text-teal">{item.n}</div>
                <h3 className="mt-0 mb-3 text-[21px] font-semibold tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="m-0 text-[15px] leading-[1.65] text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="scroll-mt-24 border-b border-line bg-wash">
        <div className="mx-auto max-w-[1240px] px-6 py-16 site:px-10 site:py-[104px]">
          <div className="mb-12 max-w-[60ch] site:mb-16">
            <span className="eyebrow text-teal">Approach</span>
            <h2 className="mt-5 mb-5 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] site:text-[44px]">
              Founder-led, from first call to production.
            </h2>
            <p className="m-0 text-lg leading-[1.6] text-muted">
              The people who scope your work are the people who build it. There is no
              account layer between you and the engineers, and no handover to a team you
              have not met.
            </p>
          </div>
          <div className="grid gap-10 site:grid-cols-4">
            {steps.map((item) => (
              <article key={item.n} className="border-t-[3px] border-navy pt-6">
                <div className="mb-3.5 font-mono text-xs text-subtle">{item.n}</div>
                <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">{item.title}</h3>
                <p className="m-0 text-[15px] leading-[1.65] text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 bg-navy text-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-16 site:grid-cols-2 site:gap-20 site:px-10 site:py-[104px]">
          <div>
            <span className="eyebrow text-accent">Built in-house</span>
            <h2 className="mt-5 mb-6 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] site:text-[44px]">
              We run our own automation at scale.
            </h2>
            <p className="mt-0 mb-5 text-lg leading-[1.6] text-mist">
              Landvex operates RIOS, a vendor-agnostic system that turns continuous video
              observations of the physical world into structured intelligence. Field
              capture, model orchestration, active learning and a knowledge graph — all
              of it running on AWS, built by the same team you would be hiring.
            </p>
            <p className="mt-0 mb-9 text-lg leading-[1.6] text-mist">
              It is the clearest statement of what we do: a workflow that used to require
              inspectors, spreadsheets and site visits, now delivered as a continuously
              running service.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <a
                href="#contact"
                className="bg-accent px-[30px] py-4 text-[15px] font-semibold text-navy hover:bg-white hover:text-navy"
              >
                Request a walkthrough
              </a>
              <a
                href="/methodology"
                className="border border-white/35 px-[30px] py-4 text-[15px] font-semibold text-white hover:bg-white/8 hover:text-white"
              >
                Read the methodology
              </a>
            </div>
          </div>
          <div className="grid gap-px bg-white/14">
            {layers.map((item) => (
              <div key={item.n} className="bg-navy px-8 py-7">
                <div className="mb-2.5 font-mono text-xs text-accent">{item.n}</div>
                <p className="m-0 text-[15px] leading-[1.6] text-mist">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="company" className="scroll-mt-24 border-b border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-16 site:px-10 site:py-[104px]">
          <div className="mb-12 max-w-[60ch] site:mb-16">
            <span className="eyebrow text-teal">Company</span>
            <h2 className="mt-5 mb-5 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] site:text-[44px]">
              Two offices, one working day.
            </h2>
            <p className="m-0 text-lg leading-[1.6] text-muted">
              Stockholm covers the European day and EU data residency. Houston covers US
              Central and the industrial, energy and infrastructure sectors on that side
              of the Atlantic. The overlap is deliberate — most days both offices are
              online together.
            </p>
          </div>
          <div className="grid gap-px border border-line bg-line site:grid-cols-2">
            <article className="bg-white px-8 py-11 site:px-10">
              <div className="mb-2 flex items-baseline gap-3">
                <h3 className="m-0 text-[26px] font-semibold tracking-[-0.015em]">
                  Stockholm
                </h3>
                <span className="font-mono text-[11px] tracking-[0.12em] text-teal uppercase">
                  EU HQ
                </span>
              </div>
              <p className="mt-0 mb-6 text-[15px] leading-[1.65] text-muted">
                Landvex AB · Tyresö, Sweden · Org.nr {site.entities.eu.orgNr}. European
                engineering, EU regulatory work and data handled in region.
              </p>
              <div className="border-t border-line pt-[18px] font-mono text-xs tracking-[0.06em] text-subtle">
                CET / CEST · eu-north-1
              </div>
            </article>
            <article className="bg-white px-8 py-11 site:px-10">
              <div className="mb-2 flex items-baseline gap-3">
                <h3 className="m-0 text-[26px] font-semibold tracking-[-0.015em]">
                  Houston
                </h3>
                <span className="font-mono text-[11px] tracking-[0.12em] text-teal uppercase">
                  US HQ
                </span>
              </div>
              <p className="mt-0 mb-6 text-[15px] leading-[1.65] text-muted">
                Landvex Inc. · Houston, Texas. The parent company, and our base for North
                American clients in energy, infrastructure and industry.
              </p>
              <div className="border-t border-line pt-[18px] font-mono text-xs tracking-[0.06em] text-subtle">
                US CENTRAL · us-east-1
              </div>
            </article>
          </div>
          <div className="mt-12 grid gap-10 site:mt-16 site:grid-cols-3">
            <div>
              <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">Small by design</h3>
              <p className="m-0 text-[15px] leading-[1.65] text-muted">
                Senior engineers only. We take fewer engagements and stay in them longer.
              </p>
            </div>
            <div>
              <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">
                Evidence over assertion
              </h3>
              <p className="m-0 text-[15px] leading-[1.65] text-muted">
                Accuracy, throughput and cost are measured against the manual baseline
                and reported as they are.
              </p>
            </div>
            <div>
              <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">You own it</h3>
              <p className="m-0 text-[15px] leading-[1.65] text-muted">
                Code in your accounts, infrastructure as code, no proprietary lock-in on
                the automation we build for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-b border-line bg-wash">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-16 site:grid-cols-2 site:gap-20 site:px-10 site:py-[104px]">
          <div>
            <span className="eyebrow text-teal">Get in touch</span>
            <h2 className="mt-5 mb-5 text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] site:text-[44px]">
              Which process should stop being manual?
            </h2>
            <p className="mt-0 mb-8 text-lg leading-[1.6] text-muted">
              Describe the work as it runs today — who does it, how often, and what goes
              wrong. You will hear back from a founder, not a form.
            </p>
            <div className="grid gap-3.5 text-[15px] text-muted">
              <div>
                <a href={`mailto:${site.email}`} className="font-semibold">
                  {site.email}
                </a>
              </div>
              <div>Landvex Inc. · Houston, Texas</div>
              <div>
                Landvex AB · Tyresö, Sweden · Org.nr {site.entities.eu.orgNr}
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
