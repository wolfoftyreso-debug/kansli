/**
 * PIXDRIFT platform information architecture (doctrine §16).
 *
 * The public website is the FIRST implementation of a larger information model.
 * pixdrift.com may later become the entrance to products, account, organization,
 * documentation, open source, status and shared services. We do NOT build those
 * systems now — but the model is defined from the first commit so the site does
 * not have to be re-architected to grow into a product ecosystem.
 *
 * `present` surfaces are live in this repo today. `planned` surfaces are modeled
 * only — never presented publicly as promises or a roadmap.
 */

export type SurfaceStatus = "present" | "planned";

export interface PlatformSurface {
  id: string;
  name: string;
  purpose: string;
  status: SurfaceStatus;
  /** Route/host that implements this surface today (present surfaces only). */
  route?: string;
}

export const platformSurfaces: PlatformSurface[] = [
  {
    id: "product-registry",
    name: "PIXDRIFT Product Registry",
    purpose: "The catalog of systems — the single structured source for every product.",
    status: "present",
    route: "/systems",
  },
  {
    id: "documentation",
    name: "PIXDRIFT Documentation",
    purpose: "Structured, consistent documentation for every system.",
    status: "present",
    route: "/documentation",
  },
  {
    id: "identity",
    name: "PIXDRIFT Identity",
    purpose: "One identity and single sign-on across the family.",
    status: "present",
    route: "/systems/identity",
  },
  {
    id: "account",
    name: "PIXDRIFT Account",
    purpose: "A person's account across systems.",
    status: "planned",
  },
  {
    id: "organization",
    name: "PIXDRIFT Organization",
    purpose: "The tenant: members, access and settings across systems.",
    status: "planned",
  },
  {
    id: "status",
    name: "PIXDRIFT Status",
    purpose: "Operational status of managed products.",
    status: "planned",
  },
  {
    id: "billing",
    name: "PIXDRIFT Billing",
    purpose: "Subscriptions and invoicing for managed products.",
    status: "planned",
  },
  {
    id: "support",
    name: "PIXDRIFT Support",
    purpose: "Support for operated products.",
    status: "planned",
  },
  {
    id: "notifications",
    name: "PIXDRIFT Notifications",
    purpose: "Cross-system notifications.",
    status: "planned",
  },
  {
    id: "permissions",
    name: "PIXDRIFT Permissions",
    purpose: "Roles and permissions across systems.",
    status: "planned",
  },
  {
    id: "api",
    name: "PIXDRIFT API",
    purpose: "Programmatic access to the platform.",
    status: "planned",
  },
  {
    id: "developer",
    name: "PIXDRIFT Developer",
    purpose: "Developer resources and integrations.",
    status: "planned",
  },
  {
    id: "open-source",
    name: "PIXDRIFT Open Source",
    purpose: "Components published openly.",
    status: "planned",
  },
];

export const presentSurfaces = platformSurfaces.filter((s) => s.status === "present");
export const plannedSurfaces = platformSurfaces.filter((s) => s.status === "planned");
