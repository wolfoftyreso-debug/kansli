import { ContactForm } from "@/components/contact-form";
import {
  capabilities,
  glance,
  hero,
  products,
  offices,
  principles,
  steps,
} from "@/lib/home";
import { landvexAb, site } from "@/lib/site";

export default function HomePage() {
  return (
    <main id="main">
      <section className="border-b border-line">
        <div className="hero">
          <div className="hero-copy">
            <div className="kicker mb-8">
              <span className="kicker-rule" aria-hidden="true" />
              <span className="eyebrow text-teal">{hero.eyebrow}</span>
            </div>
            <h1 className="display">{hero.title}</h1>
            <p className="lede mt-8">{hero.lede}</p>
            <div className="mt-11 flex flex-wrap gap-3.5">
              <a className="btn btn-primary" href="#contact">
                Book a technical review
              </a>
              <a className="btn btn-secondary" href="#capabilities">
                See what we build
              </a>
            </div>
          </div>
          <aside className="hero-panel" aria-label="At a glance">
            <dl className="hero-facts">
              {glance.map((item) => (
                <div key={item.value}>
                  <dt>
                    <span className="hero-stat">{item.value}</span>
                    <span className="sr-only">{item.sr}</span>
                  </dt>
                  <dd className="hero-stat-label">{item.label}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="border-b border-line bg-wash">
        <div className="wrap flex flex-wrap items-center gap-6 py-9 site:gap-12">
          <span className="eyebrow text-subtle">Two entities, one engineering team</span>
          <span className="text-[15px] text-muted">
            Landvex Inc. — Houston, Texas (US HQ)
          </span>
          <span className="hidden h-4 w-px bg-edge min-[720px]:inline-block" />
          <span className="text-[15px] text-muted">
            Landvex AB — Tyresö, Sweden (EU HQ) · Org.nr {landvexAb.orgNr}
          </span>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-24 border-b border-line">
        <div className="wrap section">
          <div className="mb-12 grid items-start gap-10 site:mb-[4.5rem] site:grid-cols-[0.9fr_1.1fr] site:gap-20">
            <div>
              <span className="eyebrow text-teal">Capabilities</span>
              <h2 className="headline mt-5">The layer between the systems you already run.</h2>
            </div>
            <p className="intro site:pt-11">
              Most of the work we take on lives between systems that were never meant to
              talk: a spreadsheet next to an ERP, an inbox next to a GIS, a person
              reconciling two sources of truth. We map that gap, define what “correct”
              looks like, and put a production service in the middle — with monitoring,
              retries and an audit trail. Where judgement is genuinely required, the
              system asks a human — and learns from the answer.
            </p>
          </div>
          <ol className="tile-grid">
            {capabilities.map((item) => (
              <li key={item.n} className="tile">
                <article>
                  <div className="index mb-[1.375rem]">{item.n}</div>
                  <h3 className="mt-0 mb-3 text-[21px] font-semibold tracking-[-0.01em]">
                    {item.title}
                  </h3>
                  <p className="body">{item.body}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="approach" className="scroll-mt-24 border-b border-line bg-wash">
        <div className="wrap section">
          <div className="mb-12 max-w-[60ch] site:mb-16">
            <span className="eyebrow text-teal">Approach</span>
            <h2 className="headline mt-5 mb-5">Founder-led, from first call to handover.</h2>
            <p className="intro">
              The people who scope your work are the people who build it. There is no
              account layer between you and the engineers.
            </p>
          </div>
          <ol className="step-grid">
            {steps.map((item) => (
              <li key={item.n} className="step">
                <article>
                  <div className="mb-3.5 font-mono text-xs text-subtle">{item.n}</div>
                  <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">{item.title}</h3>
                  <p className="body">{item.body}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="products" className="scroll-mt-24 bg-navy text-white">
        <div className="wrap section grid items-center gap-12 site:grid-cols-2 site:gap-20">
          <div>
            <span className="eyebrow text-accent">Built in-house</span>
            <h2 className="headline mt-5 mb-6">Own products. White-label. A few assignments.</h2>
            <p className="mt-0 mb-5 text-lg leading-[1.6] text-mist">
              We develop products for our own companies. Most of those systems we sell
              white-label to the organisations that need them most. Alongside that we
              take two to five project assignments a year — the ones that sit in the
              same gaps.
            </p>
            <p className="mt-0 mb-9 text-lg leading-[1.6] text-mist">
              We are development only. We do not offer operations.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <a className="btn btn-accent" href="#contact">
                Book a technical review
              </a>
              <a className="btn btn-ghost-on-dark" href="/methodology">
                Read the methodology
              </a>
            </div>
          </div>
          <ol className="layer-stack">
            {products.map((item) => (
              <li key={item.n} className="layer">
                <div className="index mb-2.5 text-accent">{item.n}</div>
                <p className="m-0 text-[15px] leading-[1.6] text-mist">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="company" className="scroll-mt-24 border-b border-line">
        <div className="wrap section">
          <div className="mb-12 max-w-[60ch] site:mb-16">
            <span className="eyebrow text-teal">Company</span>
            <h2 className="headline mt-5 mb-5">Two offices, one working day.</h2>
            <p className="intro">
              Stockholm covers the European day and EU data residency. Houston covers US
              Central and the industrial, energy and infrastructure sectors on that side
              of the Atlantic. The overlap is deliberate — most days both offices are
              online together.
            </p>
          </div>
          <div className="office-grid">
            {offices.map((office) => (
              <article key={office.city} className="office">
                <div className="mb-2 flex items-baseline gap-3">
                  <h3 className="m-0 text-[26px] font-semibold tracking-[-0.015em]">
                    {office.city}
                  </h3>
                  <span className="font-mono text-[11px] tracking-[0.12em] text-teal uppercase">
                    {office.label}
                  </span>
                </div>
                <p className="body mb-6">{office.body}</p>
                <div className="border-t border-line pt-[18px] font-mono text-xs tracking-[0.06em] text-subtle">
                  {office.region}
                </div>
              </article>
            ))}
          </div>
          <ul className="mt-12 grid list-none gap-10 p-0 site:mt-16 site:grid-cols-3">
            {principles.map((item) => (
              <li key={item.title}>
                <h3 className="mt-0 mb-2.5 text-[19px] font-semibold">{item.title}</h3>
                <p className="body">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-b border-line bg-wash">
        <div className="wrap section grid gap-12 site:grid-cols-2 site:gap-20">
          <div>
            <span className="eyebrow text-teal">Get in touch</span>
            <h2 className="headline mt-5 mb-5">Where does the work fall between systems?</h2>
            <p className="intro mb-8">
              Describe the work as it runs today — who does it, how often, and what goes
              wrong. You will hear back from a founder, not a form.
            </p>
            <div className="grid gap-3.5 text-[15px] text-muted">
              <div>
                <a className="font-semibold" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </div>
              <div>Landvex Inc. · Houston, Texas</div>
              <div>
                {landvexAb.legalName} · {landvexAb.street}, {landvexAb.postalCode}{" "}
                {landvexAb.city} · Org.nr {landvexAb.orgNr} · VAT {landvexAb.vat}
              </div>
              <div>
                <a href="/company">Company information</a>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
