import type { ReactNode } from "react";
import Link from "next/link";
import { APP_HOME, appPath } from "@/lib/platform/paths";

export type Crumb = {
  href: string;
  label: string;
};

export function ProductCrumb({
  crumbs,
  homeHref = APP_HOME,
}: {
  crumbs: readonly Crumb[];
  homeHref?: string;
}) {
  return (
    <nav aria-label="Plats" className="pd-label pd-crumb text-faint">
      <Link href={homeHref}>PIXDRIFT</Link>
      {crumbs.map((crumb) => (
        <span key={`${crumb.href}:${crumb.label}`}>
          {" / "}
          <Link href={crumb.href}>{crumb.label}</Link>
        </span>
      ))}
    </nav>
  );
}

/** Product name in running text — only when that page exists. */
export function SystemLink({ id, children }: { id: string; children: ReactNode }) {
  const href = appPath(id);
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="underline decoration-line underline-offset-4 hover:text-ink">
      {children}
    </Link>
  );
}
