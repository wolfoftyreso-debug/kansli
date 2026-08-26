# PIXDRIFT — Automation & Engineering Doctrine

Permanent doctrine for how PIXDRIFT thinks about software, automation, AI,
integrations and complexity. Applies to the company, website, product
architecture, product copy and future systems. English is canonical.

## 1. We do not want to give people more software

Organizations do not suffer from a shortage of software — they suffer from too
much of it. A 100-person service company can depend on dozens of systems
(accounting, ERP, CRM, payroll, banking, identity, invoicing, documents,
scheduling, government services, payments, reporting, …). Each may be reasonable;
collectively they fragment. People re-enter the same data, export spreadsheets,
email them, and lose track of where the truth lives. The problem is not "we need
another system" — it is "we already have too many." PIXDRIFT exists for that.

## 2. Our job is to reduce friction

Practical, not clever: **Connect · Collect · Normalize · Trigger · Automate ·
Verify · Summarize · Present.** If System A knows what System B needs, connect
them. If a person repeatedly moves data between systems, make an event do it. If
management opens six apps to understand yesterday, collect it and present the
answer. If someone computes the same number every Monday, ask why a human still
does that.

## 3. Automation before interface

Automate before adding another screen. The best interface for a repetitive
process may be no interface. If something can reliably happen because an event
occurred / a value changed / a document arrived / a deadline passed / a status
changed / a threshold was crossed, consider whether the next action can happen
automatically. Human attention is expensive — use it where judgment is required.

## 4. Event-driven by default

Favor `EVENT → CONDITION → ACTION → VERIFICATION` where it materially improves
the product (invoice received → conditions satisfied → workflow initiated →
result recorded). The purpose is not architectural sophistication; it is removing
manual coordination.

## 5. Computation should replace administration

Machines watch, wait, match, count, compare, route, calculate, aggregate,
transform, check and trigger. Humans are for judgment, responsibility,
relationships, exceptions and decisions. Move work from the first category to
machines so people can focus on the second.

## 6. Automation should be visible

Inspiration from node-based automation clarity (e.g. n8n) — not the exact
interface. People should understand **why** something happened:
`SOURCE → EVENT → RULE → ACTION → RESULT`. Represent complex backend behavior as
simple, understandable flows — nodes, connectors, directional lines, event
traces — which fits the PIXDRIFT pixel/grid identity.

## 7. AI is a tool, not the product

PIXDRIFT is not an AI company; do not market around AI, and do not put
probabilistic models in charge of deterministic tasks conventional software does
more reliably. Use rules, events, APIs, queries, mathematics, deterministic
transforms, state machines, queues and schedulers first. Use AI only where the
problem genuinely needs language understanding, classification, semantic
interpretation, document understanding, summarization or assisted reasoning. AI
must earn its place.

## 8. AI should improve our engineering

We may use AI extensively internally (inspect code, test assumptions, find
defects, generate tests, review, docs, edge-case analysis, prototyping). That
does not make AI the product. The customer needs software that works, not a story
about how much AI was involved.

## 9. Boring technology is often good technology

Prefer technology that is understood, testable, observable, maintainable, secure,
portable where appropriate, and likely to remain usable for years. Start simple,
measure, understand the bottleneck, optimize deliberately. Rebuild
performance-critical components lower-level only with a demonstrated reason.

## 10. Simple first

`Problem → smallest useful implementation → real use → observation → correction →
automation → hardening → optimization where justified`. Do not design enormous
architectures around complexity that has not yet been demonstrated. A small
reliable system beats an impressive unfinished one.

## 11. Build for years

Some products will run for years. Optimize for maintainability, predictability,
data integrity, backwards compatibility, observability, recoverability, clear
ownership, simple deployment, controlled dependencies and comprehensible
architecture. The goal is not merely to ship — it is to remain operational.

## 12. We like unglamorous problems

Service companies, workshops, field operations, administration, infrastructure,
public-sector interfaces, document-heavy back-office coordination. A repetitive
process performed by thousands of people every working day is an engineering
opportunity. A problem does not need to be fashionable — it needs to be real.

## 13. Aggregation before analysis

Organizations usually already have the information; it is just distributed. Do
not immediately invent another source of truth. First connect existing sources:
collect, preserve provenance, normalize, connect, compute deterministic outputs,
identify exceptions, produce decision material. The objective is a coherent
operational picture, not another enormous database.

## 14. Decision material, not dashboard theatre

People rarely want graphs; they want answers. Do the deterministic work first,
then present: what happened, what changed, why it matters, what needs attention,
what decision is required. The graph is supporting evidence, not the product.

## 15. BRITT as an example

BRITT's purpose is to reduce the need to visit underlying systems: collect the
relevant pieces, connect them, compute what can be computed, detect what deserves
attention, present decision material. Not "here are 47 dashboards" but "here is
what you need to know." Underlying systems stay authoritative; PIXDRIFT is the
useful layer above and between them.

## 16. The PIXDRIFT stack (recurring model)

Products frequently combine six functions:

`CONNECT → COLLECT → NORMALIZE → AUTOMATE → VERIFY → INFORM`

- **Connect** existing systems and sources.
- **Collect** relevant information into a usable context.
- **Normalize** incompatible information so it is understandable together.
- **Automate** repetitive work from humans to computation.
- **Verify** that actions and information can be traced and checked.
- **Inform** — turn the result into understandable operational/decision material.

## 17. Design consequence

Visually communicate this: nodes, events, connections, flows, system blocks,
small PIXDRIFT intermediary modules, status changes, input/output relationships,
deterministic sequences. A visitor should see `SYSTEM A → PIXDRIFT → SYSTEM B`,
`5 SYSTEMS → PIXDRIFT → 1 DECISION`, `EVENT → PIXDRIFT → ACTION`. **No futuristic
AI brains, glowing neural networks, robots or magic.** Show systems, connections,
information moving, and work disappearing.

## 18. What we are really selling

Not dashboards, integrations, automation workflows or AI — those are mechanisms.
We sell **less friction**: fewer places to look, fewer manual transfers, fewer
repeated calculations, fewer forgotten actions, fewer disconnected processes,
fewer logins; better coordination, visibility, decision material and more
reliable execution.

## 19. The ultimate test (per feature)

Does this remove work or create work? Remove a system interaction or add one?
Could it happen automatically? Can conventional software solve it reliably
without AI? Does the user actually need to see this? Are we presenting
information or a decision? Can the result be verified? Will someone understand
this architecture in five years? If a feature merely adds another place to click,
reconsider it.

## 20. Engineering position

Old-fashioned about one thing: software should work — consistently,
understandably, maintainably, surviving trends, reducing work rather than
manufacturing workflows. We use modern tools, AI and automation where they
improve that outcome, but none of them are the identity. The identity is the
result.

## 21. Core positioning (three statements)

- **THE LAYER BETWEEN SYSTEMS.** — what we are.
- **BUILT BECAUSE IT WAS MISSING.** — why we build.
- **LESS SOFTWARE. MORE FLOW.** — what the customer experiences.

Supporting engineering statement: **Connect what exists. Automate what repeats.
Surface what matters.**

## 22. Build it here

Capabilities live in this repository. Runtime calls go only to **our API
vendors** (Vercel AI Gateway and the keys named in `docs/AI-PROVIDERS.md` and
`docs/INTEGRATIONS.md`: Anthropic, OpenAI, Gemini, Moonshot, and — when a
connector exists — 46elks, Resend, Mapbox).

Do not add e-ID login, e-sign SaaS, design APIs (Mobbin and the like), document
vendors, or a new third party to fill a product gap. If IRMA needs a stronger
acknowledgement, a PDF, or intake, implement it in this process against
Postgres and the existing vendors. Guest magic links stay first-party.

## Final principle

A PIXDRIFT product should make the surrounding technology environment feel
smaller, not larger. If an organization uses fifty systems, the ambition is not
to become number fifty-one — it is to make those fifty behave more like one
coherent environment. The user should not have to understand the architecture,
hunt for information, calculate what machines can calculate, or move information
software can move. They should receive what is relevant, when it is relevant,
with enough context to understand it and enough provenance to trust it.

**Connect what exists. Automate what repeats. Surface what matters.**
