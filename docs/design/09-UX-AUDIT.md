# 09 — UX audit (product intelligence pass)

Systematic review of the running surfaces against converging patterns from
established products (via Mobbin), rendered screenshots at 390px and 1366px,
and the locked visual contract (00–08). Not a redesign. Preserve before replace.

## Who / why / where

| Question | Answer |
| --- | --- |
| WHO | Workshop staff and office admins in vehicle-service groups; Landvex house ops; guest signers (IRMA) and prospects (New customer). |
| WHY | Book a sale, receive a vehicle, follow up money, sign an agreement, check counterparty, watch operations. |
| WHAT | Customers, vehicles, wheel sets, invoices, agreements, inquiries, events. |
| FREQUENCY | TYRA intake and Ekonomi booking daily; IRMA/CREDITAE weekly; drift board on demand; New customer once per prospect. |
| CRITICALITY | Booking issues a real invoice; IRMA L1 confirms an agreement; SMS sends are irreversible. |
| EXPERTISE | Professional but not technical. Workshop use is standing, gloved, phone-first. |
| ENVIRONMENT | Workshop counter (mobile), office (desktop), guest phone (IRMA link, New customer). |

## Surface map (priority order)

| Surface | Primary action | Frequency | Risk | Quality before this pass |
| --- | --- | --- | --- | --- |
| Chrome (Facade topbar/rail) | Move between rooms | Every visit | Low | Broken at 390px: wordmark and room label overlapped, four text controls competed |
| /tyra | Receive vehicle | Daily | Medium | Good; standard 36px fields on a phone-first surface (P2) |
| /ekonomi | Book sale | Daily | High (real invoice) | Good; chart axis text ~6px rendered on mobile (P2) |
| /upphandling (New customer) | Submit intake | Per prospect | Medium | Stacked fine but 36px fields, 16px checkboxes, hand-rolled selects |
| /irma + /irma/l/[token] | Create/confirm agreement | Weekly | High | Guest leg already uses large fields — KEEP |
| /platform/drift | Watch ops | On demand | High (blind ops) | Type errors broke `next build` (P0) |
| /kansli, /alva, /creditae, /tora, /rita, /britt | Room work | Weekly | Medium | Sound structure; shared primitives |

## Benchmarks used (converging patterns, not copies)

- Compact app bars in professional tools — [Xero](https://mobbin.com/screens/150ecc65-95b9-4ce2-8671-d6c2651c5a4f), [Circle](https://mobbin.com/screens/c1b1c3ad-57ca-4bcc-85fd-3d9e4c062498), [Jira](https://mobbin.com/screens/69749b02-5134-4de3-8082-387518ec9a84): brand left, one calm row, rare account actions (profile, org, sign out) collapse into a single menu. Never four competing text controls on a phone.
- Phone intake forms — [Revolut Business "submit a request"](https://mobbin.com/flows/031edeb6-1f1a-46a0-bbdc-4d524d610768), [Qantas contact details](https://mobbin.com/flows/fe3fcea5-4115-488e-9a6d-788e5421f271), [Linktree form](https://mobbin.com/flows/2ab9ea32-5534-4182-9452-468d8849955e): ~48px inputs, one column, full-width submit, generous vertical rhythm.

## Findings and status

### P0 — fixed in this pass

1. **`next build` failed** — `OpsEventMeasure` unimported in `src/lib/platform/ops.ts`, Swedish runtime literals left in `OpsSnapshot` after the English-canonical migration, narrow `includes` in `structure.ts`, unnarrowed `focus` in `OpsBoard.tsx`, and lint errors from the vendored referens proofs. All fixed; referens is excluded from lint (proofs are not app code).
2. **Mobile topbar collision (every page)** — at 390px the PIXDRIFT wordmark and room label rendered on top of each other and "Switch company" wrapped inside the 36px bar. Fixed: room label shows from `sm` (the breadcrumb + H1 carry context below), identity label from `lg`, switch-company from `md`, and org switching moved into the mobile Menu under a "Companies" heading. No-wrap on all bar controls.

### P1 — fixed

3. **New customer form ergonomics** — the public intake ("kontakten") used 36px fields, 16px checkbox targets and two hand-rolled `rounded-md` selects. Fixed: all fields/selects/checkboxes use the `large` (48px) variants; selects extracted into a shared `SelectField` matching `Field`.
4. **TYRA intake and Ekonomi "Nytt sälj"** — workshop-counter and sales booking now use the `large` (48px) `Field` / `SelectField` / `CheckField` / `Submit`. Intent, VAT and line kind use `SelectField` (no empty option when a default is set). Desktop keeps the two-column grid; density is the form, not the case list.

### P2 — known, not changed here

5. SalesBoard/OpsBoard chart axis text is ~6px rendered at 390px (11px inside a 720-wide viewBox). Consider a mobile tick size or fewer ticks.
6. The Kansli session card exposes the engine name in the mono meta row; review whether the vendor/model belongs in the customer-facing room or only in /platform/drift.
7. Hand-rolled `rounded-md` selects remain in tyra/alva/ekonomi/creditae *detail* pages. Visually square (facade nulls radius) but should migrate to `SelectField` when each room is next touched.

### P3 — polish backlog

8. Topbar controls are 36px tall (bar height); benchmark is 44px+. Acceptable for a dense pro tool; revisit if tap errors are reported.
9. Menu `<details>` closes only on navigation, not on outside tap. Native and predictable; leave unless users report it.

## KEEP (do not touch)

- Sign-in gates per room with plain-language explanation and one action.
- IRMA guest leg: large fields, one column, one confirm — already at benchmark.
- One accent per view, zero radius, status as shape+color — the contract holds on all rendered screens.
- The breadcrumb + H1 pattern in rooms: it is why the topbar room label can yield on phones.

## Interaction grammar (as verified)

- Navigation: rail ≥ md, Menu < md; wordmark is always the way home.
- Primary action: one per view, ink-on-paper block button; guest/phone surfaces use the `large` 48px variants.
- Forms: `Field`/`SelectField`/`CheckField` from `SignInGate`; labels above, errors as `Notice` at the top of the form.
- Status: word + shape + color, `blocked` always shows the 2px left edge.
- Motion: `pd-float` only, frozen under `prefers-reduced-motion`.
