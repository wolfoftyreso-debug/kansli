# PIXDRIFT — Information Architecture

The public website is the **first implementation of a larger information model**
(doctrine §16). It is built so that pixdrift.com can later become the entrance to
the full product ecosystem — products, account, organization, documentation,
open source, status, support and shared services — **without re-architecting**.
We do not build those systems now; we only make sure today's model does not make
tomorrow's platform unnecessarily difficult.

## Principles

- **Content, design and product data are separate.** Product facts live in
  structured sources (`src/lib/pixdrift/*`), never hardcoded in components. The
  same data feeds homepage, systems index, product pages, documentation,
  metadata and sitemap — and later, APIs.
- **English is canonical** (`brand.canonicalLocale = "en"`); translations derive
  from it. Localization is possible from the first commit.
- **Planned surfaces are modeled, not promised.** `platformSurfaces` marks each
  surface `present` or `planned`. Planned surfaces are never presented publicly
  as a roadmap.

## Surfaces (present today)

| Surface | Implements | Route |
| --- | --- | --- |
| PIXDRIFT Product Registry | The systems catalog (`systems.ts`) | `/systems` |
| PIXDRIFT Documentation | Structured docs + terminology | `/documentation` |
| PIXDRIFT Capability Graph | Generated from the MCP registry | `/documentation/capabilities` |
| PIXDRIFT Identity | SSO / OIDC provider (operational) | `/systems/identity`, `/idp` |

Authenticated hub (kansli) lives at `/kansli`; the IdP is co-located at `/idp`.

## Surfaces (planned — modeled only)

Account, Organization, Status, Billing, Support, Notifications, Permissions,
API, Open Source. Defined in `src/lib/pixdrift/platform.ts` as `planned` so
navigation, data and routing can grow into them deliberately. Developer is
`present` at `/documentation/mcp`. Capability Graph is `present` at
`/documentation/capabilities`.

## How growth happens without a rewrite

- A new **product** is one entry in `systems.ts` (the Product Registry) — no page
  or component changes. Product pages are a standardized template
  (`/systems/[slug]`, sections 01–10) driven entirely by data.
- A new **platform surface** is promoted from `planned` to `present` in
  `platform.ts` and given a route; the model already accounts for it.
- **Documentation** is tracked as machine-readable coverage
  (`@pixdrift/doc-intel`) so unknown coverage is never assumed complete.
- **Terminology** is a controlled registry (`terminology.ts`) so terms do not
  drift as the surface count grows.

## Brand expressions

- **THE LAYER BETWEEN SYSTEMS.** — what PIXDRIFT is.
- **BUILT BECAUSE IT WAS MISSING.** — why the products exist.

Both are canonical in `brand.ts` (`tagline`, `secondaryTagline`) and recur across
the site (hero, footer) and this architecture.
