# PIXDRIFT — Product Origin & Company Story (Doctrine)

Permanent part of the PIXDRIFT brand, product and communication doctrine. It
defines why PIXDRIFT products exist, where they come from, and how that story
must be communicated. English is the canonical source (§14). When website copy
and this doctrine disagree, this doctrine wins.

## 1. Not a startup story

PIXDRIFT was not created around a pitch deck, an accelerator or a theoretical
market opportunity. Its products originate from a simpler fact: experienced
business operators needed better tools. A problem existed; there should
reasonably have been software for it; nothing solved it properly; so we built it
ourselves. That pattern became PIXDRIFT.

## 2. Built from use, not from theory

PIXDRIFT products are operator-built software — from actual operational
requirements, not hypothetical personas. Existing software is evaluated first;
if an appropriate solution exists, there is little reason to recreate it.
PIXDRIFT is interested in the opposite: when the obvious tool should exist, but
does not.

## 3. The moment a tool becomes a product

Software may first exist because we need it ourselves. It gets used, changes,
becomes reliable; edge cases appear; the interface gets simpler; the model gets
better. Eventually the internal tool solves the problem better than the products
we originally searched for. Only then: could this be useful to others? That is
where a PIXDRIFT product can begin — not before.

## 4. Three possible outcomes (stewardship)

Not everything we build becomes a commercial product.

- **INTERNAL** — Useful to us. Keep it, improve it when necessary.
- **OPEN SOURCE** — Useful beyond us, but does not require us to operate it as a
  service. Publish, document, let people use and build on it.
- **MANAGED PRODUCT** — Important enough that users should not have to operate it
  themselves. PIXDRIFT takes responsibility: hosting, security, availability,
  maintenance, updates, documentation, support, data integrity, compatibility
  and long-term operation.

Software becomes a PIXDRIFT product when we are prepared to take responsibility
for it. This distinction is fundamental to the brand.

## 5. We do not build what already works

Established software is not inherently bad — the opposite. If an existing system
solves a problem well, use it. Organizations already have excellent systems for
finance, accounting, ERP, CRM, communication, documents, identity, payments and
thousands of specialist functions. PIXDRIFT's territory begins where their
responsibility ends: **the layer between systems.**

## 6. The pixel principle

An operational environment is a picture; large platforms are its obvious
structures, but a picture is composed of much smaller units — pixels. PIXDRIFT
works with the smaller units: the missing workflow, the handover, the exception,
the verification step, the small dataset, the connection, the overlooked
interface, the operational question nobody owns. Individually too small to
justify replacing an enterprise system; collectively decisive.

## 7. Experience without founder theatre

Maturity shows through reasoning, never through founder mythology. Avoid "serial
entrepreneurs", "visionary founders", "industry veterans disrupting software",
"decades of combined experience". Let the reader notice instead that these
people have operated companies — they understand procurement, employees,
accounting, customers, compliance, integrations, failure, maintenance, and that
someone must answer when something stops working. A product is not finished when
the interface looks good.

## 8. A different product-development model

`Experience → Problem → Search → Build → Use → Improve → Validate → Decide`

Not `Idea → Pitch → Funding → Growth → Find product-market fit`. PIXDRIFT
products begin with demonstrated utility; commercial packaging comes later.

## 9. Responsibility is part of the product

A hosted PIXDRIFT product is not merely access to software; it is accepting
operational responsibility: security, monitoring, backups, maintenance, incident
handling, documentation, support, release management, data protection,
infrastructure and lifecycle management. Never make absolute promises ("never
fails", "completely secure"); demonstrate professional operational discipline.

## 10–12. Corporate story (canonical copy)

**Full ("Why we build").** PIXDRIFT grew out of a recurring experience. After
years of building and operating businesses, we repeatedly encountered small but
consequential problems that sat between the systems we already used. We looked
for software to solve them. Sometimes it existed — and we used it. Sometimes it
almost existed. And sometimes the obvious solution simply wasn't there, so we
built what we needed. Most of these projects began as internal tools, used,
changed and improved because they had to work in real operating environments.
Occasionally one became something more: it solved the problem unusually well,
other organizations had the same problem, and internal software became worth
maintaining for others. At that point we make a choice — some software remains
internal, some is released as open source, and some becomes a PIXDRIFT product:
professionally hosted, secured, documented, supported and maintained by us. That
is how PIXDRIFT grows — not by searching for categories to disrupt, but by
building the software we thought should already exist.

**Short.** PIXDRIFT develops software from practical operational problems. Many
of our systems begin as tools we build for ourselves after discovering that the
obvious solution simply does not exist. When one proves useful beyond our own
organization, we either release it openly or take responsibility for operating
it as a supported PIXDRIFT product.

**Micro (footer/metadata).** Practical software for the gaps between systems.
Developed from real operational needs and maintained by Landvex.

## 13. Communication test (run before publishing copy)

- Could this have been written by any SaaS startup? → rewrite.
- Does it sound like we are trying to convince investors? → rewrite.
- Are we claiming experience instead of demonstrating it? → rewrite.
- Are we manufacturing a problem to justify a product? → remove it.
- Does the product have a concrete reason to exist? If no → do not publish.
- Would an experienced operator recognize the problem? If yes → explain it plainly.

## 14. Language architecture

English is canonical. All original product descriptions, documentation, interface
terminology, corporate content, specifications, release information and metadata
have an authoritative English source; translations derive from it. Never maintain
separately diverging versions of the same content. Localization is supported from
the first commit. Initial language infrastructure accommodates at least: English,
Swedish, German, French, Dutch, Spanish, Italian, Norwegian, Danish, Finnish.
Launch languages may vary by product; English remains canonical.

## 15. Translation principle

Preserve meaning, not words. Product terminology uses a controlled registry
(`src/lib/pixdrift/terminology.ts`): each important concept has a canonical
English term, a definition, context, approved translations and any
prohibited/legacy terms, so terminology does not drift across products.

## 16. Future PIXDRIFT platform

The public website is the first layer of a larger information architecture. Do
not prematurely build these, but do not make them unnecessarily hard later:
PIXDRIFT Identity, Account, Organization, Product Registry, Documentation,
Status, Billing, Support, Notifications, Permissions, API, Developer, Open
Source. The website is the first implementation of that architecture.

## 17. Final principle

PIXDRIFT does not begin with products. It begins with problems. We do not build
what already works well; we build when an important piece is missing. We use what
we build, improve it until it works properly, and when it becomes useful beyond
ourselves we decide whether to share it or operate it. **The layer between
systems. Built because it was missing.**
